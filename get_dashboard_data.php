<?php
require_once 'db_connect.php';
header('Content-Type: application/json'); // Ensure JSON header

$output = [
    'totalExpenses' => 0,
    'monthlyExpenses' => 0,
    'totalIncome' => 0,
    'monthlyIncome' => 0,
    'categoryExpenses' => [], // For category chart
    'monthlyBudgetStatus' => [] // For budget progress
];

$currentMonth = date('n');
$currentYear = date('Y');

// --- Get Expense Data ---
$sqlExpenses = "SELECT e.amount, e.date, c.name AS category_name
                FROM expenses e
                LEFT JOIN categories c ON e.category_id = c.id";
$resultExpenses = $conn->query($sqlExpenses);
if ($resultExpenses) {
    while ($row = $resultExpenses->fetch_assoc()) {
        $amount = (float)$row['amount'];
        $output['totalExpenses'] += $amount;

        $expenseDate = new DateTime($row['date']);
        $expenseMonth = $expenseDate->format('n');
        $expenseYear = $expenseDate->format('Y');

        if ($expenseYear == $currentYear && $expenseMonth == $currentMonth) {
            $output['monthlyExpenses'] += $amount;
        }

        // Aggregate for category chart
        $categoryName = $row['category_name'] ?? 'Uncategorized';
        if (!isset($output['categoryExpenses'][$categoryName])) {
            $output['categoryExpenses'][$categoryName] = 0;
        }
        $output['categoryExpenses'][$categoryName] += $amount;
    }
} else {
     error_log("Error fetching expenses: " . $conn->error); // Log error server-side
}


// --- Get Income Data ---
$sqlIncome = "SELECT amount, date FROM income";
$resultIncome = $conn->query($sqlIncome);
 if ($resultIncome) {
    while ($row = $resultIncome->fetch_assoc()) {
         $amount = (float)$row['amount'];
         $output['totalIncome'] += $amount;

         $incomeDate = new DateTime($row['date']);
         $incomeMonth = $incomeDate->format('n');
         $incomeYear = $incomeDate->format('Y');

         if ($incomeYear == $currentYear && $incomeMonth == $currentMonth) {
             $output['monthlyIncome'] += $amount;
         }
    }
} else {
     error_log("Error fetching income: " . $conn->error);
}

// --- Get Budget Data & Calculate Status for Current Month ---
$sqlBudgets = "SELECT b.category_id, b.budget_amount, c.name as category_name
               FROM budgets b
               JOIN categories c ON b.category_id = c.id
               WHERE b.budget_month = ? AND b.budget_year = ?";
$stmtBudgets = $conn->prepare($sqlBudgets);
 if ($stmtBudgets) {
    $stmtBudgets->bind_param("ii", $currentMonth, $currentYear);
    $stmtBudgets->execute();
    $resultBudgets = $stmtBudgets->get_result();

    // Calculate current month's spending per category
    $monthlySpendingPerCategory = [];
    $sqlMonthlySpending = "SELECT category_id, SUM(amount) as total_spent
                           FROM expenses
                           WHERE MONTH(date) = ? AND YEAR(date) = ?
                           GROUP BY category_id";
    $stmtSpending = $conn->prepare($sqlMonthlySpending);
    if($stmtSpending){
        $stmtSpending->bind_param("ii", $currentMonth, $currentYear);
        $stmtSpending->execute();
        $resultSpending = $stmtSpending->get_result();
        while ($rowSpending = $resultSpending->fetch_assoc()) {
            $monthlySpendingPerCategory[$rowSpending['category_id']] = (float)$rowSpending['total_spent'];
        }
        $stmtSpending->close();
    } else {
         error_log("Error preparing monthly spending query: " . $conn->error);
    }


    while ($budget = $resultBudgets->fetch_assoc()) {
        $categoryId = $budget['category_id'];
        $spent = $monthlySpendingPerCategory[$categoryId] ?? 0; // Default to 0 if no spending
        $output['monthlyBudgetStatus'][] = [
            'category_name' => $budget['category_name'],
            'budget_amount' => (float)$budget['budget_amount'],
            'spent_amount' => $spent,
            'remaining_amount' => (float)$budget['budget_amount'] - $spent
        ];
    }
    $stmtBudgets->close();
} else {
    error_log("Error preparing budget query: " . $conn->error);
}


echo json_encode($output);
$conn->close();
?>