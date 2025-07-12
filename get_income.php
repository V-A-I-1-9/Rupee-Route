<?php
require_once 'db_connect.php';

$sql = "SELECT * FROM income ORDER BY date DESC";
$result = $conn->query($sql);

if ($result === false) {
    die(json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]));
}

$income_data = [];
if ($result->num_rows > 0) {
    $income_data = $result->fetch_all(MYSQLI_ASSOC);
}

echo json_encode($income_data);
$conn->close();
?>