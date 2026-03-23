<?php
error_reporting(0);
ini_set('display_errors', 0);
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

$user_id = $_SESSION['user_id'];
$date = date('Y-m-d');
$filename = "export-depenses-$date.csv";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=' . $filename);
header('Pragma: public');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Content-Transfer-Encoding: binary');

$output = fopen('php://output', 'w');

// Section Transactions
fputcsv($output, []);
fputcsv($output, ['TRANSACTIONS']);
fputcsv($output, ['Date', 'Type', 'Catégorie', 'Montant', 'Description']);
$stmt = $pdo->prepare("SELECT t.date, t.type, c.name as categorie, t.amount, t.description FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = ?");
$stmt->execute([$user_id]);
foreach ($stmt as $row) {
    fputcsv($output, $row);
}

// Section Budgets
fputcsv($output, []);
fputcsv($output, ['BUDGETS']);
fputcsv($output, ['Catégorie', 'Montant du budget']);
$stmt = $pdo->prepare("SELECT c.name as categorie, b.amount as budget FROM budgets b LEFT JOIN categories c ON b.category_id = c.id WHERE b.user_id = ?");
$stmt->execute([$user_id]);
foreach ($stmt as $row) {
    fputcsv($output, $row);
}

// Section Catégories
fputcsv($output, []);
fputcsv($output, ['CATÉGORIES']);
fputcsv($output, ['Nom', 'Type']);
$stmt = $pdo->prepare("SELECT name, type FROM categories");
$stmt->execute();
foreach ($stmt as $row) {
    fputcsv($output, $row);
}

fclose($output);
exit;
