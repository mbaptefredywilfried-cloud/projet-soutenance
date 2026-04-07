<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/require_csrf.php';
require_once __DIR__ . '/../auth/require_rate_limit.php';
require_once __DIR__ . '/../config/mail_config.php';

// Récupérer l'input
$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim($input['email']) : '';

// Réponse par défaut (toujours succès pour éviter l'énumération d'emails)
$response = ['status' => 'success'];

// Valider l'email
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode($response);
    exit;
}

// Définir l'action et vérifier les limites de taux
$rateLimit = getRateLimitMiddleware('forgot_password');
$rateLimit->check($email);

try {
    // Vérifier que l'email existe dans users
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Si l'email existe, générer et envoyer l'OTP
    if ($user) {
        // Générer un OTP à 6 chiffres
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Hasher l'OTP avec password_hash
        $hashedOtp = password_hash($otp, PASSWORD_BCRYPT, ['cost' => 10]);
        
        // Calculer l'expiration (15 minutes)
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        // Supprimer les anciens tokens pour cet email (au lieu de les marquer comme utilisés)
        $stmt = $pdo->prepare('DELETE FROM password_resets WHERE email = ?');
        $stmt->execute([$email]);
        
        // Insérer le nouveau token
        $stmt = $pdo->prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$email, $hashedOtp, $expiresAt]);
        
        // Envoyer l'email avec PHPMailer
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
            $mail->Timeout = 15;
            
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
            $mail->Subject = 'Code de réinitialisation Numera';
            
            // HTML email
            $mail->isHTML(true);
            $mail->Body = "
            <html>
                <body style='font-family: Arial, sans-serif; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                        <h2 style='color: #36A2EB; text-align: center;'>Réinitialisation de votre mot de passe</h2>
                        <p>Bonjour,</p>
                        <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte Numera.</p>
                        <p style='font-size: 18px; font-weight: bold; color: #333; text-align: center; margin: 30px 0;'>
                            Votre code de vérification est : <br>
                            <span style='background: #f0f0f0; padding: 15px 20px; border-radius: 5px; letter-spacing: 5px; font-family: monospace; font-size: 20px;'>$otp</span>
                        </p>
                        <p style='color: #ef4444; text-align: center;'><strong>⏱️ Valide pendant 15 minutes</strong></p>
                        <hr style='border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;'>
                        <p style='font-size: 12px; color: #999;'>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
                        <p style='font-size: 12px; color: #999; text-align: center; margin-top: 20px;'>Numera - Gestion de budget intelligente</p>
                    </div>
                </body>
            </html>";
            
            $mail->AltBody = "Votre code de vérification Numera est : $otp (valide 15 minutes)";
            
            $mailSent = $mail->send();
            if (!$mailSent) {
                // Email non envoyé, continuer silencieusement
            }
        } catch (\PHPMailer\PHPMailer\Exception $e) {
            // PHPMailer Exception - continuer silencieusement
        } catch (Exception $e) {
            // Exception générale - continuer silencieusement
        }
    }

    // Enregistrer comme tentative réussie (efface les compteurs)
    $rateLimit->record($email, true);

    // Toujours retourner succès (anti-énumération)
    http_response_code(200);
    echo json_encode($response);
    exit;

} catch (PDOException $e) {
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
} catch (Exception $e) {
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
}
?>


} catch (Exception $e) {
    error_log('❌ Forgot Password Error: ' . $e->getMessage());
    echo json_encode(['status' => 'success']);
    exit;
}
?>

                        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
                        <hr style='border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;'>
                        <p style='font-size: 12px; color: #999;'>Numera - Gestion de budget intelligente</p>
                    </div>
                </body>
            </html>";
            
            $mail->AltBody = "Votre code de vérification Numera est : $otp (valide 15 minutes)";
            
            $mail->send();
        } catch (\PHPMailer\PHPMailer\Exception $e) {
            // Erreur email - continuer silencieusement
        }
    }

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(['status' => 'success']); // Toujours succès pour sécurité
    exit;
}
?>
