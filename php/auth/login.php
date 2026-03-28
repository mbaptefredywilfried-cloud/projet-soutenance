<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email'], $data['password'])) {
    echo json_encode(["status" => "error", "message" => "Champs manquants"]);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];
$language = $data['language'] ?? 'fr';

// Valider que la langue est parmi les langues supportées
if (!in_array($language, ['fr', 'en'])) {
    $language = 'fr';
}

$stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['language'] = $language;
    // Mettre à jour la date de dernière connexion
    $stmtUpdate = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmtUpdate->execute([$user['id']]);
    echo json_encode(["status" => "success", "message" => "Connexion réussie"]);
} else {
    echo json_encode(["status" => "error", "message" => "Email ou mot de passe incorrect"]);
}
?>
