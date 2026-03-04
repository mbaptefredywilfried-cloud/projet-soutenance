<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['id'])) {
    echo json_encode(["status" => "error", "message" => "ID manquant", "data" => null]);
    exit;
}

$user_id = $_SESSION['user_id'];
$id = (int)$data['id'];

$stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user_id]);

echo json_encode(["status" => "success", "message" => "Transaction supprimée", "data" => null]);
?>