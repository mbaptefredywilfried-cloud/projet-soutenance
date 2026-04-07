<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_csrf.php';
require_once '../auth/require_auth.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !$data['id']) {
    echo json_encode(["status" => "error", "message" => "ID manquant", "data" => null]);
    exit;
}

$user_id = $_SESSION['user_id'];
$budget_id = intval($data['id']);

try {
    $stmt = $pdo->prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?");
    $stmt->execute([$budget_id, $user_id]);
    echo json_encode(["status" => "success", "message" => "Budget supprimé", "data" => null]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur serveur", "data" => null]);
}
?>
