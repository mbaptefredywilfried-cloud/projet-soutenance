<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Exemple de récupération depuis la base de données
try {
    $stmt = $pdo->query("SELECT id, name, type, translation_key FROM categories");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        "status" => "success",
        "categories" => $categories
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erreur lors de la récupération des catégories"
    ]);
}
