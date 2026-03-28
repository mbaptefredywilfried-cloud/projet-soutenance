<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';
require_once '../notifications/create_notification.php';

$data = json_decode(file_get_contents('php://input'), true);


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

// Récupérer la devise de l'utilisateur
$userStmt = $pdo->prepare("SELECT currency FROM users WHERE id = ?");
$userStmt->execute([$user_id]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC);
$currency = $user['currency'] ?? 'EUR';

try {
    if (isset($data['id']) && $data['id']) {
        // Modification
        $budget_id = intval($data['id']);
        $stmt = $pdo->prepare("UPDATE budgets SET category_id = ?, month = ?, amount = ?, name = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$category_id, $month, $amount, $name, $budget_id, $user_id]);
        
        // Créer une notification de succès
        $formattedAmount = number_format($amount, 2, '.', ' ');
        createNotification($user_id, "Budget modifié", "Le budget pour '$name' a été mis à jour à $formattedAmount $currency.", 'success');
        
        echo json_encode(["status" => "success", "message" => "Budget modifié", "data" => null]);
    } else {
        // Création
        $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month, amount, name) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $category_id, $month, $amount, $name]);
        
        // Créer une notification de succès
        $formattedAmount = number_format($amount, 2, '.', ' ');
        createNotification($user_id, "Nouveau budget créé", "Vous avez créé un budget de $formattedAmount $currency pour '$name'.", 'success');
        
        echo json_encode(["status" => "success", "message" => "Budget enregistré", "data" => null]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur serveur", "data" => null]);
}
?>
