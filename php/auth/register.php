<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
file_put_contents(__DIR__.'/debug_register.txt', print_r($data, true));

if (!isset($data['name'], $data['email'], $data['password'])) {
    echo json_encode(["status" => "error", "message" => "Champs manquants"]);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = $data['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Email invalide"]);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $hash]);
    // Connexion automatique après inscription
    $userId = $pdo->lastInsertId();
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_name'] = $name;

    // Thème vert par défaut à la création du compte
    $accent_gradient = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
    $lang = 'fr';
    $currency = 'EUR';
    $stmt2 = $pdo->prepare("INSERT INTO user_settings (user_id, accent_gradient, language, currency) VALUES (?, ?, ?, ?)");
    $stmt2->execute([$userId, $accent_gradient, $lang, $currency]);

    echo json_encode(["status" => "success", "message" => "Inscription réussie"]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(["status" => "error", "message" => "Email déjà utilisé"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Erreur serveur"]);
    }
}
?>