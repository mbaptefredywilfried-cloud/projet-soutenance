<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT t.*, c.name AS category_name, c.type AS category_type
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.date DESC");
$stmt->execute([$user_id]);
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => "success",
    "message" => "Transactions récupérées",
    "data" => $transactions
]);
?>