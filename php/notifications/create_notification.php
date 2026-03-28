<?php
/**
 * Fonction helper pour créer une notification
 * Utilisable depuis n'importe quel script PHP
 */

function createNotification($userId, $title, $message, $type = 'info') {
    try {
        global $pdo;
        
        if (!$pdo) {
            return false;
        }
        
        // Vérifier les paramètres
        if (!$userId || !$title || !$message) {
            return false;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, NOW())
        ');
        
        $result = $stmt->execute([$userId, $title, $message, $type]);
        
        return $result;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Fonction pour créer une notification de transaction avec traduction
 * @param string $userId - ID de l'utilisateur
 * @param string $categoryName - Nom de la catégorie
 * @param string $amount - Montant formaté
 * @param string $type - Type de transaction (income/expense)
 * @param string $currency - Devise
 * @param string $language - Code de langue (fr/en)
 * @param string $categoryTranslationKey - Clé de traduction de la catégorie
 */
function createNotificationForTransaction($userId, $categoryName, $amount, $type, $currency = 'EUR', $language = 'fr', $categoryTranslationKey = null) {
    $translations = [
        'fr' => [
            'income_title' => 'Revenu reçu',
            'income_message' => 'Revenu de ' . $amount . ' ' . $currency . ' enregistré dans ' . $categoryName,
            'expense_title' => 'Dépense enregistrée',
            'expense_message' => 'Dépense de ' . $amount . ' ' . $currency . ' enregistrée dans ' . $categoryName,
        ],
        'en' => [
            'income_title' => 'Income received',
            'income_message' => 'Income of ' . $amount . ' ' . $currency . ' recorded in ' . $categoryName,
            'expense_title' => 'Expense recorded',
            'expense_message' => 'Expense of ' . $amount . ' ' . $currency . ' recorded in ' . $categoryName,
        ]
    ];
    
    $types = [
        'income' => 'transaction',
        'expense' => 'transaction'
    ];
    
    // Utiliser la langue spécifiée ou défaut à français
    if (!isset($translations[$language])) {
        $language = 'fr';
    }
    
    $langData = $translations[$language];
    $key = $type === 'income' ? 'income' : 'expense';
    
    $title = $langData[$key . '_title'];
    $message = $langData[$key . '_message'];
    $notifType = $types[$type] ?? 'transaction';
    
    // Créer la notification et retourner l'ID si possible pour accès futur
    $result = createNotification($userId, $title, $message, $notifType);
    
    return $result;
}

/**
 * Fonction pour créer une notification de budget avec traduction
 * @param string $userId - ID de l'utilisateur
 * @param string $budgetName - Nom du budget
 * @param string $spent - Montant dépensé
 * @param string $budgetAmount - Montant du budget
 * @param string $currency - Devise
 * @param string $language - Code de langue (fr/en)
 */
function createNotificationForBudget($userId, $budgetName, $spent, $budgetAmount, $currency = 'EUR', $language = 'fr') {
    $percentage = ($spent / $budgetAmount) * 100;
    
    $translations = [
        'fr' => [
            'exceeded_title' => 'Budget dépassé!',
            'exceeded_message' => 'Le budget de ' . $budgetName . ' a été dépassé. Dépensé: ' . $spent . ' ' . $currency . ' sur ' . $budgetAmount . ' ' . $currency,
            'warning_title' => 'Budget presque atteint',
            'warning_message' => 'Vous avez dépensé ' . $spent . ' ' . $currency . ' sur ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) pour ' . $budgetName,
            'info_title' => 'Gestion budgétaire',
            'info_message' => 'Vous avez dépensé ' . $spent . ' ' . $currency . ' sur ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) pour ' . $budgetName,
        ],
        'en' => [
            'exceeded_title' => 'Budget exceeded!',
            'exceeded_message' => 'The budget for ' . $budgetName . ' has been exceeded. Spent: ' . $spent . ' ' . $currency . ' out of ' . $budgetAmount . ' ' . $currency,
            'warning_title' => 'Budget almost reached',
            'warning_message' => 'You have spent ' . $spent . ' ' . $currency . ' out of ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) for ' . $budgetName,
            'info_title' => 'Budget management',
            'info_message' => 'You have spent ' . $spent . ' ' . $currency . ' out of ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) for ' . $budgetName,
        ]
    ];
    
    // Utiliser la langue spécifiée ou défaut à français
    if (!isset($translations[$language])) {
        $language = 'fr';
    }
    
    $langData = $translations[$language];
    
    if ($percentage > 100) {
        $title = $langData['exceeded_title'];
        $message = $langData['exceeded_message'];
        $type = 'error';
    } else if ($percentage >= 80) {
        $title = $langData['warning_title'];
        $message = $langData['warning_message'];
        $type = 'warning';
    } else {
        $title = $langData['info_title'];
        $message = $langData['info_message'];
        $type = 'info';
    }
    
    return createNotification($userId, $title, $message, $type);
}

function deleteNotifications($userId, $olderThanDays = 30) {
    try {
        global $pdo;
        
        if (!$pdo) {
            return false;
        }
        
        $stmt = $pdo->prepare('
            DELETE FROM notifications 
            WHERE user_id = ? 
            AND is_read = 1 
            AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        ');
        
        return $stmt->execute([$userId, $olderThanDays]);
    } catch (Exception $e) {
        return false;
    }
}
?>
