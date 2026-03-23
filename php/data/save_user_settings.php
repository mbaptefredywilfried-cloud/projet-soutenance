<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

$accent = isset($data['accent_gradient']) ? $data['accent_gradient'] : 'linear-gradient(180deg, #36A2EB 0%, #36A2EB 100%)';
$lang = isset($data['language']) ? $data['language'] : 'fr';
$currency = isset($data['currency']) ? $data['currency'] : 'EUR';

try {
    $sql = "INSERT INTO user_settings (user_id, accent_gradient, language, currency) VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE accent_gradient = VALUES(accent_gradient), language = VALUES(language), currency = VALUES(currency), updated_at = CURRENT_TIMESTAMP";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$user_id, $accent, $lang, $currency]);
    if ($success) {
        echo json_encode(['success' => true, 'user_id' => $user_id]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la sauvegarde', 'user_id' => $user_id]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Exception: ' . $e->getMessage(), 'user_id' => $user_id]);
}
