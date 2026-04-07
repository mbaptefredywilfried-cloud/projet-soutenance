<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/require_csrf.php';
require_once __DIR__ . '/../auth/require_rate_limit.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';
$otp = $input['otp'] ?? '';

// Valider les inputs
if (empty($email) || empty($otp) || !is_numeric($otp) || strlen($otp) !== 6) {
    echo json_encode(['status' => 'error', 'message' => 'Code invalide ou expiré']);
    exit;
}

// Créer l'instance et vérifier les limites de taux (strict pour OTP)
$rateLimit = getRateLimitMiddleware('verify_otp');
$rateLimit->check($email);

try {
    // Chercher le token non expiré et non utilisé pour cet email
    $stmt = $pdo->prepare('
        SELECT id, token FROM password_resets 
        WHERE email = ? AND used = 0 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    ');
    $stmt->execute([$email]);
    $record = $stmt->fetch();

    if (!$record) {
        // Enregistrer comme tentative échouée
        $rateLimit->record($email, false);
        echo json_encode(['status' => 'error', 'message' => 'Code invalide ou expiré']);
        exit;
    }

    // Vérifier l'OTP avec password_verify
    if (!password_verify($otp, $record['token'])) {
        // Enregistrer comme tentative échouée
        $rateLimit->record($email, false);
        echo json_encode(['status' => 'error', 'message' => 'Code invalide ou expiré']);
        exit;
    }

    // Générer un reset_token UUID v4
    $resetToken = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // Hasher le reset_token pour le stocker
    $hashedResetToken = password_hash($resetToken, PASSWORD_BCRYPT, ['cost' => 10]);
    
    // Calculer l'expiration (15 minutes)
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Mettre à jour le record pour stocker le reset_token au lieu du OTP
    $stmt = $pdo->prepare('
        UPDATE password_resets 
        SET token = ?, expires_at = ?
        WHERE id = ?
    ');
    $stmt->execute([$hashedResetToken, $expiresAt, $record['id']]);

    // Répondre avec le reset_token (en clair, pour le client)
    // Enregistrer comme tentative réussie (efface les compteurs)
    $rateLimit->record($email, true);
    echo json_encode(['status' => 'success', 'reset_token' => $resetToken]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Erreur serveur']);
    exit;
}
?>
