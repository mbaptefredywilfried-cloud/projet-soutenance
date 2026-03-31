<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$resetToken = $input['reset_token'] ?? '';
$newPassword = $input['new_password'] ?? '';

// Valider les inputs
if (empty($resetToken) || empty($newPassword)) {
    echo json_encode(['status' => 'error', 'message' => 'Données manquantes']);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(['status' => 'error', 'message' => 'Le mot de passe doit contenir au moins 8 caractères']);
    exit;
}

try {
    // Chercher le reset_token valide et non expiré
    $stmt = $pdo->prepare('
        SELECT id, email, token FROM password_resets 
        WHERE used = 0 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 20
    ');
    $stmt->execute();
    $records = $stmt->fetchAll();

    if (empty($records)) {
        echo json_encode(['status' => 'error', 'message' => 'Lien de réinitialisation invalide ou expiré']);
        exit;
    }

    $validRecord = null;
    foreach ($records as $record) {
        try {
            if (password_verify($resetToken, $record['token'])) {
                $validRecord = $record;
                break;
            }
        } catch (Exception $e) {
            // Erreur de vérification - continuer
            continue;
        }
    }

    if (!$validRecord) {
        echo json_encode(['status' => 'error', 'message' => 'Lien de réinitialisation invalide ou expiré']);
        exit;
    }

    $email = $validRecord['email'];

    // Hasher le nouveau mot de passe
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);

    // Vérifier que l'utilisateur existe
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Utilisateur non trouvé']);
        exit;
    }

    // Mettre à jour le mot de passe de l'utilisateur
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE email = ?');
    $updateResult = $stmt->execute([$hashedPassword, $email]);

    if (!$updateResult) {
        echo json_encode(['status' => 'error', 'message' => 'Erreur lors de la mise à jour du mot de passe']);
        exit;
    }

    // Marquer le token comme utilisé
    $stmt = $pdo->prepare('UPDATE password_resets SET used = 1 WHERE id = ?');
    $stmt->execute([$validRecord['id']]);

    echo json_encode(['status' => 'success']);
    exit;

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Erreur base de données']);
    exit;
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Erreur serveur']);
    exit;
}
?>
