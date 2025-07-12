<?php
require_once 'db_connect.php';

$date = $_POST['date'];
$source = $_POST['source'];
$amount = $_POST['amount'];
$description = $_POST['description'];

$date = $conn->real_escape_string($date);
$source = $conn->real_escape_string($source);
$amount = $conn->real_escape_string($amount);
$description = $conn->real_escape_string($description);

$stmt = $conn->prepare("INSERT INTO income (date, source, amount, description) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssds", $date, $source, $amount, $description);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>