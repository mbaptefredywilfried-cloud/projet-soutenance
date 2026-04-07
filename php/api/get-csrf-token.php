<?php
/**
 * Endpoint pour récupérer le token CSRF
 * À appeler en GET par le client pour obtenir un token
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// Le token est initialisé automatiquement dans database.php via CSRFToken::init()
$token = CSRFToken::getToken();

if (!$token) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Impossible de générer le token CSRF'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'token' => $token
]);
?>
