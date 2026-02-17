<?php
// php/auth/check_session.php
header('Content-Type: application/json');
session_start();
echo json_encode(['success' => isset($_SESSION['user_id'])]);
