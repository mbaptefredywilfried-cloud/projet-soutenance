<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';
require_once '../notifications/create_notification.php';

try {
    $userId = $_SESSION['user_id'];
    
    // Generate real-time budget alert notifications based on current spending
    generateBudgetAlertNotifications($userId);
    
    // Get unread count - this should include ALL notification types
    $countStmt = $pdo->prepare('SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0');
    $countStmt->execute([$userId]);
    $countData = $countStmt->fetch(PDO::FETCH_ASSOC);
    $unreadCount = $countData['unread_count'] ?? 0;
    
    // Get ALL notifications - including error, warning, info, success, budget, transaction types
    $stmt = $pdo->prepare('
        SELECT id, title, message, type, is_read, created_at 
        FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        LIMIT 100
    ');
    $stmt->execute([$userId]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ensure type field is never null - default to 'info' if missing
    foreach ($notifications as &$notif) {
        if (empty($notif['type'])) {
            $notif['type'] = 'info';
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'unread_count' => $unreadCount,
        'notifications' => $notifications,
        'total' => count($notifications)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
