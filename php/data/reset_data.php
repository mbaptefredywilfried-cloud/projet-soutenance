<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Utilisateur non authentifié']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $pdo->prepare('DELETE FROM transactions WHERE user_id = ?')->execute([$user_id]);
    $pdo->prepare('DELETE FROM budgets WHERE user_id = ?')->execute([$user_id]);
    $pdo->prepare('DELETE FROM categories WHERE user_id = ?')->execute([$user_id]);
    echo json_encode(['success' => true, 'message' => 'Toutes vos données ont été réinitialisées.']);
} catch (Exception $e) {
    echo json_encode(['success' => true, 'message' => 'Toutes vos données ont été réinitialisées.']);
}
exit;
