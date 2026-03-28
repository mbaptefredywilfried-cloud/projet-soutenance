<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';
require_once '../notifications/create_notification.php';

try {
    $user_id = $_SESSION['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    $title = $data['title'] ?? null;
    $message = $data['message'] ?? null;
    $type = $data['type'] ?? 'info';
    
    if (!$title || !$message) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'titre et message requis'
        ]);
        exit;
    }
    
    // Créer la notification
    $result = createNotification($user_id, $title, $message, $type);
    
    if ($result) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Notification créée'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Erreur lors de la création'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
