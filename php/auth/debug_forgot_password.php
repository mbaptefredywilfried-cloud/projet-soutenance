<?php
/**
 * Debug Mot de passe oublié
 * Teste l'envoi du code OTP
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mail_config.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? 'test@example.com';

$debug = [
    'email' => $email,
    'timestamp' => date('Y-m-d H:i:s'),
    'config' => [
        'SMTP_HOST' => SMTP_HOST,
        'SMTP_PORT' => SMTP_PORT,
        'SMTP_USERNAME' => '***' . substr(SMTP_USERNAME, -8),
        'MAIL_FROM_ADDRESS' => MAIL_FROM_ADDRESS,
    ],
    'tests' => []
];

// Test 1: Email valide
$debug['tests']['email_valid'] = filter_var($email, FILTER_VALIDATE_EMAIL) ? 'OK' : 'FAILED';

// Test 2: Vérifier l'email dans la base de données
try {
    $stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    $debug['tests']['user_exists'] = $user ? 'OK - ' . $user['name'] : 'FAILED - User not found';
} catch (Exception $e) {
    $debug['tests']['user_exists'] = 'FAILED - ' . $e->getMessage();
}

// Test 3: Générer OTP
$otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$hashedOtp = password_hash($otp, PASSWORD_BCRYPT, ['cost' => 10]);
$debug['tests']['otp_generated'] = "OTP: $otp (for testing only)";

// Test 4: Insérer dans DB
try {
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
    $stmt = $pdo->prepare('UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0');
    $stmt->execute([$email]);
    
    $stmt = $pdo->prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$email, $hashedOtp, $expiresAt]);
    $debug['tests']['database_insert'] = 'OK';
} catch (Exception $e) {
    $debug['tests']['database_insert'] = 'FAILED - ' . $e->getMessage();
}

// Test 5: Tester l'envoi d'email
try {
    require_once __DIR__ . '/../vendor/PHPMailer/Exception.php';
    require_once __DIR__ . '/../vendor/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/../vendor/PHPMailer/SMTP.php';
    
    $mail = new \PHPMailer\PHPMailer\PHPMailer();
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->Port = SMTP_PORT;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 10;
    $mail->SMTPDebug = 2; // Activé le debug pour voir les logs SMTP
    
    // Désactiver la vérification SSL pour développement local
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
    
    $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
    $mail->addAddress($email);
    $mail->Subject = 'Test OTP - Numera';
    $mail->isHTML(true);
    $mail->Body = "<p>Votre code OTP : <strong>$otp</strong></p>";
    $mail->AltBody = "Votre code OTP : $otp";
    
    if ($mail->send()) {
        $debug['tests']['email_sent'] = 'OK - Email sent successfully';
    } else {
        $debug['tests']['email_sent'] = 'FAILED - ' . $mail->ErrorInfo;
    }
} catch (\PHPMailer\PHPMailer\Exception $e) {
    $debug['tests']['email_sent'] = 'EXCEPTION - ' . $e->getMessage();
} catch (Exception $e) {
    $debug['tests']['email_sent'] = 'ERROR - ' . $e->getMessage();
}

echo json_encode($debug, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
