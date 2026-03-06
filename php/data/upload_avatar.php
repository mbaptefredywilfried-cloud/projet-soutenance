<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Non authentifié"]);
    exit;
}

$user_id = $_SESSION['user_id'];

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "error" => "Aucun fichier reçu"]);
    exit;
}

$allowed = ['jpg', 'jpeg', 'png'];
$ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowed)) {
    echo json_encode(["success" => false, "error" => "Format non autorisé"]);
    exit;
}

$uploadDir = '../../assets/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}
$filename = 'avatar_' . $user_id . '_' . time() . '.' . $ext;
$target = $uploadDir . $filename;

if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $target)) {
    echo json_encode(["success" => false, "error" => "Erreur lors de l'upload"]);
    exit;
}

// Chemin relatif pour affichage web
$relativePath = 'assets/avatars/' . $filename;

// Met à jour le champ image dans la table users
$stmt = $pdo->prepare("UPDATE users SET image = ? WHERE id = ?");
$stmt->execute([$relativePath, $user_id]);

if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => true, "image" => $relativePath]);
} else {
    echo json_encode(["success" => false, "error" => "Impossible de mettre à jour la base"]);
}
exit;
