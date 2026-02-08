<?php
/**
 * Gestion des Catégories
 * Récupère les catégories disponibles
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

// Récupérer toutes les catégories
$result = $conn->query("SELECT id, name, description, icon FROM categories ORDER BY name");

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données']);
    exit();
}

$categories = [];
while ($row = $result->fetch_assoc()) {
    $categories[] = $row;
}

echo json_encode(['success' => true, 'data' => $categories]);

$conn->close();

?>
