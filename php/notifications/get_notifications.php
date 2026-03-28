<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

try {
    $userId = $_SESSION['user_id'];
    
    // Get unread count
    $countStmt = $pdo->prepare('SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0');
    $countStmt->execute([$userId]);
    $countData = $countStmt->fetch(PDO::FETCH_ASSOC);
    $unreadCount = $countData['unread_count'] ?? 0;
    
    // Get recent notifications (last 10)
    $stmt = $pdo->prepare('
        SELECT id, title, message, type, is_read, created_at 
        FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ');
    $stmt->execute([$userId]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'unread_count' => $unreadCount,
        'notifications' => $notifications
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
