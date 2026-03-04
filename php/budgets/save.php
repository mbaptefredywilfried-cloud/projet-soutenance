<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$data = json_decode(file_get_contents('php://input'), true);
$required = ['category_id', 'month', 'amount'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        echo json_encode(["status" => "error", "message" => "Champs manquants", "data" => null]);
        exit;
    }
}

$user_id = $_SESSION['user_id'];
$category_id = (int)$data['category_id'];
$month = $data['month'];
$amount = floatval($data['amount']);
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
try {
    $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month, amount) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = VALUES(amount)");
    $stmt->execute([$user_id, $category_id, $month, $amount]);
    echo json_encode(["status" => "success", "message" => "Budget enregistré", "data" => null]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur serveur", "data" => null]);
}
?>