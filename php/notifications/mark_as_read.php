<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

try {
    $userId = $_SESSION['user_id'];
    $notificationId = $_POST['notification_id'] ?? null;
    
    if (!$notificationId) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'notification_id requis']);
        exit;
    }
    
    // Mark as read
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
    $result = $stmt->execute([$notificationId, $userId]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Notification marquée comme lue'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
