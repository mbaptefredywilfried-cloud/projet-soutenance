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
    $messages = [
        'fr' => [
            'income_message' => 'Revenu de ' . $amount . ' ' . $currency . ' enregistré dans ' . $categoryName,
            'expense_message' => 'Dépense de ' . $amount . ' ' . $currency . ' enregistrée dans ' . $categoryName,
        ],
        'en' => [
            'income_message' => 'Income of ' . $amount . ' ' . $currency . ' recorded in ' . $categoryName,
            'expense_message' => 'Expense of ' . $amount . ' ' . $currency . ' recorded in ' . $categoryName,
        ]
    ];
    
    $types = [
        'income' => 'transaction',
        'expense' => 'transaction'
    ];
    
    // Utiliser la langue spécifiée ou défaut à français
    if (!isset($messages[$language])) {
        $language = 'fr';
    }
    
    $langData = $messages[$language];
    $key = $type === 'income' ? 'income' : 'expense';
    
    // Stocker la CLÉE de traduction au lieu du titre traduit
    $title = 'notif_' . $key . '_title';
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
    
    $messages = [
        'fr' => [
            'exceeded_message' => 'Le budget de ' . $budgetName . ' a été dépassé. Dépensé: ' . $spent . ' ' . $currency . ' sur ' . $budgetAmount . ' ' . $currency,
            'warning_message' => 'Vous avez dépensé ' . $spent . ' ' . $currency . ' sur ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) pour ' . $budgetName,
            'info_message' => 'Vous avez dépensé ' . $spent . ' ' . $currency . ' sur ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) pour ' . $budgetName,
        ],
        'en' => [
            'exceeded_message' => 'The budget for ' . $budgetName . ' has been exceeded. Spent: ' . $spent . ' ' . $currency . ' out of ' . $budgetAmount . ' ' . $currency,
            'warning_message' => 'You have spent ' . $spent . ' ' . $currency . ' out of ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) for ' . $budgetName,
            'info_message' => 'You have spent ' . $spent . ' ' . $currency . ' out of ' . $budgetAmount . ' ' . $currency . ' (' . number_format($percentage, 2) . '%) for ' . $budgetName,
        ]
    ];
    
    // Utiliser la langue spécifiée ou défaut à français
    if (!isset($messages[$language])) {
        $language = 'fr';
    }
    
    $langData = $messages[$language];
    
    if ($percentage > 100) {
        // Stocker la CLÉE de traduction au lieu du titre traduit
        $title = 'notif_budget_exceeded_title';
        $message = $langData['exceeded_message'];
        $type = 'error';
    } else if ($percentage >= 80) {
        // Stocker la CLÉE de traduction au lieu du titre traduit
        $title = 'notif_budget_warning_title';
        $message = $langData['warning_message'];
        $type = 'warning';
    } else {
        // Stocker la CLÉE de traduction au lieu du titre traduit
        $title = 'notif_budget_info_title';
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

/**
 * Génère les notifications d'alerte budgétaire en temps réel
 * Vérifie tous les budgets actuels et crée des notifications s'il y a dépassement
 * @param string $userId - ID de l'utilisateur
 */
function generateBudgetAlertNotifications($userId) {
    try {
        global $pdo;
        
        if (!$pdo) {
            return false;
        }
        
        // Récupérer la langue de l'utilisateur
        $langStmt = $pdo->prepare("SELECT language FROM user_settings WHERE user_id = ? LIMIT 1");
        $langStmt->execute([$userId]);
        $userSettings = $langStmt->fetch(PDO::FETCH_ASSOC);
        $userLanguage = $userSettings['language'] ?? 'fr';
        
        // Récupérer la devise de l'utilisateur
        $userStmt = $pdo->prepare("SELECT currency FROM users WHERE id = ?");
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        $currency = $user['currency'] ?? 'EUR';
        
        // Récupérer tous les budgets de l'utilisateur
        $budgetsStmt = $pdo->prepare("
            SELECT b.id, b.name, b.amount, b.month, b.category_id, c.name as category_name
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = ?
        ");
        $budgetsStmt->execute([$userId]);
        $budgets = $budgetsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($budgets as $budget) {
            // Déterminer la période du budget
            $now = new DateTime();
            $periodWhere = '';
            $monthLower = strtolower(trim($budget['month']));
            
            if (strpos($monthLower, 'mensuel') !== false || $monthLower === 'mois') {
                $periodWhere = "AND DATE_FORMAT(date, '%Y-%m') = '" . $now->format('Y-m') . "'";
            } elseif (strpos($monthLower, 'annuel') !== false || $monthLower === 'an' || $monthLower === 'année') {
                $periodWhere = "AND YEAR(date) = '" . $now->format('Y') . "'";
            } elseif (strpos($monthLower, 'hebdo') !== false || $monthLower === 'semaine') {
                // Semaine courante (lundi-dimanche)
                $monday = clone $now;
                $dayOfWeek = (int)$now->format('w'); // 0=dimanche, 1=lundi
                $diffToMonday = $dayOfWeek === 0 ? 6 : $dayOfWeek - 1;
                $monday->modify('-' . $diffToMonday . ' days');
                $monday->setTime(0,0,0,0);
                $sunday = clone $monday;
                $sunday->modify('+6 days');
                $sunday->setTime(23,59,59,999);
                $periodWhere = "AND date >= '" . $monday->format('Y-m-d') . "' AND date <= '" . $sunday->format('Y-m-d') . "'";
            }
            
            // Calculer le total dépensé pour ce budget
            $sql = "SELECT SUM(amount) as total FROM transactions 
                    WHERE user_id = ? AND category_id = ? AND type = 'expense' $periodWhere";
            
            $transStmt = $pdo->prepare($sql);
            $transStmt->execute([$userId, $budget['category_id']]);
            $transResult = $transStmt->fetch(PDO::FETCH_ASSOC);
            $spent = floatval($transResult['total'] ?? 0);
            
            // Créer une notification si il y a dépassement ou alerte
            if ($spent > 0) {
                $formattedSpent = number_format($spent, 2, '.', ' ');
                $formattedBudget = number_format($budget['amount'], 2, '.', ' ');
                
                // Vérifier si une notification similaire a déjà été créée
                // pour éviter les doublons
                $percentage = ($spent / $budget['amount']) * 100;
                
                // Déterminer le type de notification basé sur le pourcentage
                if ($percentage >= 80) {
                    $notifType = $percentage > 100 ? 'error' : 'warning';
                    
                    // Vérifier si une notification existe déjà pour ce budget dans la dernière heure
                    $checkStmt = $pdo->prepare("
                        SELECT COUNT(*) as count FROM notifications 
                        WHERE user_id = ? 
                        AND type = ?
                        AND message LIKE ?
                        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                    ");
                    
                    // Chercher par le nom du budget dans le message
                    $messagePattern = '%' . $budget['name'] . '%';
                    $checkStmt->execute([$userId, $notifType, $messagePattern]);
                    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
                    $existingCount = $existing['count'] ?? 0;
                    
                    // Créer la notification seulement si aucune n'existe dans la dernière heure
                    if ($existingCount == 0) {
                        @createNotificationForBudget($userId, $budget['name'], $formattedSpent, $formattedBudget, $currency, $userLanguage);
                    }
                }
            }
        }
        
        return true;
    } catch (Exception $e) {
        return false;
    }
}
?>
