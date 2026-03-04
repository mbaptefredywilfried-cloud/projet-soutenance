<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$data = json_decode(file_get_contents('php://input'), true);
$required = ['category_id', 'type', 'amount', 'description', 'transaction_date'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        echo json_encode(["status" => "error", "message" => "Champs manquants", "data" => null]);
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
$stmt = $pdo->prepare("SELECT id FROM categories WHERE id = ? AND type = ?");
$stmt->execute([$category_id, $type]);
if (!$stmt->fetch()) {
    echo json_encode(["status" => "error", "message" => "Catégorie invalide", "data" => null]);
    exit;
}


$stmt = $pdo->prepare("INSERT INTO transactions (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$user_id, $category_id, $amount, $description, $transaction_date]);

echo json_encode(["status" => "success", "message" => "Transaction ajoutée", "data" => null]);
?>