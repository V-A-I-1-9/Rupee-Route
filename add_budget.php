<?php
require_once 'db_connect.php';

$category_id = $_POST['category_id'] ?? null;
$budget_amount = $_POST['budget_amount'] ?? null;
$budget_month = $_POST['budget_month'] ?? null;
$budget_year = $_POST['budget_year'] ?? null;

if (!$category_id || !$budget_amount || !$budget_month || !$budget_year) {
    die(json_encode(['success' => false, 'message' => 'All budget fields are required.']));
}

$category_id = $conn->real_escape_string($category_id);
$budget_amount = $conn->real_escape_string($budget_amount);
$budget_month = $conn->real_escape_string($budget_month);
$budget_year = $conn->real_escape_string($budget_year);

// Use INSERT ... ON DUPLICATE KEY UPDATE to handle existing budget periods
$stmt = $conn->prepare("INSERT INTO budgets (category_id, budget_amount, budget_month, budget_year) VALUES (?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE budget_amount = VALUES(budget_amount)");

$stmt->bind_param("idii", $category_id, $budget_amount, $budget_month, $budget_year);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    // Check for specific duplicate entry error if needed, otherwise general error
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>