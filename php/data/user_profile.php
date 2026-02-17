<?php
// php/data/user_profile.php
header('Content-Type: application/json');
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}
require_once __DIR__ . '/../config/database.php';
$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare('SELECT id, username, email, created_at FROM users WHERE id = :id');
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch();
if ($user) {
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    echo json_encode(['success' => false, 'error' => 'Utilisateur non trouvé']);
}
