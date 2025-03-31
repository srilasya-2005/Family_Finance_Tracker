const API_URL = window.location.origin;


// Update file upload label with file name
document.getElementById("file-upload").addEventListener("change", function() {
    const fileName = this.files[0] ? this.files[0].name : "Upload File";
    document.getElementById("file-upload-label").textContent = fileName;
});

// Fetch and display expenses
async function fetchExpenses(fromDate = "", toDate = "", page = 1) {
    let url = `${API_URL}/get_expenses?page=${page}`;
    if (fromDate && toDate) {
        url += `&from_date=${fromDate}&to_date=${toDate}`;
    }
    let response = await fetch(url);
    let data = await response.json();
    let expenses = data.expenses;
    let tableBody = document.getElementById("expense-table-body");
    tableBody.innerHTML = "";

    if (!expenses || expenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="empty-table-message">No expenses found</td></tr>`;
        return;
    }

    expenses.forEach(exp => {
        let row = document.createElement("tr");
        row.setAttribute("data-id", exp.id);
        row.innerHTML = `
            <td>${exp.name}</td>
            <td>${exp.date}</td>
            <td>${exp.category}</td>
            <td>${exp.description || ""}</td>
            <td>₹${exp.amount}</td>
            <td>
                <button class="edit-btn edit" onclick="editExpense(${exp.id})">✏️</button>
                <button class="delete-btn delete" onclick="deleteExpense(${exp.id})">❌</button>
            </td>
            <td>
                ${exp.image_url ? getFileLink(exp.image_url, exp.file_type) : "No file"}
            </td>
        `;
        tableBody.appendChild(row);
    });

    // ADD PAGINATION CONTROLS
    let paginationControls = document.getElementById("expense-pagination-controls");
    paginationControls.innerHTML = `
        <button onclick="fetchExpenses('${fromDate}', '${toDate}', 1)">First</button>
        <button onclick="fetchExpenses('${fromDate}', '${toDate}', ${data.current_page - 1})" ${data.current_page === 1 ? 'disabled' : ''}>Prev</button>
        <span>Page ${data.current_page} / ${data.total_pages}</span>
        <button onclick="fetchExpenses('${fromDate}', '${toDate}', ${data.current_page + 1})" ${data.current_page === data.total_pages ? 'disabled' : ''}>Next</button>
        <button onclick="fetchExpenses('${fromDate}', '${toDate}', ${data.total_pages})">Last</button>
    `;
}

function getFileLink(url, fileType) {
    const imageTypes = ["image/jpeg", "image/png"];
    if (imageTypes.includes(fileType)) {
        return `<a href="#" onclick="showImagePopup('${url}'); return false;">${String.fromCodePoint(128444)}</a>`;
    } else {
        return `<a href="${url}" target="_blank">${String.fromCodePoint(128196)}</a>`;
    }
}

function openPdfInNewTab(url) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        })
        .catch(error => console.error('Error opening PDF:', error));
}

// Show image in a popup
function showImagePopup(imageUrl) {
    let popup = document.createElement("div");
    popup.classList.add("image-popup");
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="closeImagePopup()">&times;</span>
            <img src="${imageUrl}" />
        </div>
    `;
    document.body.appendChild(popup);
}

// Close image popup
function closeImagePopup() {
    let popup = document.querySelector(".image-popup");
    if (popup) {
        popup.remove();
    }
}

// Show the add expense popup
document.getElementById("add-expense-btn").addEventListener("click", function() {
    document.getElementById("add-expense-popup").style.display = "flex";
    document.body.style.overflow = "hidden"; // Disable background scrolling
});

// Close the add expense popup
document.getElementById("close-popup-btn").addEventListener("click", function() {
    document.getElementById("add-expense-popup").style.display = "none";
    document.body.style.overflow = "auto"; // Enable background scrolling
});

// Add new expense
document.getElementById("expense-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    let formData = new FormData(event.target);

    let expenseId = document.getElementById("expense-id").value;
    let url = `${API_URL}/add_expense`;
    let method = "POST";
    if (expenseId) {
        url = `${API_URL}/edit_expense/${expenseId}`;
        method = "PUT";
    }
    let response = await fetch(url, {
        method: method,
        body: formData
    });
    let result = await response.json();
    fetchExpenses();
    fetchStats();
    event.target.reset();
    document.getElementById("expense-id").value = "";
    document.getElementById("file-upload-label").textContent = "Upload File";
    document.getElementById("add-expense-popup").style.display = "none"; // Close popup after submission
    document.body.style.overflow = "auto"; // Enable background scrolling
});

// Update expense field inline
async function updateExpense(id, field, value) {
    let formData = new FormData();
    formData.append(field, value);
    await fetch(`${API_URL}/edit_expense/${id}`, {
        method: "PUT",
        body: formData
    });
    fetchExpenses();
}

// Upload image
async function uploadImage(id, file) {
    let formData = new FormData();
    formData.append("file-upload", file);
    await fetch(`${API_URL}/edit_expense/${id}`, {
        method: "PUT",
        body: formData
    });
    fetchExpenses();
}

// Delete expense
async function deleteExpense(id) {
    const smileFace = String.fromCodePoint(128515); // Decimal Unicode for 😃
    if (!confirm(`${smileFace}Sure you want to Delete?`)) return;
    await fetch(`${API_URL}/delete_expense/${id}`, { method: "DELETE" });
    fetchExpenses();
    setTimeout(fetchStats, 500);
}

// Fetch expense details for editing
async function fetchExpenseDetails(id) {
    let response = await fetch(`${API_URL}/get_expense/${id}`);
    if (response.status === 404) {
        alert("Expense not found");
        return;
    }
    let expense = await response.json();
    document.getElementById("expense-id").value = expense.id;
    document.getElementById("name").value = expense.name;
    document.getElementById("category").value = expense.category;
    document.getElementById("date").value = expense.date;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("description").value = expense.description;
    document.getElementById("file-upload").value = "";
}

// Edit expense
async function editExpense(id) {
    await fetchExpenseDetails(id);
    document.getElementById("add-expense-popup").style.display = "flex"; // Open the popup
    document.body.style.overflow = "hidden"; // Disable background scrolling
    document.getElementById("expense-form").scrollIntoView({ behavior: "smooth" });
}

// Filter expenses by date
document.getElementById("filter-btn").addEventListener("click", function() {
    const fromDate = document.getElementById("from-date").value;
    const toDate = document.getElementById("to-date").value;
    if (!fromDate || !toDate) {
        showTemporaryAlert("😯Please fill out both date fields😅", "error");
        return;
    }
    fetchExpenses(fromDate, toDate);
    updateStats(fromDate, toDate); // Ensure stats are also updated
});

// Refresh expense list
document.getElementById("refresh-btn").addEventListener("click", function() {
    document.getElementById("from-date").value = "";
    document.getElementById("to-date").value = "";
    fetchExpenses();
    fetchStats();
});

// Fetch and update stats
async function fetchStats() {
    let response = await fetch(`${API_URL}/get_stats`);
    let stats = await response.json();
    document.getElementById("total-spent-value").textContent = stats.total_spent.toFixed(2);
    document.getElementById("expense-count-value").textContent = stats.expense_count;
    document.getElementById("last-7days-spent-value").textContent = stats.last_7days_spent.toFixed(2);
    document.getElementById("highest-category-value").textContent = stats.highest_category;
    document.getElementById("highest-amount-value").textContent = stats.highest_amount.toFixed(2);
}

// Update stats based on filtered expenses
async function updateStats(fromDate, toDate) {
    let url = `${API_URL}/get_stats`;
    if (fromDate && toDate) {
        url += `?from_date=${fromDate}&to_date=${toDate}`;
    }
    let response = await fetch(url);
    let stats = await response.json();
    document.getElementById("total-spent-value").textContent = stats.total_spent.toFixed(2);
    document.getElementById("expense-count-value").textContent = stats.expense_count;
    document.getElementById("last-7days-spent-value").textContent = stats.last_7days_spent.toFixed(2);
    document.getElementById("highest-category-value").textContent = stats.highest_category;
    document.getElementById("highest-amount-value").textContent = stats.highest_amount.toFixed(2);
}

// Toggle recurring status
async function toggleRecurring(id, isRecurring) {
    const checkbox = event.target; // Get the checkbox element that triggered the event
    const originalState = !isRecurring; // Store the original state (opposite of what it's changing to)
    
    const confirmation = confirm(`Set as ${isRecurring ? "recurring" : "non-recurring"}?`);
    if (!confirmation) {
        checkbox.checked = originalState; // Revert checkbox to original state if cancelled
        return;
    }

    try {
        const response = await fetch(`${API_URL}/toggle_recurring/${id}`, {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recurring: isRecurring })
        });
        
        if (!response.ok) {
            // If the server request fails, revert the checkbox
            checkbox.checked = originalState;
            throw new Error('Failed to update recurring status');
        }
    } catch (error) {
        console.error('Error updating recurring status:', error);
        checkbox.checked = originalState;
        showTemporaryAlert('Failed to update recurring status', 'error');
    }
}

// Fetch and display budgets
async function fetchBudgets(page = 1) {
    const month = document.getElementById('budget-month-select').value;
    const year = document.getElementById('budget-year-select').value;
    
    let url = `${API_URL}/get_budgets?page=${page}`;
    if (month) url += `&month=${month}`;
    if (year) url += `&year=${year}`;

    try {
        let response = await fetch(url);
        let data = await response.json();
        
        // Update table body
        let tableBody = document.getElementById("budget-table-body");
        tableBody.innerHTML = "";

        if (!data.budgets || data.budgets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-table-message">No budgets found</td></tr>';
            return;
        }

        data.budgets.forEach(budget => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${budget.year}</td>
                <td>${budget.month}</td>
                <td>${budget.category}</td>
                <td>₹${budget.amount}</td>
                <td>
                    <button class="edit-btn edit" onclick="editBudget(${budget.id})">✏️</button>
                    <button class="delete-btn delete" onclick="deleteBudget(${budget.id})">❌</button>
                </td>
                <td>
                    <input type="checkbox" ${budget.recurring ? "checked" : ""} 
                    onclick="toggleRecurring(${budget.id}, this.checked)" />
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update pagination controls
        let paginationControls = document.getElementById("budget-pagination-controls");
        paginationControls.innerHTML = `
            <button onclick="fetchBudgets(1)">First</button>
            <button onclick="fetchBudgets(${data.current_page - 1})" ${data.current_page === 1 ? 'disabled' : ''}>Prev</button>
            <span>Page ${data.current_page} / ${data.total_pages}</span>
            <button onclick="fetchBudgets(${data.current_page + 1})" ${data.current_page === data.total_pages ? 'disabled' : ''}>Next</button>
            <button onclick="fetchBudgets(${data.total_pages})">Last</button>
        `;
    } catch (error) {
        console.error('Error fetching budgets:', error);
    }
}

// Add new budget
document.getElementById("budget-form").removeEventListener("submit", handleBudgetFormSubmit);
document.getElementById("budget-form").addEventListener("submit", handleBudgetFormSubmit);

function handleBudgetFormSubmit(event) {
    event.preventDefault();
    let formData = new FormData(event.target);
    let budgetId = document.getElementById("budget-id").value;
    let url = `${API_URL}/add_budget`;
    let method = "POST";
    let isEditing = !!budgetId; // Check if editing

    if (isEditing) {
        url = `${API_URL}/edit_budget/${budgetId}`;
        method = "PUT";
    }

    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === "Budget added successfully!" || result.message === "Budget updated successfully!") {
            showTemporaryAlert(result.message, "success");
        } else {
            showTemporaryAlert(result.message || "Failed to save budget.", "error");
        }
        fetchBudgets();

        // If editing, close the popup after submitting
        if (isEditing) {
            document.getElementById("budget-popup").style.display = "none";
            document.body.style.overflow = "auto"; // Enable background scrolling
        }

        // Reset form fields
        const year = document.getElementById("year-select").value;
        const month = document.getElementById("month-select").value;
        document.getElementById("budget-form").reset();
        document.getElementById("year-select").value = year; // Keep selected year
        document.getElementById("month-select").value = month; // Keep selected month
        document.getElementById("set-category-amount-section").style.display = "none";
        document.getElementById("set-budget-period-btn").style.display = "block"; // Show the button again
    });
}


// Fetch budget details for editing------------------------->
async function fetchBudgetDetails(id) {

    document.getElementById("budget-form").reset(); // Clear previous form data

    let response = await fetch(`${API_URL}/get_budget/${id}?t=${Date.now()}`);
    
    if (response.status === 404) {
        alert("Budget not found");
        return;
    }

    let budget = await response.json();

    document.getElementById("budget-id").value = budget.id;
    document.getElementById("year-select").value = budget.year;
    document.getElementById("month-select").value = budget.month;

    // Ensure category selection does not break
    document.querySelectorAll('input[name="budget-category"]').forEach(input => input.checked = false);
    let categoryInput = document.querySelector(`input[name="budget-category"][value="${budget.category}"]`);
    if (categoryInput) {
        categoryInput.checked = true;
    } else {
        console.warn("Category not found in radio buttons:", budget.category);
    }

    document.getElementById("budget-amount").value = budget.amount;
}


// Edit budget------------------->
async function editBudget(id) {
    // Ensure modal is closed before reopening
    document.getElementById("budget-popup").style.display = "none"; 

    // Delay to force UI update
    await new Promise(resolve => setTimeout(resolve, 100)); 

    // Fetch budget details
    await fetchBudgetDetails(id);

    // Ensure popup opens
    document.getElementById("budget-popup").style.display = "flex";
    document.body.style.overflow = "hidden"; // Disable background scrolling
    document.getElementById("set-category-amount-section").style.display = "block"; // Ensure fields are visible
    document.getElementById("budget-form").scrollIntoView({ behavior: "smooth" }); // Scroll to form

}

// Delete budget
async function deleteBudget(id) {
    if (!confirm("Sure you want to delete this budget?")) return;
    await fetch(`${API_URL}/delete_budget/${id}`, { method: "DELETE" });
    fetchBudgets();
}

// Show the set budget popup
document.getElementById("set-budget-btn").addEventListener("click", function() {
    document.getElementById("budget-form").reset(); // Reset the form
    document.getElementById("budget-id").value = ""; // Clear the budget ID
    document.getElementById("set-category-amount-section").style.display = "none"; // Hide category and amount section
    document.getElementById("budget-popup").style.display = "flex";
    document.body.style.overflow = "hidden"; // Disable background scrolling
});

// Close the set budget popup
document.getElementById("close-budget-popup-btn").addEventListener("click", function() {
    document.getElementById("budget-popup").style.display = "none";
    document.body.style.overflow = "auto"; // Enable background scrolling
    document.getElementById("budget-form").reset();
    document.getElementById("set-category-amount-section").style.display = "none";
    document.getElementById("set-budget-period-btn").style.display = "block"; // Show the button
});

// Handle set budget period button click
document.getElementById("set-budget-period-btn").addEventListener("click", function() {
    const year = document.getElementById("year-select").value;
    const month = document.getElementById("month-select").value;

    if (!year || !month) {
        showTemporaryAlert("😯 Please select both Year and Month 😅", "error");
        return;
    }

    document.getElementById("set-budget-period-btn").style.display = "none"; // Hide the button
    document.getElementById("set-category-amount-section").style.display = "block";
});

// Show add expense popup with form reset
document.getElementById("add-expense-btn").addEventListener("click", function() {
    document.getElementById("expense-form").reset();
    document.getElementById("expense-id").value = "";
    document.getElementById("file-upload-label").textContent = "Upload File";
    document.getElementById("add-expense-popup").style.display = "flex";
    document.body.style.overflow = "hidden";
});

// Show budget popup with form reset
document.getElementById("set-budget-btn").addEventListener("click", function() {
    document.getElementById("budget-form").reset();
    document.getElementById("budget-id").value = "";
    document.getElementById("set-category-amount-section").style.display = "none";
    document.getElementById("set-budget-period-btn").style.display = "block"; // Show the button
    document.getElementById("budget-popup").style.display = "flex";
    document.body.style.overflow = "hidden";
});

async function loadAllYearDropdowns() {
    try {
        const response = await fetch(`${API_URL}/get_budget_years`);
        const data = await response.json();
        const yearDropdowns = ['year', 'pieYear', 'year-select', 'budget-year-select'];
        
        yearDropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                // Keep only the first option (Select Year/All Years)
                const firstOption = dropdown.options[0];
                dropdown.innerHTML = '';
                dropdown.appendChild(firstOption);
                
                // Sort years in descending order
                const sortedYears = data.years.sort((a, b) => b - a);
                
                sortedYears.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    if (year === new Date().getFullYear()) {
                        option.selected = true;
                    }
                    dropdown.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    loadAllYearDropdowns();  // Replace loadBudgetYears() with this
    updateCharts();
    // ...rest of your existing initialization code...
});

// Initialization
fetchExpenses();
fetchStats();
fetchBudgets(); // Fetch budgets on page load

// Helper function to show temporary alerts
function showTemporaryAlert(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => {
        alertBox.classList.add('fade-out');
        setTimeout(() => document.body.removeChild(alertBox), 300);
    }, 3000);
}

function initializeDateFilters() {
    // Set default date range to last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    
    fromDateInput.valueAsDate = sevenDaysAgo;
    toDateInput.valueAsDate = today;
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('budget-filter-btn').addEventListener('click', () => fetchBudgets(1));
    document.getElementById('budget-refresh-btn').addEventListener('click', () => {
        document.getElementById('budget-month-select').value = '';
        document.getElementById('budget-year-select').value = '';
        fetchBudgets(1);
    });
});

// Call initializeDateFilters on page load
window.addEventListener("load", function() {
    initializeDateFilters(); // Initialize date filters to last 7 days
});