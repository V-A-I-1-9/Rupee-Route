// --- Global Setup ---
// Currency Formatter
const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
});

// Chart instances (to prevent duplicates)
window.expenseChartInstance = null;
window.categoryChartInstance = null;
window.reportChartInstance = null;


// --- Utility Functions ---
function showSuccessAlert(message) {
    // You could replace this with a nicer Bootstrap alert or toast notification
    alert(message);
}

function showErrorAlert(message) {
    console.error("Error:", message); // Log detailed error
    alert("Error: " + message); // Show user-friendly message
}

function handleAjaxError(xhr, status, error, context) {
    console.error(`AJAX Error (${context}):`, xhr, status, error);
    let errorMessage = `An error occurred while ${context}.`;
    if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMessage = xhr.responseJSON.message;
    } else if (xhr.responseText) {
         // Try to show raw response if JSON parsing failed
         // errorMessage += "\nServer Response: " + xhr.responseText.substring(0, 200); // Limit length
    }
    showErrorAlert(errorMessage);
}

// --- Category Loading ---
function loadCategories(targetSelector = "#category", includeDefault = true) {
    $.ajax({
        url: "get_categories.php",
        type: "GET",
        dataType: "json",
        success: function (categories) {
            const categorySelect = $(targetSelector);
            categorySelect.empty(); 
            if (includeDefault) {
                categorySelect.append(`<option value="">Select Category</option>`);
            }
            // Add an extra check to prevent adding if already populated (less likely needed now, but safe)
            if (categorySelect.find('option').length <= (includeDefault ? 1 : 0)) {
                 categories.forEach(function (category) {
                    categorySelect.append(`<option value="${category.id}">${category.name}</option>`);
                 });
            } else {
                console.warn(`Prevented duplicate category loading for ${targetSelector}`);
            }
        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, `loading categories for ${targetSelector}`);
        }
    });
}

// Specific loaders calling the generic one
function loadCategoriesAddForm() { loadCategories("#category", true); }
function loadCategoriesBudget() { loadCategories("#budget-category", true); }
function loadCategoriesEditModal() { loadCategories("#edit-category", false); } // No default needed? Or maybe yes? Adjust as needed.
function loadCategoriesReportFilter() { loadCategories("#report-category", true); }


// --- Investment Loading ---
function loadInvestmentsDropdown(targetSelector = "#investment", includeDefault = true) {
     $.ajax({
        url: "get_investments.php",
        type: "GET",
        dataType: "json",
        success: function (investments) {
            const investmentSelect = $(targetSelector);
            investmentSelect.empty();
             if (includeDefault) {
                investmentSelect.append(`<option value="">-- None --</option>`);
            }
            investments.forEach(function (inv) {
                investmentSelect.append(`<option value="${inv.id}">${inv.fund_name} (${inv.investment_type})</option>`);
            });
        },
        error: function (xhr, status, error) {
             handleAjaxError(xhr, status, error, `loading investments for ${targetSelector}`);
        }
    });
}
// Specific loaders
function loadInvestmentsDropdownAddForm() { loadInvestmentsDropdown("#investment", true); }
function loadInvestmentsDropdownEditModal() { loadInvestmentsDropdown("#edit-investment", true); }


// --- Expense Management ---
$("#expense-form").submit(function (event) {
    event.preventDefault();
    const formData = {
        date: $("#date").val(),
        category_id: $("#category").val(),
        amount: $("#amount").val(),
        payment_method: $("#payment-method").val(),
        description: $("#description").val(),
        investment_id: $("#investment").val() || null // Send null if empty
    };

    if (!formData.date || !formData.category_id || !formData.amount || !formData.payment_method) {
        showErrorAlert("Please fill in all required expense fields.");
        return;
    }

    $.ajax({
        url: "add_expense.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.success) {
                showSuccessAlert("Expense added successfully!");
                $("#expense-form")[0].reset();
                 // Optionally redirect or update dashboard/view
                 // window.location.href = "view_expenses.html";
            } else {
                showErrorAlert(response.message || "Unknown error adding expense.");
            }
        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, "adding expense");
        }
    });
});

function loadExpenses() {
    $.ajax({
        url: "get_expenses.php",
        type: "GET",
        dataType: "json",
        success: function (expenses) {
            const tableBody = $("#expenses-table tbody");
            tableBody.empty();

            expenses.forEach(function (expense) {
                const row = `
                    <tr>
                        <td>${expense.id}</td>
                        <td>${expense.date}</td>
                        <td>${expense.category_name || 'N/A'}</td>
                        <td>${formatter.format(expense.amount)}</td>
                        <td>${expense.payment_method}</td>
                        <td>${expense.fund_name || '-'}</td> <!-- Display fund name -->
                        <td>${expense.description || "-"}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${expense.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${expense.id}">Delete</button>
                        </td>
                    </tr>`;
                tableBody.append(row);
            });

            // Re-attach event listeners after table update
            $(".edit-btn").off('click').on('click', function () {
                editExpense($(this).data("id"));
            });
            $(".delete-btn").off('click').on('click', function () {
                deleteExpense($(this).data("id"));
            });

        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, "loading expenses");
        }
    });
}

function editExpense(expenseId) {
    // Ensure categories and investments are loaded in the modal *before* fetching expense data
    loadCategoriesEditModal();
    loadInvestmentsDropdownEditModal();

    $.ajax({
        url: "get_expenses.php",
        type: "GET",
        data: { id: expenseId },
        dataType: "json",
        success: function (expenses) {
            if (expenses.length > 0) {
                const expense = expenses[0];
                $("#edit-id").val(expense.id);
                $("#edit-date").val(expense.date);
                $("#edit-category").val(expense.category_id); // Set category ID
                $("#edit-amount").val(expense.amount);
                $("#edit-payment-method").val(expense.payment_method);
                $("#edit-investment").val(expense.investment_id || ""); // Set investment ID or empty
                $("#edit-description").val(expense.description);
                $("#editModal").modal("show");
            } else {
                showErrorAlert("Expense not found.");
            }
        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, "fetching expense details");
        }
    });
}

$("#save-edit-btn").click(function () {
    const expenseData = {
        id: $("#edit-id").val(),
        date: $("#edit-date").val(),
        category_id: $("#edit-category").val(),
        amount: $("#edit-amount").val(),
        payment_method: $("#edit-payment-method").val(),
        description: $("#edit-description").val(),
        investment_id: $("#edit-investment").val() || null // Send null if empty
    };

     if (!expenseData.date || !expenseData.category_id || !expenseData.amount || !expenseData.payment_method) {
        showErrorAlert("Please fill in all required fields in the edit form.");
        return;
    }

    $.ajax({
        url: "update_expense.php",
        type: "POST",
        data: expenseData,
        dataType: "json",
        success: function (response) {
            if (response.success) {
                showSuccessAlert("Expense updated successfully!");
                $("#editModal").modal("hide");
                loadExpenses(); // Reload the table
            } else {
                showErrorAlert(response.message || "Unknown error updating expense.");
            }
        },
        error: function (xhr, status, error) {
             handleAjaxError(xhr, status, error, "updating expense");
        }
    });
});

function deleteExpense(expenseId) {
    if (confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
        $.ajax({
            url: "delete_expense.php",
            type: "POST",
            data: { id: expenseId },
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showSuccessAlert("Expense deleted successfully!");
                    loadExpenses(); // Reload the table
                } else {
                    showErrorAlert(response.message || "Unknown error deleting expense.");
                }
            },
            error: function (xhr, status, error) {
                handleAjaxError(xhr, status, error, "deleting expense");
            }
        });
    }
}

// --- Income Management ---
$("#income-form").submit(function(event) {
    event.preventDefault();
    const formData = {
        date: $("#income-date").val(),
        source: $("#income-source").val(),
        amount: $("#income-amount").val(),
        description: $("#income-description").val()
    };

    if (!formData.date || !formData.source || !formData.amount) {
        showErrorAlert("Please fill in Date, Source, and Amount for income.");
        return;
    }

     $.ajax({
        url: "add_income.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.success) {
                showSuccessAlert("Income added successfully!");
                $("#income-form")[0].reset();
                loadIncome(); // Reload income table
            } else {
                showErrorAlert(response.message || "Unknown error adding income.");
            }
        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, "adding income");
        }
    });
});

function loadIncome() {
    $.ajax({
        url: "get_income.php",
        type: "GET",
        dataType: "json",
        success: function (incomeData) {
            const tableBody = $("#income-table tbody");
            tableBody.empty();
            incomeData.forEach(function (income) {
                 const row = `
                    <tr>
                        <td>${income.id}</td>
                        <td>${income.date}</td>
                        <td>${income.source}</td>
                        <td>${formatter.format(income.amount)}</td>
                        <td>${income.description || "-"}</td>
                        <!-- Add actions later if needed -->
                    </tr>`;
                tableBody.append(row);
            });
        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, "loading income");
        }
    });
}


// --- Investment Management ---
$("#investment-form").submit(function(event) {
    event.preventDefault();
    const formData = $(this).serialize(); // Easy way to get form data

     $.ajax({
        url: "add_investment.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.success) {
                showSuccessAlert("Investment added successfully!");
                $("#investment-form")[0].reset();
                loadInvestments(); // Reload investments table
                // Also reload dropdowns if they are visible on the current page
                if ($("#investment").length) loadInvestmentsDropdownAddForm();
            } else {
                showErrorAlert(response.message || "Unknown error adding investment.");
            }
        },
        error: function (xhr, status, error) {
            handleAjaxError(xhr, status, error, "adding investment");
        }
    });
});

// --- Investment Management (Continued) ---
function loadInvestments() {
    $.ajax({
       url: "get_investments.php",
       type: "GET",
       dataType: "json",
       success: function (investments) {
           const tableBody = $("#investments-table tbody");
           tableBody.empty();
           investments.forEach(function (inv) {
                const row = `
                   <tr>
                       <td>${inv.id}</td>
                       <td>${inv.fund_name}</td>
                       <td>${inv.investment_type}</td>
                       <td>${inv.sip_amount ? formatter.format(inv.sip_amount) : '-'}</td>
                       <td>${inv.sip_day_of_month || '-'}</td>
                       <td>${inv.start_date || '-'}</td>
                       <td>${inv.folio_number || '-'}</td>
                       <td>${inv.notes || '-'}</td>
                        <!-- Add actions later if needed -->
                   </tr>`;
               tableBody.append(row);
           });
       },
       error: function (xhr, status, error) {
           handleAjaxError(xhr, status, error, "loading investments");
       }
   });
}

// --- Budget Management ---
$("#budget-form").submit(function(event) {
   event.preventDefault();
   const formData = $(this).serialize();

   if (!$("#budget-category").val() || !$("#budget-amount").val() || !$("#budget-month").val() || !$("#budget-year").val()) {
        showErrorAlert("Please fill in all budget fields.");
        return;
   }

   $.ajax({
       url: "add_budget.php",
       type: "POST",
       data: formData,
       dataType: "json",
       success: function (response) {
           if (response.success) {
               showSuccessAlert("Budget set/updated successfully!");
               // Optionally clear parts of the form, or leave as is for quick updates
               // $("#budget-form")[0].reset();
               loadBudgets(); // Reload budgets table
           } else {
               showErrorAlert(response.message || "Unknown error setting budget.");
           }
       },
       error: function (xhr, status, error) {
           handleAjaxError(xhr, status, error, "setting budget");
       }
   });
});

function loadBudgets() {
    $.ajax({
       url: "get_budgets.php", // Add filtering params later if needed
       type: "GET",
       dataType: "json",
       success: function (budgets) {
           const tableBody = $("#budgets-table tbody");
           tableBody.empty();
           budgets.forEach(function (budget) {
                const budgetMonthName = new Date(budget.budget_year, budget.budget_month - 1, 1).toLocaleString('default', { month: 'long' });
                const row = `
                   <tr>
                       <td>${budget.id}</td>
                       <td>${budget.category_name}</td>
                       <td>${budgetMonthName}</td>
                       <td>${budget.budget_year}</td>
                       <td>${formatter.format(budget.budget_amount)}</td>
                        <!-- Add actions later if needed -->
                   </tr>`;
               tableBody.append(row);
           });
       },
       error: function (xhr, status, error) {
           handleAjaxError(xhr, status, error, "loading budgets");
       }
   });
}

// --- Dashboard ---
function loadDashboardData() {
   $.ajax({
       url: "get_dashboard_data.php", // Use the dedicated dashboard script
       type: "GET",
       dataType: "json",
       success: function (data) {
           // Update Expense Summaries
           $("#total-expenses").text(formatter.format(data.totalExpenses || 0));
           $("#monthly-expenses").text(formatter.format(data.monthlyExpenses || 0));

           // Update Income Summaries
           $("#monthly-income").text(formatter.format(data.monthlyIncome || 0));
           const netIncome = (data.monthlyIncome || 0) - (data.monthlyExpenses || 0);
           $("#net-income").text(formatter.format(netIncome));
            // Optionally style net income based on positive/negative
           $("#net-income").css('color', netIncome >= 0 ? 'green' : 'red');


           // Update Category List (from aggregated expense data)
           const categoryList = $("#category-list");
           categoryList.empty();
            if (Object.keys(data.categoryExpenses).length > 0) {
                for (const category in data.categoryExpenses) {
                    // Count occurrences (if needed) or just list categories
                    // For now, just list them - modify if count is desired
                    categoryList.append(`<li>${category}</li>`);
                }
            } else {
                categoryList.append(`<li>No expenses recorded yet.</li>`);
            }


           // Update Budget Status
           const budgetList = $("#budget-status-list");
           budgetList.empty();
           if (data.monthlyBudgetStatus && data.monthlyBudgetStatus.length > 0) {
               data.monthlyBudgetStatus.forEach(status => {
                   const percentageSpent = status.budget_amount > 0 ? (status.spent_amount / status.budget_amount) * 100 : 0;
                   let progressBarColor = 'bg-success'; // Green
                   if (percentageSpent > 75 && percentageSpent <= 100) {
                       progressBarColor = 'bg-warning'; // Yellow
                   } else if (percentageSpent > 100) {
                       progressBarColor = 'bg-danger'; // Red
                   }

                   const listItem = `
                       <li>
                           <strong>${status.category_name}:</strong> ${formatter.format(status.spent_amount)} / ${formatter.format(status.budget_amount)}
                           <div class="progress mt-1" style="height: 10px;">
                               <div class="progress-bar ${progressBarColor}" role="progressbar" style="width: ${Math.min(percentageSpent, 100)}%;" aria-valuenow="${percentageSpent}" aria-valuemin="0" aria-valuemax="100"></div>
                           </div>
                           <small>(${formatter.format(status.remaining_amount)} remaining)</small>
                       </li>
                       <hr class="my-1">
                   `;
                   budgetList.append(listItem);
               });
           } else {
               budgetList.append('<li>No budgets set for this month.</li>');
           }

           // Recreate Charts with potentially updated data
           createExpenseChart(); // Assumes this fetches its own data or uses dashboard data
           createCategoryChart(data.categoryExpenses); // Pass aggregated data

       },
       error: function (xhr, status, error) {
           handleAjaxError(xhr, status, error, "loading dashboard data");
           // Display placeholder text if dashboard fails to load
           $("#total-expenses, #monthly-expenses, #monthly-income, #net-income").text(formatter.format(0));
           $("#category-list").html('<li>Error loading categories.</li>');
           $("#budget-status-list").html('<li>Error loading budget status.</li>');
       }
   });
}

// --- Chart Creation ---
// Modify createCategoryChart to accept data directly from dashboard load
function createCategoryChart(categoryData) { // Accept data as argument
   if (!categoryData || Object.keys(categoryData).length === 0) {
        // Handle case where there's no category data (e.g., display a message)
        const canvas = document.getElementById('categoryChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous chart
            ctx.font = "16px Arial";
            ctx.fillStyle = "#ccc"; // Light gray text
            ctx.textAlign = "center";
            ctx.fillText("No expense data for category chart.", canvas.width / 2, canvas.height / 2);
        }
        if (window.categoryChartInstance) { // Destroy old instance if it exists
            window.categoryChartInstance.destroy();
            window.categoryChartInstance = null;
        }
        return; // Exit if no data
   }

   const labels = Object.keys(categoryData);
   const data = Object.values(categoryData);

   const ctx = document.getElementById('categoryChart').getContext('2d');
   if (window.categoryChartInstance) {
       window.categoryChartInstance.destroy();
   }
   window.categoryChartInstance = new Chart(ctx, {
       type: 'pie',
       data: {
           labels: labels,
           datasets: [{
               label: 'Category Breakdown',
               data: data,
               backgroundColor: [
                   'rgba(240, 200, 8, 0.6)',  // Yellow
                   'rgba(41, 171, 226, 0.6)', // Blue
                   'rgba(255, 99, 132, 0.6)', // Red
                   'rgba(75, 192, 192, 0.6)', // Teal
                   'rgba(153, 102, 255, 0.6)', // Purple
                   'rgba(255, 159, 64, 0.6)', // Orange
                   'rgba(54, 162, 235, 0.6)' // Another Blue
               ],
               borderColor: '#fff', // White borders for better separation
               borderWidth: 1
           }]
       },
       options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to resize height/width independently
            plugins: {
                title: {
                    display: true,
                    text: 'Expense Breakdown by Category'
                },
                legend: {
                    position: 'top', // Or 'bottom', 'left', 'right'
                }
            }
        }
   });
}

// Expense chart can still fetch its own data if preferred, or be adapted
function createExpenseChart() {
   $.ajax({
       url: "get_expenses.php", // Or use data from get_dashboard_data.php if already fetched
       type: "GET",
       dataType: "json",
       success: function (expenses) {
           const monthlyExpenses = {};
           expenses.forEach(expense => {
               const month = expense.date.substring(0, 7); // "YYYY-MM"
               if (!monthlyExpenses[month]) {
                   monthlyExpenses[month] = 0;
               }
               monthlyExpenses[month] += parseFloat(expense.amount);
           });

           const labels = Object.keys(monthlyExpenses).sort(); // Sort months chronologically
           const data = labels.map(label => monthlyExpenses[label]); // Get data in sorted order

           const ctx = document.getElementById('expenseChart').getContext('2d');
           if (window.expenseChartInstance) {
               window.expenseChartInstance.destroy();
           }
           window.expenseChartInstance = new Chart(ctx, {
               type: 'bar',
               data: {
                   labels: labels,
                   datasets: [{
                       label: 'Monthly Expenses',
                       data: data,
                       backgroundColor: 'rgba(41, 171, 226, 0.6)', // Blue
                       borderColor: 'rgba(41, 171, 226, 1)',
                       borderWidth: 1
                   }]
               },
               options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins:{
                        title:{ display: true, text: 'Monthly Expenses Trend' },
                        legend: { display: false } // Hide legend for single dataset bar chart
                    }
                }
           });
       },
       error: function (xhr, status, error) {
           handleAjaxError(xhr, status, error, "loading expense chart data");
       }
   });
}

// --- Report Generation ---
$("#generate-report-btn").click(function () {
   const reportData = {
       startDate: $("#report-start-date").val(),
       endDate: $("#report-end-date").val(),
       category: $("#report-category").val() // Send category_id
   };

   $.ajax({
       url: "get_report_data.php",
       type: "GET",
       data: reportData,
       dataType: "json",
       success: function (reportResult) {
            // Assuming get_report_data.php returns { labels: [...], data: [...] }
            if (reportResult && reportResult.labels && reportResult.data) {
                createReportChart(reportResult);
            } else {
                showErrorAlert("Received invalid data for the report.");
            }
       },
       error: function (xhr, status, error) {
           handleAjaxError(xhr, status, error, "generating report");
       }
   });
});

function createReportChart(reportData) {
   const labels = reportData.labels;
   const data = reportData.data;

   const ctx = document.getElementById('reportChart').getContext('2d');
   if (window.reportChartInstance) {
       window.reportChartInstance.destroy();
   }
   window.reportChartInstance = new Chart(ctx, {
       type: 'bar',
       data: {
           labels: labels,
           datasets: [{
               label: 'Expenses',
               data: data,
               backgroundColor: 'rgba(75, 192, 192, 0.6)', // Teal
               borderColor: 'rgba(75, 192, 192, 1)',
               borderWidth: 1
           }]
       },
       options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { title: { display: true, text: 'Expense Report' } }
        }
   });
}


// --- Initial Page Load ---
$(document).ready(function () {
   // Determine current page (simple check based on window location)
   const currentPage = window.location.pathname.split("/").pop();

   // Load common data or specific page data
   if (currentPage === 'index.html' || currentPage === '') {
       loadDashboardData(); // Loads dashboard summaries and triggers chart creation
   } else if (currentPage === 'add_expense.html') {
       loadCategoriesAddForm();
       loadInvestmentsDropdownAddForm();
   } else if (currentPage === 'view_expenses.html') {
       loadExpenses();
       // Modal dropdowns are loaded when edit button is clicked
   } else if (currentPage === 'income.html') {
       loadIncome();
   } else if (currentPage === 'investments.html') {
       loadInvestments();
   } else if (currentPage === 'budgets.html') {
       loadCategoriesBudget();
       // Helper functions to populate month/year dropdowns if needed
       function populateMonths() {
           const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
           const monthSelect = $("#budget-month");
           monthSelect.empty(); // Clear first
           months.forEach((month, index) => {
               monthSelect.append(`<option value="${index + 1}">${month}</option>`);
           });
           monthSelect.val(new Date().getMonth() + 1); // Default to current month
       }
       function setDefaultYear() {
            $("#budget-year").val(new Date().getFullYear());
       }
       populateMonths();
       setDefaultYear();
       loadBudgets();
   } else if (currentPage === 'reports.html') {
       loadCategoriesReportFilter();
       // Optionally generate a default report on load
   }

}); // End document ready