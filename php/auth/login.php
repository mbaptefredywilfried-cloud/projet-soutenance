<?php
// php/auth/login.php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'error' => 'Champs manquants']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    $_SESSION['user_id'] = $user['id'];
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Identifiants invalides']);
}
