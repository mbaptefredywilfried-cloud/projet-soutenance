<?php
/**
 * Connexion - Authentifie un utilisateur et crée une session
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../config/db_connect.php';

// Récupérer les données JSON
$input = json_decode(file_get_contents('php://input'), true);

// Vérifier les données
if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email et mot de passe requis']);
    exit();
}

$email = trim($input['email']);
$password = $input['password'];

// Valider l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email invalide']);
    exit();
}

// Récupérer l'utilisateur
$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE email = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données']);
    exit();
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect']);
    $stmt->close();
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

// Vérifier le mot de passe
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect']);
    exit();
}

// Créer la session
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $email;

// Mettre à jour last_login
$update = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
if ($update) {
    $update->bind_param("i", $user['id']);
    $update->execute();
    $update->close();
}

echo json_encode([
    'success' => true,
    'message' => 'Connexion réussie',
    'user_id' => $user['id'],
    'username' => $user['username'],
    'email' => $email
]);

$conn->close();

?>
