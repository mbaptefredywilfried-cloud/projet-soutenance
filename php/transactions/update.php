<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['id'])) {
    echo json_encode(["status" => "error", "message" => "ID manquant", "data" => null]);
    exit;
}

$user_id = $_SESSION['user_id'];
$id = (int)$data['id'];

$stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user_id]);
$transaction = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$transaction) {
    echo json_encode(["status" => "error", "message" => "Transaction introuvable", "data" => null]);
    exit;
}

$fields = ['category_id', 'type', 'amount', 'description', 'transaction_date'];
$updates = [];
$params = [];

foreach ($fields as $field) {
    if (isset($data[$field])) {
        if ($field === 'amount') {
            $val = floatval($data[$field]);
            if ($val <= 0) {
                echo json_encode(["status" => "error", "message" => "Le montant doit être supérieur à 0", "data" => null]);
                exit;
            }
            $params[] = $val;
        } elseif ($field === 'type') {
            $val = trim($data[$field]);
            if (!in_array($val, ['income', 'expense'])) {
                echo json_encode(["status" => "error", "message" => "Type invalide", "data" => null]);
                exit;
            }
            $params[] = $val;
        } elseif ($field === 'category_id') {
            $catId = (int)$data[$field];
            // On vérifie la présence de type dans $data, sinon on prend la valeur existante en base
            $typeVal = array_key_exists('type', $data) ? trim($data['type']) : $transaction['type'];
            $catStmt = $pdo->prepare("SELECT id FROM categories WHERE id = ? AND type = ?");
            $catStmt->execute([$catId, $typeVal]);
            if (!$catStmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "Catégorie invalide", "data" => null]);
                exit;
            }
            $params[] = $catId;
        } elseif ($field === 'description') {
            $params[] = htmlspecialchars(trim($data[$field]));
        } else {
            $params[] = $data[$field];
        }
        $updates[] = "$field = ?";
    }
}
if (empty($updates)) {
    echo json_encode(["status" => "error", "message" => "Aucune donnée à mettre à jour", "data" => null]);
    exit;
}
$params[] = $id;
$params[] = $user_id;

$sql = "UPDATE transactions SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode(["status" => "success", "message" => "Transaction mise à jour", "data" => null]);
?>