<?php
/**
 * Test SMTP Configuration
 * Pour vérifier si PHPMailer peut se connecter au serveur SMTP
 */

// Configuration SMTP
$smtpConfig = [
    'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'port' => getenv('SMTP_PORT') ?: 587,
    'user' => getenv('SMTP_USER') ?: '',
    'pass' => getenv('SMTP_PASS') ?: '',
    'from' => getenv('SMTP_FROM') ?: 'noreply@numera.app',
];

// Résultats du test
$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'config_loaded' => [
        'SMTP_HOST' => $smtpConfig['host'],
        'SMTP_PORT' => $smtpConfig['port'],
        'SMTP_USER' => '***' . substr($smtpConfig['user'], -5),
        'SMTP_FROM' => $smtpConfig['from'],
    ],
    'tests' => []
];

// Test 1: Vérifier que les credentials sont définis
$results['tests']['credentials_defined'] = [
    'status' => !empty($smtpConfig['user']) && !empty($smtpConfig['pass']) ? 'OK' : 'FAILED',
    'message' => !empty($smtpConfig['user']) ? 'SMTP credentials are configured' : 'Missing SMTP credentials - Configure .env file'
];

// Test 2: Vérifier la connexion SMTP
if (!empty($smtpConfig['user']) && !empty($smtpConfig['pass'])) {
    try {
        require_once __DIR__ . '/../vendor/PHPMailer/Exception.php';
        require_once __DIR__ . '/../vendor/PHPMailer/PHPMailer.php';
        require_once __DIR__ . '/../vendor/PHPMailer/SMTP.php';
        
        $mail = new \PHPMailer\PHPMailer\PHPMailer();
        $mail->isSMTP();
        $mail->Host = $smtpConfig['host'];
        $mail->Port = $smtpConfig['port'];
        $mail->SMTPAuth = true;
        $mail->Username = $smtpConfig['user'];
        $mail->Password = $smtpConfig['pass'];
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->CharSet = 'UTF-8';
        $mail->Timeout = 10;
        $mail->SMTPDebug = 0;
        
        // Essayer de se connecter
        if ($mail->smtpConnect()) {
            $results['tests']['smtp_connection'] = [
                'status' => 'OK',
                'message' => "Connected to {$smtpConfig['host']}:{$smtpConfig['port']}"
            ];
            $mail->smtpClose();
        } else {
            $results['tests']['smtp_connection'] = [
                'status' => 'FAILED',
                'message' => $mail->ErrorInfo
            ];
        }
    } catch (Exception $e) {
        $results['tests']['smtp_connection'] = [
            'status' => 'FAILED',
            'message' => $e->getMessage()
        ];
    }
}

// Test 3: Vérifier les permissions des dossiers
$logDir = __DIR__ . '/../../';
$results['tests']['directory_writable'] = [
    'status' => is_writable($logDir) ? 'OK' : 'WARNING',
    'message' => is_writable($logDir) ? 'Log directory is writable' : 'Log directory may not be writable'
];

// Test 4: Vérifier la base de données
try {
    require_once __DIR__ . '/../config/database.php';
    $stmt = $pdo->prepare('SELECT 1');
    $stmt->execute();
    $results['tests']['database'] = [
        'status' => 'OK',
        'message' => 'Database connection successful'
    ];
} catch (Exception $e) {
    $results['tests']['database'] = [
        'status' => 'FAILED',
        'message' => $e->getMessage()
    ];
}

// Afficher les résultats
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Configuration SMTP - Numera</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #f8fafc;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #36A2EB;
            margin-bottom: 30px;
            text-align: center;
        }
        .config-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #36A2EB;
        }
        .config-box h3 {
            margin-top: 0;
            color: #36A2EB;
        }
        .config-box pre {
            margin: 10px 0;
            background: #e8f1ff;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
        .test-result {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid;
        }
        .test-result.ok {
            background: #f0fdf4;
            border-left-color: #10b981;
        }
        .test-result.failed {
            background: #fef2f2;
            border-left-color: #ef4444;
        }
        .test-result.warning {
            background: #fffbeb;
            border-left-color: #f59e0b;
        }
        .test-result h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .status.ok {
            background: #10b981;
            color: white;
        }
        .status.failed {
            background: #ef4444;
            color: white;
        }
        .status.warning {
            background: #f59e0b;
            color: white;
        }
        .message {
            font-size: 13px;
            color: #666;
            margin-top: 5px;
            font-family: 'Courier New', monospace;
        }
        .instructions {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #36A2EB;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
            line-height: 1.5;
        }
        .code {
            background: #f8fafc;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 10px 0;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Test Configuration SMTP - Numera</h1>

        <div class="config-box">
            <h3>Configuration actuellement chargée :</h3>
            <pre><?php echo json_encode($results['config_loaded'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES); ?></pre>
        </div>

        <h2 style="color: #333; margin-bottom: 20px;">Résultats des tests :</h2>
        
        <?php foreach ($results['tests'] as $testName => $test): ?>
            <div class="test-result <?php echo strtolower($test['status']); ?>">
                <h4>
                    <?php 
                    $icon = $test['status'] === 'OK' ? '✅' : ($test['status'] === 'FAILED' ? '❌' : '⚠️');
                    echo $icon . ' ' . ucfirst(str_replace('_', ' ', $testName));
                    ?>
                    <span class="status <?php echo strtolower($test['status']); ?>"><?php echo $test['status']; ?></span>
                </h4>
                <div class="message"><?php echo htmlspecialchars($test['message']); ?></div>
            </div>
        <?php endforeach; ?>

        <div class="instructions">
            <h3>📝 Configuration requise :</h3>
            <p>Pour que les emails fonctionnent, créez un fichier <strong>.env</strong> à la racine du projet :</p>
            <div class="code">
SMTP_HOST=smtp.gmail.com<br>
SMTP_PORT=587<br>
SMTP_USER=votre-email@gmail.com<br>
SMTP_PASS=votre-mot-de-passe-application<br>
SMTP_FROM=noreply@numera.app
            </div>

            <h3>🔑 Comment obtenir les credentials Gmail :</h3>
            <ol>
                <li>Aller à <a href="https://myaccount.google.com/apppasswords" target="_blank">Google App Passwords</a></li>
                <li>Sélectionner "Mail" et "Windows Computer"</li>
                <li>Générer le mot de passe d'application</li>
                <li>Utiliser ce mot de passe dans <strong>SMTP_PASS</strong></li>
            </ol>

            <h3>💡 Alternatives (autres serveurs SMTP) :</h3>
            <ul>
                <li><strong>SendGrid</strong> : smtp.sendgrid.net (port 587)</li>
                <li><strong>Mailgun</strong> : smtp.mailgun.org (port 587)</li>
                <li><strong>Brevo (Sendinblue)</strong> : smtp-relay.brevo.com (port 587)</li>
                <li><strong>OVH</strong> : ssl0.ovh.net (port 465)</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>Test généré le : <?php echo $results['timestamp']; ?></p>
        </div>
    </div>
</body>
</html>
