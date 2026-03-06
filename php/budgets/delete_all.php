<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$user_id = $_SESSION['user_id'];
try {
    $stmt = $pdo->prepare('DELETE FROM budgets WHERE user_id = ?');
    $stmt->execute([$user_id]);
    echo json_encode(["status" => "success", "message" => "Tous les budgets ont été supprimés."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur serveur."]);
}
?>
