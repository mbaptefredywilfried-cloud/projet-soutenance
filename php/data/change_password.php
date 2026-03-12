<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once '../config/database.php';



if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Utilisateur non authentifié']);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$old_password = $data['old_password'] ?? '';
$new_password = $data['new_password'] ?? '';

if (!$old_password || !$new_password) {
    echo json_encode(['success' => false, 'error' => 'Champs obligatoires manquants']);
    exit;
}

if (strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères']);
    exit;
}

// Vérifier l'ancien mot de passe
$stmt = $pdo->prepare('SELECT password FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
    exit;
}

if (!password_verify($old_password, $user['password'])) {
    echo json_encode(['success' => false, 'error' => 'Ancien mot de passe incorrect']);
    exit;
}

// Mettre à jour le mot de passe
$new_hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
$stmt->execute([$new_hash, $user_id]);

if ($stmt->rowCount()) {
    echo json_encode(['success' => true, 'message' => 'Mot de passe mis à jour avec succès']);
} else {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la mise à jour']);
}
exit;
