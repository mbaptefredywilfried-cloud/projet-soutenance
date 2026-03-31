<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

try {
    $userId = $_SESSION['user_id'];
    $action = $_GET['action'] ?? 'list';
    
    if ($action === 'list') {
        // Afficher toutes les notifications de l'utilisateur
        $stmt = $pdo->prepare('
            SELECT id, title, message, type, is_read, created_at 
            FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ');
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'action' => 'list',
            'total' => count($notifications),
            'notifications' => $notifications
        ]);
    } 
    else if ($action === 'delete_old') {
        // Supprimer les notifications lues de plus de 7 jours
        $stmt = $pdo->prepare('
            DELETE FROM notifications 
            WHERE user_id = ? 
            AND is_read = 1 
            AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
        ');
        $result = $stmt->execute([$userId]);
        $deletedCount = $stmt->rowCount();
        
        echo json_encode([
            'status' => 'success',
            'action' => 'delete_old',
            'deleted' => $deletedCount,
            'message' => "Supprimé $deletedCount notifications lues"
        ]);
    }
    else if ($action === 'delete_all') {
        // Supprimer TOUTES les notifications
        $stmt = $pdo->prepare('DELETE FROM notifications WHERE user_id = ?');
        $result = $stmt->execute([$userId]);
        $deletedCount = $stmt->rowCount();
        
        echo json_encode([
            'status' => 'success',
            'action' => 'delete_all',
            'deleted' => $deletedCount,
            'message' => "Supprimé $deletedCount notifications au total"
        ]);
    }
    else if ($action === 'delete_errors_warnings') {
        // Supprimer UNIQUEMENT les notifications error et warning
        $stmt = $pdo->prepare('
            DELETE FROM notifications 
            WHERE user_id = ? 
            AND type IN ("error", "warning")
        ');
        $result = $stmt->execute([$userId]);
        $deletedCount = $stmt->rowCount();
        
        echo json_encode([
            'status' => 'success',
            'action' => 'delete_errors_warnings',
            'deleted' => $deletedCount,
            'message' => "Supprimé $deletedCount notifications d'erreur/avertissement"
        ]);
    }
    else {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Action invalide. Utilisez: list, delete_old, delete_all, ou delete_errors_warnings'
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
