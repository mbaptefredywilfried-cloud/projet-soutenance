<?php
/**
 * Inscription - Crée un nouvel utilisateur
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../config/db_connect.php';

// Récupérer les données POST
$username = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';
$confirm_password = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

// Vérifier les données
if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    header('Location: ../../inscription.html?error=missing');
    exit();
}

// Validation
if (strlen($username) < 3) {
    http_response_code(400);
    header('Location: ../../inscription.html?error=username_short');
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    header('Location: ../../inscription.html?error=invalid_email');
    exit();
}

if (strlen($password) < 8) {
    http_response_code(400);
    header('Location: ../../inscription.html?error=password_short');
    exit();
}

// Vérification de confirmation côté serveur (double vérification)
if ($password !== $confirm_password) {
    http_response_code(400);
    header('Location: ../../inscription.html?error=password_mismatch');
    exit();
}

// Vérifier si l'utilisateur existe
$check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
if (!$check) {
    http_response_code(500);
    header('Location: ../../inscription.html?error=db_error');
    exit();
}

$check->bind_param("ss", $username, $email);
$check->execute();
$result = $check->get_result();

if ($result->num_rows > 0) {
    http_response_code(409);
    header('Location: ../../inscription.html?error=user_exists');
    $check->close();
    exit();
}
$check->close();

// Générer l'ID au format AD_XXX
$lastUserQuery = $conn->query("SELECT id FROM users ORDER BY id DESC LIMIT 1");
$lastUser = $lastUserQuery->fetch_assoc();
$lastUserId = $lastUser ? $lastUser['id'] : 'AD_000';

// Extraire le numéro de l'ID
$lastNumber = (int)substr($lastUserId, 3);
$newNumber = $lastNumber + 1;
$newUserId = 'AD_' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);

// Hasher le mot de passe
$hashed = password_hash($password, PASSWORD_DEFAULT);

// Insérer l'utilisateur avec l'ID généré
$insert = $conn->prepare("INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)");
if (!$insert) {
    http_response_code(500);
    header('Location: ../../inscription.html?error=db_error');
    exit();
}

$insert->bind_param("ssss", $newUserId, $username, $email, $hashed);

if ($insert->execute()) {
    $user_id = $newUserId;
    
    // Créer la session
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
    $_SESSION['email'] = $email;
    
    $insert->close();
    $conn->close();
    
    // Redirection vers inscription avec paramètre de succès
    header('Location: ../../inscription.html?success=1');
    exit();
} else {
    http_response_code(500);
    header('Location: ../../inscription.html?error=registration_failed');
    exit();
}

$insert->close();
$conn->close();

?>
