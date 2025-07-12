<?php
require_once 'db_connect.php';

$date = $_POST['date'];
$category_id = $_POST['category_id'];
$amount = $_POST['amount'];
$payment_method = $_POST['payment_method'];
$description = $_POST['description'];
$investment_id = !empty($_POST['investment_id']) ? $_POST['investment_id'] : null; // Get optional investment_id

$date = $conn->real_escape_string($date);
$category_id = $conn->real_escape_string($category_id);
$amount = $conn->real_escape_string($amount);
$payment_method = $conn->real_escape_string($payment_method);
$description = $conn->real_escape_string($description);
$investment_id = $investment_id ? $conn->real_escape_string($investment_id) : null; // Sanitize if not null

$stmt = $conn->prepare("INSERT INTO expenses (date, category_id, amount, payment_method, description, investment_id) VALUES (?, ?, ?, ?, ?, ?)");
// Adjust bind_param types: s=string, d=double/decimal, i=integer
$stmt->bind_param("ssdssi", $date, $category_id, $amount, $payment_method, $description, $investment_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>