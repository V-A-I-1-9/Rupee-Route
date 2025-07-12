<?php
require_once 'db_connect.php';

// Optional: Add filtering by month/year if needed later
// $month = $_GET['month'] ?? date('n'); // Default to current month
// $year = $_GET['year'] ?? date('Y'); // Default to current year

$sql = "SELECT b.*, c.name as category_name
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        ORDER BY b.budget_year DESC, b.budget_month DESC, c.name ASC";
        // WHERE b.budget_month = ? AND b.budget_year = ? "; // Example filtering

$stmt = $conn->prepare($sql);
// $stmt->bind_param("ii", $month, $year); // Example binding for filters
if ($stmt === false) {
   die(json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]));
}

$stmt->execute();
 if ($stmt === false) {
    die(json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]));
}

$result = $stmt->get_result();

$budgets = [];
if ($result->num_rows > 0) {
    $budgets = $result->fetch_all(MYSQLI_ASSOC);
}

echo json_encode($budgets);
$stmt->close();
$conn->close();
?>