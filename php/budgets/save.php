<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_csrf.php';
require_once '../auth/require_auth.php';
require_once '../notifications/create_notification.php';

$data = json_decode(file_get_contents('php://input'), true);

// Récupérer la langue de l'utilisateur
$user_id = $_SESSION['user_id'];
$stmtLang = $pdo->prepare("SELECT language FROM user_settings WHERE user_id = ? LIMIT 1");
$stmtLang->execute([$user_id]);
$userSettings = $stmtLang->fetch(PDO::FETCH_ASSOC);
$userLanguage = $userSettings['language'] ?? 'fr';

$required = ['category_id', 'month', 'amount', 'name'];
foreach ($required as $field) {
    if (!isset($data[$field]) || ($field === 'name' && trim($data[$field]) === '')) {
        echo json_encode(["status" => "error", "message" => "Champs manquants", "data" => null]);
        exit;
    }
}

// Récupérer les données
$user_id = $_SESSION['user_id'];
$category_id = (int)$data['category_id'];
$month = $data['month'];
$amount = floatval($data['amount']);
$name = trim($data['name']);
if ($amount <= 0) {
    echo json_encode(["status" => "error", "message" => "Le montant doit être supérieur à 0", "data" => null]);
    exit;
}
// Vérifier que la catégorie existe
$stmt = $pdo->prepare("SELECT id FROM categories WHERE id = ? AND type = 'expense'");
$stmt->execute([$category_id]);
if (!$stmt->fetch()) {
    echo json_encode(["status" => "error", "message" => "Catégorie invalide", "data" => null]);
    exit;
}

// Normaliser la période pour comparaison
$monthNormalized = strtolower(trim($month));

// Vérifier l'unicité : un seul budget par catégorie + période
// Sauf si on modifie le même budget
$budget_id = isset($data['id']) ? intval($data['id']) : 0;
$stmt = $pdo->prepare(
    "SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND LOWER(month) = ? AND id != ?"
);
$stmt->execute([$user_id, $category_id, $monthNormalized, $budget_id]);
if ($stmt->fetch()) {
    echo json_encode([
        "status" => "error", 
        "message" => "Un budget existe déjà pour cette catégorie et cette période. Vous ne pouvez avoir qu'un seul budget par catégorie et période.",
        "data" => null
    ]);
    exit;
}

// Récupérer la devise de l'utilisateur
$userStmt = $pdo->prepare("SELECT currency FROM users WHERE id = ?");
$userStmt->execute([$user_id]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC);
$currency = $user['currency'] ?? 'EUR';

try {
    // Détermination de la période courante
    $now = new DateTime();
    $periodWhere = '';
    $monthLower = strtolower($month);
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

    // Vérification du dépassement de budget pour la période courante
    $sql = "SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND category_id = ? AND type = 'expense' $periodWhere";
    $transStmt = $pdo->prepare($sql);
    $transStmt->execute([$user_id, $category_id]);
    $transResult = $transStmt->fetch(PDO::FETCH_ASSOC);
    $spent = floatval($transResult['total'] ?? 0);

    if ($budget_id > 0) {
        // Modification
        $stmt = $pdo->prepare("UPDATE budgets SET category_id = ?, month = ?, amount = ?, name = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$category_id, $month, $amount, $name, $budget_id, $user_id]);
        // Notification dépassement
        if ($spent > $amount) {
            $formattedSpent = number_format($spent, 2, '.', ' ');
            $formattedBudget = number_format($amount, 2, '.', ' ');
            @createNotificationForBudget($user_id, $name, $formattedSpent, $formattedBudget, $currency, $userLanguage);
        }
        // Créer une notification de succès
        $formattedAmount = number_format($amount, 2, '.', ' ');
        $titles = [
            'fr' => 'Budget modifié',
            'en' => 'Budget updated'
        ];
        $messages = [
            'fr' => "Le budget pour '$name' a été mis à jour à $formattedAmount $currency.",
            'en' => "The budget for '$name' has been updated to $formattedAmount $currency."
        ];
        createNotification($user_id, $titles[$userLanguage] ?? $titles['fr'], $messages[$userLanguage] ?? $messages['fr'], 'success');
        echo json_encode(["status" => "success", "message" => "Budget modifié", "data" => null]);
    } else {
        // Création
        $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month, amount, name) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $category_id, $month, $amount, $name]);
        // Notification dépassement
        if ($spent > $amount) {
            $titles = [
                'fr' => '⚠️ Dépassement budget',
                'en' => '⚠️ Budget exceeded'
            ];
            $messages = [
                'fr' => "Vous avez déjà dépensé " . number_format($spent, 2, '.', ' ') . " $currency pour '$name' sur la période courante.",
                'en' => "You have already spent " . number_format($spent, 2, '.', ' ') . " $currency for '$name' in the current period."
            ];
            $formattedSpent = number_format($spent, 2, '.', ' ');
            $formattedBudget = number_format($amount, 2, '.', ' ');
            @createNotificationForBudget($user_id, $name, $formattedSpent, $formattedBudget, $currency, $userLanguage);
        }
        // Créer une notification de succès
        $formattedAmount = number_format($amount, 2, '.', ' ');
        $titles = [
            'fr' => 'Nouveau budget créé',
            'en' => 'New budget created'
        ];
        $messages = [
            'fr' => "Vous avez créé un budget de $formattedAmount $currency pour '$name'.",
            'en' => "You have created a budget of $formattedAmount $currency for '$name'."
        ];
        createNotification($user_id, $titles[$userLanguage] ?? $titles['fr'], $messages[$userLanguage] ?? $messages['fr'], 'success');
        echo json_encode(["status" => "success", "message" => "Budget enregistré", "data" => null]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur serveur", "data" => null]);
}
?>
