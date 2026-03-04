<?php
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Non authentifié", "data" => null]);
    exit;
}
