<?php
// php/auth/register.php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$email || !$password) {
    echo json_encode(['success' => false, 'error' => 'Champs manquants']);
    exit;
}

// Vérifier si l'utilisateur existe déjà
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = :username OR email = :email');
$stmt->execute(['username' => $username, 'email' => $email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Utilisateur ou email déjà existant']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (:username, :email, :password_hash, NOW())');
$stmt->execute([
    'username' => $username,
    'email' => $email,
    'password_hash' => $hash
]);

// Récupérer l'id généré par le trigger
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();
session_start();
if ($user && isset($user['id'])) {
    $_SESSION['user_id'] = $user['id'];
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => "Erreur lors de la récupération de l'identifiant utilisateur"]);
}
