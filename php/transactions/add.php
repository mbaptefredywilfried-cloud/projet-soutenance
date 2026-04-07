<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_csrf.php';
require_once '../auth/require_auth.php';
require_once '../notifications/create_notification.php';

$data = json_decode(file_get_contents('php://input'), true);

$required = ['category_id', 'type', 'amount', 'description', 'transaction_date'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        echo json_encode(["status" => "error", "message" => "Champs manquants: $field", "data" => null]);
        exit;
    }
}

$user_id = $_SESSION['user_id'];
$category_id = (int)$data['category_id'];
$type = trim($data['type']);
$amount = floatval($data['amount']);
$description = htmlspecialchars(trim($data['description']));
$transaction_date = $data['transaction_date'];

if ($amount <= 0) {
    echo json_encode(["status" => "error", "message" => "Le montant doit être supérieur à 0", "data" => null]);
    exit;
}
if (!in_array($type, ['income', 'expense'])) {
    echo json_encode(["status" => "error", "message" => "Type invalide", "data" => null]);
    exit;
}
// Vérifier que la catégorie existe et correspond au type
$stmt = $pdo->prepare("SELECT name FROM categories WHERE id = ? AND type = ?");
$stmt->execute([$category_id, $type]);
$category = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$category) {
    echo json_encode(["status" => "error", "message" => "Catégorie invalide", "data" => null]);
    exit;
}

$category_name = $category['name'];

// Ajouter la transaction (incluant le type)
$stmt = $pdo->prepare("INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)");
$result = $stmt->execute([$user_id, $category_id, $amount, $description, $transaction_date, $type]);

if (!$result) {
    echo json_encode(["status" => "error", "message" => "Erreur lors de l'ajout de la transaction", "data" => null]);
    exit;
}

// Récupérer la transaction insérée (avec jointure catégorie)
$lastId = $pdo->lastInsertId();
$stmt = $pdo->prepare("SELECT t.*, c.name AS category_name, c.type AS category_type, c.translation_key AS category_translation_key FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.id = ?");
$stmt->execute([$lastId]);
$insertedTransaction = $stmt->fetch(PDO::FETCH_ASSOC);

// Récupérer la devise de l'utilisateur (EUR par défaut)
$currency = 'EUR';

// Récupérer la langue de l'utilisateur depuis la base de données (prioritaire) ou la session
$userLanguage = 'fr'; // défaut

try {
    $langStmt = $pdo->prepare("SELECT language FROM user_settings WHERE user_id = ? LIMIT 1");
    $langStmt->execute([$user_id]);
    $langResult = $langStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($langResult && isset($langResult['language']) && !empty($langResult['language'])) {
        $userLanguage = $langResult['language'];
    } elseif (isset($_SESSION['language']) && !empty($_SESSION['language'])) {
        $userLanguage = $_SESSION['language'];
    }
} catch (Exception $e) {
    // Si la table n'existe pas ou erreur, on utilise la session ou le défaut
    if (isset($_SESSION['language']) && !empty($_SESSION['language'])) {
        $userLanguage = $_SESSION['language'];
    }
}

// Formater le montant pour la notification
$formattedAmount = number_format($amount, 2, '.', ' ');

// Créer une notification pour la transaction avec la langue de l'utilisateur
// Passer aussi la clé de traduction de la catégorie pour une future traduction côté client
@createNotificationForTransaction($user_id, $insertedTransaction['category_name'], $formattedAmount, $type, $currency, $userLanguage, $insertedTransaction['category_translation_key']);

// Vérifier le dépassement de budget si c'est une dépense
if ($type === 'expense') {
    // Récupérer le budget pour cette catégorie ce mois
    $budget_query = "SELECT amount FROM budgets 
                    WHERE user_id = ? AND category_id = ? 
                    AND MONTH(created_at) = MONTH(CURDATE()) 
                    AND YEAR(created_at) = YEAR(CURDATE())
                    LIMIT 1";
    
    $budget_stmt = $pdo->prepare($budget_query);
    $budget_stmt->execute([$user_id, $category_id]);
    $budget_result = $budget_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($budget_result) {
        $budget_amount = floatval($budget_result['amount']);
        
        // Calculer le total dépensé ce mois
        $spent_query = "SELECT SUM(amount) as total FROM transactions 
                       WHERE user_id = ? AND category_id = ? AND date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
        
        $spent_stmt = $pdo->prepare($spent_query);
        $spent_stmt->execute([$user_id, $category_id]);
        $spent_result = $spent_stmt->fetch(PDO::FETCH_ASSOC);
        $total_spent = floatval($spent_result['total'] ?? 0);
        
        // Créer une notification de budget si nécessaire avec la langue de l'utilisateur
        if ($total_spent > 0) {
            $formattedSpent = number_format($total_spent, 2, '.', ' ');
            $formattedBudget = number_format($budget_amount, 2, '.', ' ');
            @createNotificationForBudget($user_id, $category_name, $formattedSpent, $formattedBudget, $currency, $userLanguage);
        }
    }
}

echo json_encode(["status" => "success", "message" => "Transaction ajoutée", "data" => $insertedTransaction]);
?>
