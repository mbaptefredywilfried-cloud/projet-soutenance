<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

$action = isset($_GET['action']) ? $_GET['action'] : null;

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Non authentifié"]);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($action === 'get') {
    $stmt = $pdo->prepare("SELECT id, name as username, email, phone, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "error" => "Utilisateur introuvable"]);
    }
    exit;
}

if ($action === 'update') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = isset($data['username']) ? trim($data['username']) : null;
    $email = isset($data['email']) ? trim($data['email']) : null;
    $phone = isset($data['phone']) ? trim($data['phone']) : null;
    if (!$username || !$email) {
        echo json_encode(["success" => false, "error" => "Champs manquants"]);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "error" => "Email invalide"]);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
    $stmt->execute([$username, $email, $phone, $user_id]);
    echo json_encode(["success" => true, "message" => "Profil mis à jour !"]);
    exit;
}

echo json_encode(["success" => false, "error" => "Action inconnue"]);
exit;
