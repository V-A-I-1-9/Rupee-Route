<?php
$host = "localhost"; // Usually "localhost" for XAMPP
$username = "root";  // Default XAMPP username
$password = "";      // Default XAMPP password (usually empty)
$database = "expense_tracker";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]));
}

// No need to close the connection here; it will be used in other scripts.
// We close it at the end of each script that uses it.
?>