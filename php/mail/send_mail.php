<?php
/**
 * Fonction d'envoi de mail avec PHPMailer
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/PHPMailer/Exception.php';
require_once __DIR__ . '/../vendor/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/SMTP.php';
require_once __DIR__ . '/../config/mail_config.php';

/**
 * Envoie un email de bienvenue apres inscription
 */
function sendWelcomeEmail($email, $name) {
    try {
        $mail = new PHPMailer(true);
        
        // Configuration SMTP
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
        $mail->addAddress($email, $name);
        
        $mail->isHTML(true);
        $mail->Subject = 'Bienvenue sur Numera - Gestion Financiere';
        
        // HTML template avec inline styles uniquement
        $htmlBody = '
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-collapse: collapse;">
                        <!-- EN-TETE -->
                        <tr>
                            <td style="background-color: #2d3748; color: white; padding: 40px 30px; text-align: center;">
                                <img src="cid:numera_logo" alt="Numera" width="120" height="40" style="display: block; margin: 0 auto 15px; border: none;" />
                                <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: bold; color: white; font-family: Arial, sans-serif;">Bienvenue</h1>
                                <p style="margin: 0; font-size: 14px; color: #e0e0e0; font-family: Arial, sans-serif;">Chez Numera</p>
                            </td>
                        </tr>
                        <!-- CONTENU -->
                        <tr>
                            <td style="padding: 40px 30px; font-family: Arial, sans-serif; color: #2d3748;">
                                <p style="margin: 0 0 20px 0; font-size: 15px;">Bonjour ' . htmlspecialchars($name) . ',</p>
                                
                                <div style="background-color: #f5f5f5; border-left: 4px solid #2d3748; padding: 20px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                                    <p style="margin: 0 0 12px 0;">Merci de vous etre inscrit chez Numera.</p>
                                    <p style="margin: 0;">Votre compte est actif et pret a etre utilise.</p>
                                </div>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="' . getBaseUrl() . '/dasboard.html" style="display: inline-block; background-color: #2d3748; color: white; padding: 14px 40px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 4px; font-family: Arial, sans-serif;">Acceder a Numera</a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="font-size: 12px; color: #999; margin: 20px 0 0 0; font-family: Arial, sans-serif;">Si vous avez des questions, contactez notre support.</p>
                            </td>
                        </tr>
                        <!-- FOOTER -->
                        <tr>
                            <td style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0; padding: 20px 30px; text-align: center; font-family: Arial, sans-serif;">
                                <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: bold; color: #2d3748;">Numera</p>
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: #718096;">Gestion Financiere</p>
                                <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">' . htmlspecialchars($email) . ' | 2026</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        ';
        
        $mail->Body = $htmlBody;
        $mail->AltBody = "Bienvenue chez Numera!\n\nBonjour " . $name . ",\n\nVotre compte a ete cree avec succes.\n\nAccedez a votre tableau : " . getBaseUrl() . "/dasboard.html";
        
        // Ajout du logo
        $logoPath = realpath(__DIR__ . '/../../img/numera_logo.png');
        if (file_exists($logoPath)) {
            $mail->addEmbeddedImage($logoPath, 'numera_logo', 'numera_logo.png');
        }
        
        $mail->send();
        return true;
        
    } catch (Exception $e) {
        return false;
    }
}

function getBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    return $protocol . $_SERVER['HTTP_HOST'];
}

?>
