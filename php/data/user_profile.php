<?php
/**
 * Gestion du Profil Utilisateur
 * Récupère et met à jour le profil de l'utilisateur
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../config/db_connect.php';

// Vérifier l'authentification
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit();
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// Traiter les actions
if ($action === 'get') {
    // Récupérer le profil
    $stmt = $conn->prepare("SELECT id, username, email, created_at, last_login FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
    } else {
        $user = $result->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    }
    
    $stmt->close();
    
} elseif ($action === 'update') {
    // Mettre à jour le profil
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        exit();
    }

    $username = isset($input['username']) ? $input['username'] : null;
    $email = isset($input['email']) ? $input['email'] : null;
    $phone = isset($input['phone']) ? $input['phone'] : null;

    $fields = [];
    $types = '';
    $values = [];

    if ($username !== null) { $fields[] = 'username = ?'; $types .= 's'; $values[] = $username; }
    if ($email !== null) { $fields[] = 'email = ?'; $types .= 's'; $values[] = $email; }
    if ($phone !== null) { $fields[] = 'phone = ?'; $types .= 's'; $values[] = $phone; }

    if (count($fields) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucun champ à mettre à jour']);
        exit();
    }

    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $types .= 'i';
    $values[] = $user_id;

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur préparation requête']);
        exit();
    }

    // bind_param dynamique
    $bindNames[] = $types;
    for ($i = 0; $i < count($values); $i++) {
        $bindNames[] = &$values[$i];
    }
    call_user_func_array([$stmt, 'bind_param'], $bindNames);

    if ($stmt->execute()) {
        if ($username !== null) $_SESSION['username'] = $username;
        if ($email !== null) $_SESSION['email'] = $email;
        echo json_encode(['success' => true, 'message' => 'Profil mis à jour']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
    }

    $stmt->close();
    
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Action invalide']);
}

$conn->close();

?>
