<?php
require_once 'db_connect.php';

// Use null coalescing operator (??) for potentially null fields
$fund_name = $_POST['fund_name'] ?? null;
$investment_type = $_POST['investment_type'] ?? null;
$sip_amount = !empty($_POST['sip_amount']) ? $_POST['sip_amount'] : null;
$sip_day_of_month = !empty($_POST['sip_day_of_month']) ? $_POST['sip_day_of_month'] : null;
$start_date = !empty($_POST['start_date']) ? $_POST['start_date'] : null;
$folio_number = $_POST['folio_number'] ?? null;
$notes = $_POST['notes'] ?? null;

// Basic validation
if (!$fund_name || !$investment_type) {
     die(json_encode(['success' => false, 'message' => 'Fund Name and Investment Type are required.']));
}

// Sanitize inputs that are definitely strings
$fund_name = $conn->real_escape_string($fund_name);
$investment_type = $conn->real_escape_string($investment_type);
$folio_number = $conn->real_escape_string($folio_number);
$notes = $conn->real_escape_string($notes);

// Prepare statement
$stmt = $conn->prepare("INSERT INTO investments (fund_name, investment_type, sip_amount, sip_day_of_month, start_date, folio_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
// Adjust bind_param types: s=string, d=double/decimal, i=integer
$stmt->bind_param("ssdssss",
    $fund_name,
    $investment_type,
    $sip_amount,
    $sip_day_of_month,
    $start_date,
    $folio_number,
    $notes
);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>