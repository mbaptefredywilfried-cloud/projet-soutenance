<?php
/**
 * Middleware de Rate Limiting
 * À inclure au début des endpoints sensibles
 * 
 * Usage:
 * require_once __DIR__ . '/require_rate_limit.php';
 * $rateLimit->check('login', $email);
 */

require_once __DIR__ . '/../config/rate_limit.php';

class RateLimitMiddleware {
    private $action;

    public function __construct($action) {
        $this->action = $action;
    }

    /**
     * Vérifie la limite de taux
     * @param string $identifier Email, username, ou autre identifiant unique
     * @throws Exception Si la limite est dépassée
     */
    public function check($identifier = null) {
        $result = RateLimit::checkLimit($this->action, $identifier);

        if (!$result['allowed']) {
            http_response_code(429); // Too Many Requests
            header('Retry-After: ' . ($result['retry_after'] ?? 300));
            header('Content-Type: application/json; charset=utf-8');
            
            echo json_encode([
                'status' => 'error',
                'message' => $result['message'],
                'retry_after' => $result['retry_after'] ?? 300,
                'code' => 'RATE_LIMIT_EXCEEDED'
            ]);
            exit;
        }
    }

    /**
     * Enregistre une tentative
     * @param string $identifier Email, username, ou autre identifiant
     * @param bool $success Si la tentative a réussi
     */
    public function record($identifier = null, $success = false) {
        RateLimit::recordAttempt($this->action, $identifier, $success);
    }

    /**
     * Change l'action (utile si détection auto ne fonctionne pas)
     */
    public function setAction($action) {
        $this->action = $action;
        return $this;
    }
}

// Factory function pour créer une instance
function getRateLimitMiddleware($action) {
    return new RateLimitMiddleware($action);
}

// Créer une instance vide (sera configurée par chaque endpoint)
$rateLimit = null;
?>
