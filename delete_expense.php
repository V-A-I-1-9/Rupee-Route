<?php
require_once 'db_connect.php';

$id = $_POST['id'];
$id = $conn->real_escape_string($id); // Sanitize

$stmt = $conn->prepare("DELETE FROM expenses WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>