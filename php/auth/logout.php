<?php
/**
 * Déconnexion - Détruit la session et redirige
 */

session_start();
session_destroy();

// Rediriger vers la page d'accueil
header('Location: ../../index.html');
exit();

?>
