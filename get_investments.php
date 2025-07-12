<?php
require_once 'db_connect.php';

$sql = "SELECT * FROM investments ORDER BY fund_name ASC";
$result = $conn->query($sql);

 if ($result === false) {
    die(json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]));
}

$investments = [];
if ($result->num_rows > 0) {
    $investments = $result->fetch_all(MYSQLI_ASSOC);
}

echo json_encode($investments);
$conn->close();
?>