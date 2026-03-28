<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';

// Vérifier l'authentification
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non authentifié']);
    exit;
}

$user_id = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);
$oldPassword = $input['old_password'] ?? '';
$newPassword = $input['new_password'] ?? '';

// Validation des données
if (empty($oldPassword) || empty($newPassword)) {
    echo json_encode(['success' => false, 'error' => 'Champs obligatoires manquants']);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'error' => 'Le nouveau mot de passe doit contenir au moins 8 caractères']);
    exit;
}

if ($oldPassword === $newPassword) {
    echo json_encode(['success' => false, 'error' => 'Le nouveau mot de passe doit être différent de l\'ancien']);
    exit;
}

try {
    // Récupérer le mot de passe actuel de l'utilisateur
    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
        exit;
    }

    // Vérifier que l'ancien mot de passe est correct
    if (!password_verify($oldPassword, $user['password'])) {
        echo json_encode(['success' => false, 'error' => 'Ancien mot de passe incorrect']);
        exit;
    }

    // Hasher le nouveau mot de passe avec BCRYPT cost 12
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);

    // Mettre à jour le mot de passe
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $result = $stmt->execute([$hashedPassword, $user_id]);

    if ($result && $stmt->rowCount() > 0) {
        error_log('✅ Password changed successfully for user ' . $user_id);
        echo json_encode(['success' => true, 'message' => 'Mot de passe mis à jour avec succès']);
    } else {
        error_log('❌ Failed to update password for user ' . $user_id);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la mise à jour du mot de passe']);
    }
    exit;

} catch (PDOException $e) {
    error_log('❌ Database Error in change_password: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur base de données']);
    exit;
} catch (Exception $e) {
    error_log('❌ Error in change_password: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
    exit;
}
?>
