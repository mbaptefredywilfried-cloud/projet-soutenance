<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("DELETE FROM transactions WHERE user_id = ?");
$stmt->execute([$user_id]);

if ($stmt->rowCount() > 0) {
    echo json_encode(["status" => "success", "message" => "Toutes les transactions supprimées", "data" => null]);
} else {
    echo json_encode(["status" => "success", "message" => "Aucune transaction à supprimer", "data" => null]);
}
?>
