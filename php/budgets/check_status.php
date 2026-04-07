<?php
header('Content-Type: application/json');
session_start();
require_once '../config/database.php';

// Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Non connecté'
    ]);
    exit;
}

try {
    $user_id = $_SESSION['user_id'];
    
    // Récupérer tous les budgets de l'utilisateur
    $stmt = $pdo->prepare('
        SELECT id, category_id, month, amount, name
        FROM budgets
        WHERE user_id = ?
    ');
    $stmt->execute([$user_id]);
    $budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasExceeded = false;
    $hasWarning = false;
    
    foreach ($budgets as $budget) {
        // Déterminer la période (mois ou semaine)
        $monthNormalized = strtolower(trim($budget['month']));
        
        $dateStart = null;
        $dateEnd = null;
        
        if ($monthNormalized === 'monthly' || $monthNormalized === 'mois' || $monthNormalized === 'mensuel') {
            $now = new DateTime();
            $dateStart = new DateTime($now->format('Y-m-01'));
            $dateEnd = new DateTime($now->format('Y-m-t 23:59:59'));
        } else if ($monthNormalized === 'weekly' || $monthNormalized === 'hebdomadaire' || $monthNormalized === 'hebdoma' || $monthNormalized === 'semaine') {
            $now = new DateTime();
            $dateStart = clone $now;
            $dateStart->modify('Monday this week');
            $dateEnd = clone $now;
            $dateEnd->modify('Sunday this week');
            $dateEnd->setTime(23,59,59);
        } else if ($monthNormalized === 'yearly' || $monthNormalized === 'annuel' || $monthNormalized === 'annee') {
            $now = new DateTime();
            $dateStart = new DateTime($now->format('Y-01-01'));
            $dateEnd = new DateTime($now->format('Y-12-31 23:59:59'));
        }
        
        // Calculer les dépenses
        if ($dateStart && $dateEnd) {
            $spentStmt = $pdo->prepare(
                "SELECT SUM(amount) as total FROM transactions 
                 WHERE user_id = ? AND category_id = ? AND type = 'expense' 
                 AND date >= ? AND date <= ?"
            );
            $spentStmt->execute([
                $user_id, 
                $budget['category_id'],
                $dateStart->format('Y-m-d'),
                $dateEnd->format('Y-m-d')
            ]);
            $spentResult = $spentStmt->fetch(PDO::FETCH_ASSOC);
            $spent = floatval($spentResult['total'] ?? 0);
            
            $budgetAmount = floatval($budget['amount']);
            $percentage = $budgetAmount > 0 ? ($spent / $budgetAmount) * 100 : 0;
            
            // Vérifier l'état du budget
            if ($percentage >= 90) {
                $hasExceeded = true;
            } else if ($percentage >= 80) {
                $hasWarning = true;
            }
        }
    }
    
    $status = '';
    if ($hasExceeded) {
        $status = 'error'; // Rouge
    } else if ($hasWarning) {
        $status = 'warning'; // Jaune
    }
    
    echo json_encode([
        'status' => 'success',
        'budget_status' => $status
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
