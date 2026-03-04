<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Non authentifié"]);
    exit;
}
echo json_encode(["status" => "success", "message" => "Authentifié"]);
?>