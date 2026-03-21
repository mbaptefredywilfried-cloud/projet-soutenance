<?php
error_reporting(0); // Masquer les notices/warnings pour garantir un JSON propre
ini_set('display_errors', 0);
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();


$action = isset($_GET['action']) ? $_GET['action'] : null;


if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Non authentifié"]);
    exit;
}
$user_id = $_SESSION['user_id'];

// --- TRAITEMENT DE LA MISE À JOUR DU PROFIL ---
if ($action === 'update') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = isset($input['username']) ? trim($input['username']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $phone = isset($input['phone']) ? trim($input['phone']) : null;

    // Validation simple
    if ($username === '' || $email === '') {
        echo json_encode(["success" => false, "error" => "Nom et email obligatoires"]);
        exit;
    }

    // Vérifier unicité de l'email (hors utilisateur courant)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1");
    $stmt->execute([$email, $user_id]);
    if ($stmt->fetch()) {
        echo json_encode(["success" => false, "error" => "Cet email est déjà utilisé"]);
        exit;
    }

    // Mise à jour
    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
    $ok = $stmt->execute([$username, $email, $phone, $user_id]);
    if ($ok) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Erreur lors de la mise à jour"]);
    }
    exit;
}

if ($action === 'get_profile') {
    $stmt = $pdo->prepare("SELECT id, name as username, email, phone, created_at, image, last_login FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "error" => "Utilisateur introuvable"]);
    }
    exit;
}

if ($action === 'get_settings') {
    $stmt = $pdo->prepare("SELECT accent_gradient, language, currency FROM user_settings WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo json_encode(["success" => true, "settings" => $row]);
    } else {
        echo json_encode(["success" => true, "settings" => null]);
    }
    exit;
}

// Par défaut, renvoyer profil + settings
$stmt = $pdo->prepare("SELECT id, name as username, email, phone, created_at, image, last_login FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Charger les settings utilisateur (accent_gradient, language, currency)
$stmt2 = $pdo->prepare("SELECT accent_gradient, language, currency FROM user_settings WHERE user_id = ? LIMIT 1");
$stmt2->execute([$user_id]);
$settings = $stmt2->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode(["success" => true, "user" => $user, "settings" => $settings]);
} else {
    echo json_encode(["success" => false, "error" => "Utilisateur introuvable"]);
}
exit;
