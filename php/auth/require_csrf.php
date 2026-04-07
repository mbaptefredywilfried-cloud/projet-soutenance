<?php
/**
 * Middleware de validation CSRF pour POST/PUT/DELETE/PATCH
 * À inclure avant le traitement de requête sensible
 */

require_once __DIR__ . '/../config/csrf.php';

// Récupérer la méthode HTTP réelle (vérifie X-HTTP-Method-Override aussi)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

// Méthodes qui modifient les données
$modifyingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

if (in_array($method, $modifyingMethods)) {
    // Initialiser le token CSRF s'il n'existe pas
    CSRFToken::init();

    // Récupérer le token depuis la requête
    $requestToken = CSRFToken::getRequestToken();

    // Valider le token
    if (!CSRFToken::validate($requestToken)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'Token CSRF invalide ou manquant',
            'error' => 'CSRF_VALIDATION_FAILED'
        ]);
        exit;
    }
}

// GET requests peuvent aussi appeler getToken() si nécessaire
if ($method === 'GET') {
    CSRFToken::init();
}
?>
