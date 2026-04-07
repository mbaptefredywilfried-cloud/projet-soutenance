<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_csrf.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Non authentifié"]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Suppression des données liées à l'utilisateur
try {
    // Suppression des transactions
    $pdo->prepare("DELETE FROM transactions WHERE user_id = ?")->execute([$user_id]);
    // Suppression des budgets
    $pdo->prepare("DELETE FROM budgets WHERE user_id = ?")->execute([$user_id]);
    // Suppression des catégories ignorée (pas de colonne user_id)
    // Suppression du profil utilisateur
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
    // Déconnexion
    session_destroy();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
exit;
