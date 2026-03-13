<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email'], $data['password'])) {
    echo json_encode(["status" => "error", "message" => "Champs manquants"]);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

$stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    // Mettre à jour la date de dernière connexion
    $stmtUpdate = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmtUpdate->execute([$user['id']]);
    echo json_encode(["status" => "success", "message" => "Connexion réussie"]);
} else {
    echo json_encode(["status" => "error", "message" => "Email ou mot de passe incorrect"]);
}
?>