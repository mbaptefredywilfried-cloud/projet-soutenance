<?php
/**
 * Gestion des Transactions
 * CRUD pour les transactions
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
if ($action === 'list') {
    // Lister les transactions
    $stmt = $conn->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    $stmt->close();
    echo json_encode(['success' => true, 'data' => $transactions]);
    
} elseif ($action === 'add') {
    // Ajouter une transaction
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['description']) || !isset($input['amount']) || !isset($input['type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        exit();
    }
    
    $description = $input['description'];
    $amount = floatval($input['amount']);
    $category_id = isset($input['category_id']) ? intval($input['category_id']) : null;
    $type = $input['type'];
    $date = isset($input['date']) ? $input['date'] : date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("INSERT INTO transactions (user_id, description, amount, category_id, type, date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isdiss", $user_id, $description, $amount, $category_id, $type, $date);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
    }
    
    $stmt->close();
    
} elseif ($action === 'delete') {
    // Supprimer une transaction
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID manquant']);
        exit();
    }
    
    $id = intval($input['id']);
    
    $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $id, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Transaction supprimée']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
    }
    
    $stmt->close();
    
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Action invalide']);
}

$conn->close();

?>
