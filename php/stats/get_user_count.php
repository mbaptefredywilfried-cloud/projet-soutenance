<?php
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

try {
    $query = "SELECT COUNT(*) as total_users FROM users";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "total_users" => intval($result['total_users'])
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur lors de la récupération du nombre d'utilisateurs"
    ]);
}
?>
