<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

if (isset($_GET['id'])) {
    $id = $conn->real_escape_string($_GET['id']);
    // Join with categories and investments
    $sql = "SELECT e.*, c.name AS category_name, inv.fund_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN investments inv ON e.investment_id = inv.id
            WHERE e.id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt === false) die(json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]));
    $stmt->bind_param("i", $id);
    if ($stmt === false) die(json_encode(['success' => false, 'message' => 'Bind failed: ' . $stmt->error]));
    $stmt->execute();
    if ($stmt === false) die(json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]));
    $result = $stmt->get_result();
    $expenses = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
} else {
    // Join with categories and investments
    $sql = "SELECT e.*, c.name AS category_name, inv.fund_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN investments inv ON e.investment_id = inv.id
            ORDER BY e.date DESC";
    $result = $conn->query($sql);
    if ($result === false) die(json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]));

    $expenses = [];
    if ($result->num_rows > 0) {
        $expenses = $result->fetch_all(MYSQLI_ASSOC);
    }
}

echo json_encode($expenses);
$conn->close();
?>