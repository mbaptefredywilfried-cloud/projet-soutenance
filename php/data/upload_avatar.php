<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once '../config/database.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Erreur config: " . $e->getMessage()]);
    exit;
}

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
$allowedMimes = ['image/jpeg', 'image/png'];

$ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowed)) {
    echo json_encode(["success" => false, "error" => "Format non autorisé"]);
    exit;
}

// Vérification du type MIME réel (pas juste l'extension)
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$realMime = finfo_file($finfo, $_FILES['avatar']['tmp_name']);
finfo_close($finfo);
if (!in_array($realMime, $allowedMimes)) {
    echo json_encode(["success" => false, "error" => "Type de fichier invalide"]);
    exit;
}

// Vérifier que c'est bien une image valide
if (!getimagesize($_FILES['avatar']['tmp_name'])) {
    echo json_encode(["success" => false, "error" => "Fichier image corrompu"]);
    exit;
}

// Limite de taille : 2 Mo
if ($_FILES['avatar']['size'] > 2 * 1024 * 1024) {
    echo json_encode(["success" => false, "error" => "L'image ne doit pas dépasser 2 Mo"]);
    exit;
}

$uploadDir = '../../assets/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
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
