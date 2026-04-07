<?php
/**
 * Gestion sécurisée des tokens CSRF
 * 
 * Utilise des tokens cryptographiquement sécurisés stockés en session
 * Valide automatiquement sur les requêtes POST/PUT/DELETE/PATCH
 */

class CSRFToken {
    const TOKEN_LENGTH = 32; // 256 bits en hex = 32 chars
    const TOKEN_NAME = 'csrf_token';
    const HEADER_NAME = 'X-CSRF-Token';

    /**
     * Initialise le token CSRF en session
     * À appeler après session_start()
     */
    public static function init() {
        if (session_status() === PHP_SESSION_NONE) {
            throw new Exception("Session doit être démarrée avant init CSRF");
        }
        
        if (!isset($_SESSION[self::TOKEN_NAME])) {
            $_SESSION[self::TOKEN_NAME] = self::generate();
        }
    }

    /**
     * Génère un token CSRF sécurisé
     * @return string Token base64url (URL-safe base64)
     */
    public static function generate() {
        // Générer 32 octets cryptographiquement sécurisés
        $randomBytes = random_bytes(self::TOKEN_LENGTH);
        
        // Encoder en base64url (RFC 4648)
        $token = rtrim(strtr(base64_encode($randomBytes), '+/', '-_'), '=');
        
        return $token;
    }

    /**
     * Récupère le token CSRF de la session
     * @return string Token actuel ou null
     */
    public static function getToken() {
        if (session_status() === PHP_SESSION_NONE) {
            return null;
        }
        
        return $_SESSION[self::TOKEN_NAME] ?? null;
    }

    /**
     * Récupère le token CSRF depuis la requête (POST data ou header)
     * @return string|null Token depuis requête ou null
     */
    public static function getRequestToken() {
        // Vérifier d'abord dans POST data
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST[self::TOKEN_NAME])) {
            return $_POST[self::TOKEN_NAME];
        }

        // Vérifier dans JSON body
        $json = json_decode(file_get_contents('php://input'), true);
        if (is_array($json) && isset($json[self::TOKEN_NAME])) {
            return $json[self::TOKEN_NAME];
        }

        // Vérifier dans X-CSRF-Token header
        if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            return $_SERVER['HTTP_X_CSRF_TOKEN'];
        }

        // Vérifier dans X-CSRF-Token header (variante avec underscore)
        if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            return $_SERVER['HTTP_X_CSRF_TOKEN'];
        }

        return null;
    }

    /**
     * Valide un token CSRF avec timing-safe comparison
     * @param string $token Token à valider
     * @return bool true si valide, false sinon
     */
    public static function validate($token) {
        if (session_status() === PHP_SESSION_NONE) {
            return false;
        }

        $storedToken = $_SESSION[self::TOKEN_NAME] ?? null;

        if ($storedToken === null || $token === null) {
            return false;
        }

        // Utiliser hash_equals() pour timing-safe comparison
        // Prévient les timing attacks
        return hash_equals($storedToken, $token);
    }

    /**
     * Régénère un nouveau token CSRF (après login)
     */
    public static function regenerate() {
        if (session_status() === PHP_SESSION_NONE) {
            throw new Exception("Session doit être démarrée avant regen CSRF");
        }

        $_SESSION[self::TOKEN_NAME] = self::generate();
    }
}
?>
