<?php
require_once 'db_connect.php';

$sql = "SELECT id, name FROM categories ORDER BY name";
$result = $conn->query($sql);

// Check for query errors
if ($result === false) {
    die(json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]));
}

$categories = [];
if ($result->num_rows > 0) {
    $categories = $result->fetch_all(MYSQLI_ASSOC);
}

echo json_encode($categories);
$conn->close();
?>