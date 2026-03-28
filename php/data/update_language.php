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

$language = isset($data['language']) ? trim($data['language']) : 'fr';

// Valider la langue
if (!in_array($language, ['fr', 'en'])) {
    $language = 'fr';
}

try {
    // Essayer d'insérer ou mettre à jour dans user_settings
    $sql = "INSERT INTO user_settings (user_id, language) VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE language = VALUES(language), updated_at = CURRENT_TIMESTAMP";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$user_id, $language]);
    
    if ($success) {
        // Mettre à jour la session
        $_SESSION['language'] = $language;
        echo json_encode(['success' => true, 'language' => $language]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la mise à jour']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
