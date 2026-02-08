<?php
/**
 * Connexion à la base de données MySQL
 * Fichier à inclure dans tous les fichiers PHP qui accèdent à la base de données
 */

// Configuration
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'numera';

// Créer la connexion
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Vérifier la connexion
if ($conn->connect_error) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données'
    ]));
}

// Définir l'encodage UTF-8
$conn->set_charset("utf8mb4");

?>
