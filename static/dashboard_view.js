const API_URL = window.location.origin;

// Function to fetch and display expenses (READ only)
async function fetchExpenses(fromDate = "", toDate = "", page = 1) {
    let url = `${API_URL}/get_expenses?page=${page}`;
    if (fromDate && toDate) {
        url += `&from_date=${fromDate}&to_date=${toDate}`;
    }

    try {
        let response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch expenses");

        let data = await response.json();
        let expenses = data.expenses;
        let tableBody = document.getElementById("expense-table-body");
        tableBody.innerHTML = "";

        if (!expenses || expenses.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-table-message">No expenses found</td></tr>';
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
                <td>${exp.image_url ? getFileLink(exp.image_url, exp.file_type) : "No file"}</td>
            `;
            tableBody.appendChild(row);
        });

        // Pagination controls
        let paginationControls = document.getElementById("expense-pagination-controls");
        paginationControls.innerHTML = `
            <button onclick="fetchExpenses('${fromDate}', '${toDate}', 1)" ${data.current_page === 1 ? 'disabled' : ''}>First</button>
            <button onclick="fetchExpenses('${fromDate}', '${toDate}', ${data.current_page - 1})" ${data.current_page === 1 ? 'disabled' : ''}>Prev</button>
            <span>Page ${data.current_page} / ${data.total_pages}</span>
            <button onclick="fetchExpenses('${fromDate}', '${toDate}', ${data.current_page + 1})" ${data.current_page === data.total_pages ? 'disabled' : ''}>Next</button>
            <button onclick="fetchExpenses('${fromDate}', '${toDate}', ${data.total_pages})" ${data.current_page === data.total_pages ? 'disabled' : ''}>Last</button>
        `;

    } catch (error) {
        console.error("Error fetching expenses:", error);
    }
}

// Call fetchExpenses when the page loads
document.addEventListener("DOMContentLoaded", function() {
    fetchExpenses();
});

function getFileLink(url, fileType) {
    const imageTypes = ["image/jpeg", "image/png"];
    if (imageTypes.includes(fileType)) {
        return `<a href="#" onclick="showImagePopup('${url}'); return false;">${String.fromCodePoint(128444)}</a>`;
    } else {
        return `<a href="${url}" target="_blank">${String.fromCodePoint(128196)}</a>`;
    }
}

// Image popup functionality
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

function closeImagePopup() {
    let popup = document.querySelector(".image-popup");
    if (popup) {
        popup.remove();
    }
}

// Filter expenses by date
document.getElementById("filter-btn").addEventListener("click", function() {
    const fromDate = document.getElementById("from-date").value;
    const toDate = document.getElementById("to-date").value;
    if (!fromDate || !toDate) {
        const alertBox = document.createElement("div");
        alertBox.textContent = "😯Please fill out both date fields😅 ";
        alertBox.style.position = "fixed";
        alertBox.style.top = "5px";
        alertBox.style.left = "50%";
        alertBox.style.transform = "translateX(-50%)";
        alertBox.style.backgroundColor = "#f44336";
        alertBox.style.color = "#fff";
        alertBox.style.padding = "20px";
        alertBox.style.borderRadius = "20px";
        alertBox.style.boxShadow = "3px 3px 10px rgba(0, 0, 0, 0.1)";
        document.body.appendChild(alertBox);
        setTimeout(() => { document.body.removeChild(alertBox); }, 2000);
        return;
    }
    fetchExpenses(fromDate, toDate);
});

// Refresh expense list
document.getElementById("refresh-btn").addEventListener("click", function() {
    document.getElementById("from-date").value = "";
    document.getElementById("to-date").value = "";
    fetchExpenses();
    fetchStats();
});

// Fetch and display budgets (READ only)
async function fetchBudgets(page = 1) {
    let url = `${API_URL}/get_budgets?page=${page}`;
    try {
        let response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch budgets");

        let data = await response.json();
        let budgets = data.budgets;
        let tableBody = document.getElementById("budget-table-body");
        tableBody.innerHTML = "";

        if (!budgets || budgets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-table-message">No budgets found</td></tr>';
            return;
        }

        budgets.forEach(budget => {
            let row = document.createElement("tr");
            row.setAttribute("data-id", budget.id);
            row.innerHTML = `
                <td>${budget.year}</td>
                <td>${budget.month}</td>
                <td>${budget.category}</td>
                <td>₹${budget.amount}</td>
                <td>${budget.recurring ? "Yes" : "No"}</td>
            `;
            tableBody.appendChild(row);
        });

        // Add pagination controls
        let paginationControls = document.getElementById("budget-pagination-controls");
        paginationControls.innerHTML = `
            <button onclick="fetchBudgets(1)" ${data.current_page === 1 ? 'disabled' : ''}>First</button>
            <button onclick="fetchBudgets(${data.current_page - 1})" ${data.current_page === 1 ? 'disabled' : ''}>Prev</button>
            <span>Page ${data.current_page} / ${data.total_pages}</span>
            <button onclick="fetchBudgets(${data.current_page + 1})" ${data.current_page === data.total_pages ? 'disabled' : ''}>Next</button>
            <button onclick="fetchBudgets(${data.total_pages})" ${data.current_page === data.total_pages ? 'disabled' : ''}>Last</button>
        `;
    } catch (error) {
        console.error("Error fetching budgets:", error);
    }
}

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

// Initialize filters
function initializeDateFilters() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    
    fromDateInput.valueAsDate = sevenDaysAgo;
    toDateInput.valueAsDate = today;
}

// Initialize on page load
window.addEventListener("load", function() {
    initializeDateFilters();
    fetchExpenses();
    fetchStats();
    fetchBudgets();

});
