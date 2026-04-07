<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once '../config/database.php';
    require_once '../auth/require_csrf.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Erreur config: " . $e->getMessage()]);
    exit;
}

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Non authentifié"]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Récupère l'image actuelle de l'utilisateur
    $stmt = $pdo->prepare("SELECT image FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !$user['image']) {
        echo json_encode(["success" => false, "error" => "noPhotoToDelete"]);
        exit;
    }
    
    $imagePath = $user['image'];
    
    // Supprime le fichier physique s'il existe et n'est pas la photo par défaut
    if ($imagePath && $imagePath !== 'assets/default-avatar.png') {
        $filePath = '../../' . $imagePath;
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
    
    // Réinitialise le champ image à NULL dans la base de données
    $stmt = $pdo->prepare("UPDATE users SET image = NULL WHERE id = ?");
    $stmt->execute([$user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Photo de profil supprimée"]);
    } else {
        echo json_encode(["success" => false, "error" => "Impossible de mettre à jour la base"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Erreur: " . $e->getMessage()]);
}
exit;
?>
