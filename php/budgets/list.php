
<?php
header('Content-Type: application/json');
// Autoriser les requêtes AJAX avec cookies/session
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Credentials: true');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT b.*, c.name AS category_name, c.type AS category_type
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ?
    ORDER BY b.month DESC");
$stmt->execute([$user_id]);
$budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => "success",
    "message" => "Budgets récupérés",
    "data" => $budgets
]);
?>