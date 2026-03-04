<?php
header('Content-Type: application/json');
require_once '../config/database.php';

session_destroy();
echo json_encode(["status" => "success", "message" => "Déconnexion réussie"]);
?>