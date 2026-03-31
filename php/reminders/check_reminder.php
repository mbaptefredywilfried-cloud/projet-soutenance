<?php
// Rappel sans localStorage : tout côté serveur
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../auth/require_auth.php';

$user_id = $_SESSION['user_id'];

// 1. Récupérer la dernière transaction
$stmt = $pdo->prepare("SELECT MAX(date) as last_transaction_date FROM transactions WHERE user_id = ?");
$stmt->execute([$user_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$last_transaction_date = $row['last_transaction_date'];

// 2. Récupérer la date du dernier rappel affiché (stocké en base ou session)
// Ici, on utilise la session PHP pour la démo (sinon, ajouter un champ en base)
$last_reminder = isset($_SESSION['last_reminder_shown']) ? $_SESSION['last_reminder_shown'] : null;
$today = date('Y-m-d');
$now = new DateTime();
$reminder_needed = false;
$hours_since = 0;

if ($last_transaction_date === null) {
    // Vérifier si c'est vraiment un nouvel utilisateur
    // Un compte créé depuis moins de 1 jour est considéré comme nouveau
    $stmt = $pdo->prepare("SELECT DATE(created_at) as creation_date FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $created_date = $user['creation_date'] ?? $today;
    
    // Ne pas afficher le rappel si l'utilisateur vient de créer son compte (créé aujourd'hui)
    if ($created_date === $today) {
        $reminder_needed = false;
    } else {
        $reminder_needed = true;
    }
    $hours_since = 999;
} else {
    $last_date = new DateTime($last_transaction_date);
    $interval = $now->diff($last_date);
    $hours_since = ($interval->days * 24) + $interval->h;
    if ($last_transaction_date !== $today && $hours_since >= 24) {
        $reminder_needed = true;
    }
}

// 3. Vérifier si le rappel a déjà été affiché aujourd'hui (session)
if ($last_reminder === $today) {
    $reminder_needed = false;
}

// 4. Si on doit afficher le toast, on marque la session
if ($reminder_needed) {
    $_SESSION['last_reminder_shown'] = $today;
}

echo json_encode([
    "status" => "success",
    "reminder_needed" => $reminder_needed,
    "last_transaction_date" => $last_transaction_date,
    "hours_since" => $hours_since,
    "today" => $today
]);
