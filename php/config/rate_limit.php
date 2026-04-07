<?php
/**
 * Système de Rate Limiting pour prévenir les attaques par force brute
 * 
 * Limite :
 * - 5 tentatives en 15 minutes par IP
 * - 3 tentatives en 15 minutes par email/username
 * - 10 tentatives en 1 heure par IP (penalty)
 * 
 * Stockage : Fichiers temporaires (pas de DB)
 */

class RateLimit {
    const STORAGE_DIR = __DIR__ . '/../../temp/rate_limit';
    
    // Configuration des limites
    const LIMITS = [
        'login' => [
            'per_ip' => ['attempts' => 5, 'window' => 900], // 5 tentatives en 15 min par IP
            'per_identifier' => ['attempts' => 3, 'window' => 900], // 3 tentatives en 15 min par email
        ],
        'register' => [
            'per_ip' => ['attempts' => 3, 'window' => 3600], // 3 tentatives en 1h par IP
            'per_identifier' => ['attempts' => 2, 'window' => 3600], // 2 tentatives en 1h par email
        ],
        'forgot_password' => [
            'per_ip' => ['attempts' => 5, 'window' => 1800], // 5 tentatives en 30 min par IP
            'per_identifier' => ['attempts' => 3, 'window' => 1800], // 3 tentatives en 30 min par email
        ],
        'verify_otp' => [
            'per_ip' => ['attempts' => 10, 'window' => 900], // 10 tentatives en 15 min par IP
            'per_identifier' => ['attempts' => 5, 'window' => 900], // 5 tentatives en 15 min par email
        ],
        'reset_password' => [
            'per_ip' => ['attempts' => 5, 'window' => 1800], // 5 tentatives en 30 min par IP
            'per_identifier' => ['attempts' => 3, 'window' => 1800], // 3 tentatives en 30 min par email
        ],
    ];

    /**
     * Vérifie si une requête est autorisée selon les limites
     * @param string $action L'action (login, register, etc.)
     * @param string $identifier Email, username, ou identifiant unique
     * @return array ['allowed' => bool, 'retry_after' => int|null, 'message' => string]
     */
    public static function checkLimit($action, $identifier = null) {
        // Créer le dossier de stockage s'il n'existe pas
        self::ensureStorageDir();

        $ip = self::getClientIP();
        
        // Vérifier les limites par IP
        $ipCheck = self::checkIPLimit($action, $ip);
        if (!$ipCheck['allowed']) {
            return $ipCheck;
        }

        // Vérifier les limites par identifiant (email, username)
        if ($identifier !== null) {
            $identifierCheck = self::checkIdentifierLimit($action, $identifier);
            if (!$identifierCheck['allowed']) {
                return $identifierCheck;
            }
        }

        return ['allowed' => true, 'message' => 'OK'];
    }

    /**
     * Enregistre une tentative
     * @param string $action L'action
     * @param string $identifier Identifiant (email, username)
     * @param bool $success Si la tentative a réussi
     */
    public static function recordAttempt($action, $identifier = null, $success = false) {
        $ip = self::getClientIP();
        $now = time();

        // Enregistrer par IP
        self::recordIPAttempt($action, $ip, $now, $success);

        // Enregistrer par identifiant
        if ($identifier !== null) {
            self::recordIdentifierAttempt($action, $identifier, $now, $success);
        }
    }

    /**
     * Récupère l'adresse IP du client
     * @return string
     */
    private static function getClientIP() {
        // Vérifier les en-têtes proxy
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        }

        // Valider et nettoyer l'IP
        return filter_var(trim($ip), FILTER_VALIDATE_IP) ?: '0.0.0.0';
    }

    /**
     * Vérifie les limites par IP
     */
    private static function checkIPLimit($action, $ip) {
        if (!isset(self::LIMITS[$action])) {
            return ['allowed' => true];
        }

        $config = self::LIMITS[$action]['per_ip'];
        $filename = self::STORAGE_DIR . '/' . 'ip_' . hash('sha256', $ip) . '_' . $action . '.json';

        $attempts = self::loadAttempts($filename);
        $attempts = self::cleanOldAttempts($attempts, $config['window']);

        if (count($attempts) >= $config['attempts']) {
            // Trop de tentatives
            $oldestAttempt = min($attempts);
            $retryAfter = ceil($oldestAttempt + $config['window'] - time());
            
            return [
                'allowed' => false,
                'retry_after' => max(0, $retryAfter),
                'message' => "Trop de tentatives. Veuillez réessayer dans " . self::formatTime($retryAfter) . "."
            ];
        }

        return ['allowed' => true];
    }

    /**
     * Vérifie les limites par identifiant
     */
    private static function checkIdentifierLimit($action, $identifier) {
        if (!isset(self::LIMITS[$action])) {
            return ['allowed' => true];
        }

        $config = self::LIMITS[$action]['per_identifier'];
        $filename = self::STORAGE_DIR . '/' . 'id_' . hash('sha256', $identifier) . '_' . $action . '.json';

        $attempts = self::loadAttempts($filename);
        $attempts = self::cleanOldAttempts($attempts, $config['window']);

        if (count($attempts) >= $config['attempts']) {
            $oldestAttempt = min($attempts);
            $retryAfter = ceil($oldestAttempt + $config['window'] - time());
            
            return [
                'allowed' => false,
                'retry_after' => max(0, $retryAfter),
                'message' => "Trop de tentatives pour ce compte. Veuillez réessayer dans " . self::formatTime($retryAfter) . "."
            ];
        }

        return ['allowed' => true];
    }

    /**
     * Enregistre une tentative par IP
     */
    private static function recordIPAttempt($action, $ip, $timestamp, $success) {
        if ($success) {
            // Supprimer les tentatives réussies (token d'accès)
            $filename = self::STORAGE_DIR . '/' . 'ip_' . hash('sha256', $ip) . '_' . $action . '.json';
            if (file_exists($filename)) {
                unlink($filename);
            }
            return;
        }

        $filename = self::STORAGE_DIR . '/' . 'ip_' . hash('sha256', $ip) . '_' . $action . '.json';
        $attempts = self::loadAttempts($filename);
        $attempts[] = $timestamp;

        file_put_contents($filename, json_encode($attempts), LOCK_EX);
    }

    /**
     * Enregistre une tentative par identifiant
     */
    private static function recordIdentifierAttempt($action, $identifier, $timestamp, $success) {
        if ($success) {
            // Supprimer les tentatives réussies
            $filename = self::STORAGE_DIR . '/' . 'id_' . hash('sha256', $identifier) . '_' . $action . '.json';
            if (file_exists($filename)) {
                unlink($filename);
            }
            return;
        }

        $filename = self::STORAGE_DIR . '/' . 'id_' . hash('sha256', $identifier) . '_' . $action . '.json';
        $attempts = self::loadAttempts($filename);
        $attempts[] = $timestamp;

        file_put_contents($filename, json_encode($attempts), LOCK_EX);
    }

    /**
     * Charge les tentatives depuis un fichier
     */
    private static function loadAttempts($filename) {
        if (!file_exists($filename)) {
            return [];
        }

        $content = file_get_contents($filename);
        return json_decode($content, true) ?? [];
    }

    /**
     * Nettoie les tentatives expirées
     */
    private static function cleanOldAttempts($attempts, $window) {
        $cutoff = time() - $window;
        return array_filter($attempts, function($timestamp) use ($cutoff) {
            return $timestamp > $cutoff;
        });
    }

    /**
     * Crée le dossier de stockage
     */
    private static function ensureStorageDir() {
        if (!is_dir(self::STORAGE_DIR)) {
            mkdir(self::STORAGE_DIR, 0755, true);
            
            // Créer un fichier .htaccess pour bloquer l'accès direct
            $htaccess = self::STORAGE_DIR . '/.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, "Deny from all\n");
            }
        }
    }

    /**
     * Formate un nombre de secondes en texte lisible
     */
    private static function formatTime($seconds) {
        if ($seconds < 60) {
            return $seconds . 's';
        } elseif ($seconds < 3600) {
            return ceil($seconds / 60) . 'min';
        } else {
            return ceil($seconds / 3600) . 'h';
        }
    }

    /**
     * Nettoie les anciens fichiers de rate limit (cron job)
     */
    public static function cleanup() {
        self::ensureStorageDir();
        
        $files = glob(self::STORAGE_DIR . '/*.json');
        $now = time();
        $maxAge = 86400 * 7; // 7 jours

        foreach ($files as $file) {
            if ($now - filemtime($file) > $maxAge) {
                unlink($file);
            }
        }
    }
}
?>
