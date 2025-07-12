<?php
require_once 'db_connect.php';

$startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
$endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;
$category_id = isset($_GET['category']) ? $_GET['category'] : null; // Changed to category_id

// Sanitize inputs
$startDate = $startDate ? $conn->real_escape_string($startDate) : null;
$endDate = $endDate ? $conn->real_escape_string($endDate) : null;
$category_id = $category_id ? $conn->real_escape_string($category_id) : null; // Sanitize category_id

// Build the SQL query dynamically based on provided filters
$sql = "SELECT e.date, e.amount FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE 1=1"; // Use JOIN

if ($startDate) {
    $sql .= " AND e.date >= '$startDate'";
}
if ($endDate) {
    $sql .= " AND e.date <= '$endDate'";
}
if ($category_id && $category_id != "") {
    $sql .= " AND e.category_id = '$category_id'"; // Filter by category_id
}

$result = $conn->query($sql);
// Check for query errors
if ($result === false) {
    die(json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]));
}

$reportData = [];
if ($result->num_rows > 0) {
    // Aggregate data
    while ($row = $result->fetch_assoc()) {
        $date = $row['date'];
        $amount = (float)$row['amount'];

        if (isset($reportData[$date])) {
            $reportData[$date] += $amount;
        } else {
            $reportData[$date] = $amount;
        }
    }
}

$labels = array_keys($reportData);
$data = array_values($reportData);

echo json_encode(['labels' => $labels, 'data' => $data]);

$conn->close();
?>