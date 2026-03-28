<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    $debug = [
        'session_id' => session_id(),
        'session_status' => session_status(),
        'cookies' => $_COOKIE,
        'session' => $_SESSION
    ];
    echo json_encode([
        "status" => "error",
        "message" => "Non authentifié",
        "debug" => $debug,
        "data" => null
    ]);
    exit;
}
