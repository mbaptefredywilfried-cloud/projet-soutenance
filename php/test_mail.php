<?php
/**
 * Script de test pour vérifier l'envoi de mail
 * À appeler depuis : http://localhost/PROJET/php/test_mail.php
 */

header('Content-Type: application/json; charset=utf-8');

// Inclure la configuration
require_once 'config/mail_config.php';
require_once 'mail/send_mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/vendor/PHPMailer/Exception.php';
require_once __DIR__ . '/vendor/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/vendor/PHPMailer/SMTP.php';

$email = 'mbaptefredywilfried@gmail.com';
$name = 'Test User';

// Test direct de la connexion SMTP
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;
    $mail->CharSet = 'UTF-8';
    
    // Désactiver la vérification SSL pour le développement local
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
    
    // Activer le debug
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = 'error_log';
    
    $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
    $mail->addAddress($email, $name);
    $mail->isHTML(true);
    $mail->Subject = 'Test - Numera';
    $mail->Body = '<h1>Test d\'envoi</h1><p>Si vous recevez ce mail, tout fonctionne!</p>';
    
    $mail->send();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Mail envoyé avec succès!',
        'email' => $email
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de l\'envoi',
        'error' => $e->getMessage(),
        'smtp_error' => isset($mail) ? $mail->ErrorInfo : 'PHPMailer non initialisé',
        'config' => [
            'SMTP_HOST' => SMTP_HOST,
            'SMTP_PORT' => SMTP_PORT,
            'SMTP_USERNAME' => SMTP_USERNAME,
        ]
    ]);
}
?>
