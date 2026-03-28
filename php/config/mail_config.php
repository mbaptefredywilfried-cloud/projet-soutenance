<?php
/**
 * Configuration pour l'envoi de mails avec PHPMailer
 * Modifiez les paramètres SMTP selon votre serveur
 */

// Configuration SMTP (à adapter selon votre serveur)
define('SMTP_HOST', 'smtp.gmail.com');           // Serveur SMTP (Gmail, Mailgun, etc.)
define('SMTP_PORT', 587);                         // Port SMTP (587 pour TLS, 465 pour SSL)
define('SMTP_USERNAME', 'mbaptefredywilfried@gmail.com'); // Email d'envoi - À REMPLACER par votre adresse Gmail
define('SMTP_PASSWORD', 'vibr ggwc cnpi iclv');   // App Password généré depuis Google
define('MAIL_FROM_ADDRESS', 'mbaptefredywilfried@gmail.com'); // À REMPLACER par votre adresse Gmail
define('MAIL_FROM_NAME', 'Numera - Gestion Financière');

/**
 * NOTE IMPORTANTE : Configuration Gmail
 * 1. Activez l'authentification à deux facteurs
 * 2. Générez un "App Password" : https://myaccount.google.com/apppasswords
 * 3. Utilisez ce mot de passe à la place du mot de passe Gmail
 */

// Alternative : Configuration pour Mailtrap (service de test)
// define('SMTP_HOST', 'live.smtp.mailtrap.io');
// define('SMTP_PORT', 587);
// define('SMTP_USERNAME', 'api');
// define('SMTP_PASSWORD', 'votre-token-mailtrap');
// define('MAIL_FROM_ADDRESS', 'hello@demomailtrap.com');
// define('MAIL_FROM_NAME', 'Numera');

// Alternative : Configuration pour Mailgun
// define('SMTP_HOST', 'smtp.mailgun.org');
// define('SMTP_PORT', 587);
// define('SMTP_USERNAME', 'postmaster@votre-domaine.com');
// define('SMTP_PASSWORD', 'votre-cle-mailgun');

?>
