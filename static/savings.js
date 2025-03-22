document.getElementById("savingTargetForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const id = document.getElementById("savingTargetForm").dataset.id;
    const category = document.getElementById("saving_category_name").value;
    const data = {
        saving_category_name: category,
        saving_category_description: document.getElementById("saving_category_description").value,
        savings_goal_name: document.getElementById("savings_goal_name").value,
        savings_target_amount: document.getElementById("savings_target_amount").value,
        savings_target_date: document.getElementById("savings_target_date").value
    };
    const url = id ? `/update_saving_target/${id}` : '/add_saving_target';
    const method = id ? "PUT" : "POST";
    fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(response => response.json())
        .then(response => {
            loadData();
            closeForm('savingTargetForm');
            showMessage(response.message);
            updateGraphs(); // Update graphs
        });
    console.log(savingsData);
});

document.getElementById("savingsForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const data = {
        savings_target_id: document.getElementById("savings_target_id").value,
        savings_goal_name: document.getElementById("savings_goal_name").value,
        savings_amount_saved: document.getElementById("savings_amount_saved").value,
        savings_payment_mode: document.getElementById("savings_payment_mode").value,
        savings_date_saved: document.getElementById("savings_date_saved").value
    };
    fetch('/add_savings', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(response => response.json())
        .then(response => {
            loadData();
            closeForm('savingsForm');
            showMessage(response.message);
            updateGraphs(); // Update graphs
        });
    console.log(savingsData);
});

let currentPage = 1;
const rowsPerPage = 5; // Number of rows to display per page
let savingsData = []; // Store all fetched data

document.addEventListener("DOMContentLoaded", function () {
    loadFiltersfortables()       // Loads filters for the chart
     // Loads filters for the table
    loadData();          // Loads savings data
});
function loadData() {
    fetch('/get_all_data')
        .then(response => response.json())
        .then(data => {
            savingsData = data; // Store the data globally
            displayTableData(); // Display the first page
        });
    console.log(savingsData);
}
function loadFiltersfortables() {      // Loads filters for the table
    fetch('/get_filters_for_table')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error fetching filters:", data.error);
                return;
            }

            const monthFilter = document.getElementById("tableMonthFilter");
            const yearFilter = document.getElementById("tableYearFilter");

            monthFilter.innerHTML = '<option value="">Select Month</option>';
            yearFilter.innerHTML = '<option value="">Select Year</option>';

            data.forEach(item => {
                if (!monthFilter.querySelector(`option[value="${item.month}"]`)) {
                    monthFilter.innerHTML += `<option value="${item.month}">${item.month}</option>`;
                }
                if (!yearFilter.querySelector(`option[value="${item.year}"]`)) {
                    yearFilter.innerHTML += `<option value="${item.year}">${item.year}</option>`;
                }
            });
        })
        .catch(error => console.error("Failed to load filters:", error));
        console.log(savingsData);
}
function updateTables() {    // Updates the table data based on the selected filters
    const selectedMonth = document.getElementById("tableMonthFilter").value;
    const selectedYear = document.getElementById("tableYearFilter").value;

    let url = '/get_all_data';
    if (selectedMonth || selectedYear) {
        url += `?month=${selectedMonth}&year=${selectedYear}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            savingsData = data;
            displayTableData();
        })
        .catch(error => console.error("Failed to load filtered table data:", error));
    console.log(savingsData);
}
function toggleFilter() {
    const filterOptions = document.getElementById("filterOptions");
    const filterButton = document.getElementById("filterToggle");

    if (filterOptions.style.display === "block") {
        filterOptions.style.display = "none";
        return;
    }

    // Get button position
    const rect = filterButton.getBoundingClientRect();
    filterOptions.style.top = `${rect.bottom + window.scrollY}px`;
    filterOptions.style.left = `${rect.left + window.scrollX}px`;
    
    filterOptions.style.display = "block";
}
          
function displayTableData() {
    console.log("User Privilege in JS:", userPrivilege);  // Debug log
    
    const tbody = document.getElementById("savingsTable").querySelector("tbody");
    tbody.innerHTML = "";

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = savingsData.slice(startIndex, endIndex);
    console.log(pageData);

    if (pageData.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8; // Adjust based on the number of columns in your table
        cell.textContent = "You Have No Savings Added.";
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    pageData.forEach(item => {
        let remainingAmount;
        if (item.savings_amount_saved >= item.savings_target_amount) {
            remainingAmount = item.savings_amount_saved == item.savings_target_amount ? "Reached" : "Exceeded";
        } else {
            remainingAmount = item.savings_target_amount - item.savings_amount_saved;
        }
        const row = document.createElement("tr");
        row.setAttribute("data-id", item.savings_target_id);
        row.innerHTML = `
            <td>${item.saving_category_name || ''}</td>
            <td>${item.savings_goal_name || ''}</td>
            <td>${item.savings_target_amount || ''}</td>
            <td>${item.savings_target_date || ''}</td>
            <td>${item.savings_amount_saved || ''}</td>
            <td>${remainingAmount}</td>
            <td>${item.savings_payment_mode || ''}</td>
            
            ${userPrivilege === 'edit' ? `
                <td>
                    <button class="edit" onclick="editTarget(${item.savings_target_id})">✏️</button>
                    <button class="delete" onclick="deleteTarget(${item.savings_target_id})">❌</button>
                </td>
                <td>
                    <button class="update" onclick="updateSavings(${item.savings_target_id})">Update</button>
                </td>
                ` : ''}            
            
        `;
        tbody.appendChild(row);
    });

    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(savingsData.length / rowsPerPage);

    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;

    document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTableData();
    }
}

function nextPage() {
    const totalPages = Math.ceil(savingsData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayTableData();
    }
}

function editTarget(id) {
    fetch(`/get_savings/${id}`)
        .then(response => response.json())
        .then(data => {
            const target = data.savings;
            document.getElementById("saving_category_name").value = target.saving_category_name;
            document.getElementById("saving_category_description").value = target.saving_category_description;
            document.getElementById("savings_goal_name").value = target.savings_goal_name;
            document.getElementById("savings_target_amount").value = target.savings_target_amount;
            document.getElementById("savings_target_date").value = target.savings_target_date;
            document.getElementById("savingTargetForm").dataset.id = id;
            showForm('savingTargetForm');
        });
    console.log(savingsData);
}

function deleteTarget(id) {
    if (confirm("Are you sure you want to delete this saving target?")) {
        fetch(`/delete_saving_target/${id}`, { method: "DELETE" })
            .then(response => response.json())
            .then(response => {
                loadData();
                showMessage(response.message);
                updateGraphs(); // Update graphs
            });
    }
    console.log(savingsData);
}

function deleteSavings(id) {
    fetch(`/delete_savings/${id}`, { method: "DELETE" })
        .then(response => response.json())
        .then(() => {
            loadData();
            updateGraphs(); // Update graphs
        });
    console.log(savingsData);
}

function updateSavings(id) {
    const target = document.querySelector(`tr[data-id='${id}']`);
    fetch(`/get_savings/${id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("savings_target_id").value = id;
            if (data.savings) {
                document.getElementById("savings_amount_saved").value = data.savings.savings_amount_saved;
                document.getElementById("savings_payment_mode").value = data.savings.savings_payment_mode;
                document.getElementById("savings_date_saved").value = data.savings.savings_date_saved;
            } else {
                document.getElementById("savings_amount_saved").value = '';
                document.getElementById("savings_payment_mode").value = '';
                document.getElementById("savings_date_saved").value = '';
            }
            showForm('savingsForm');
        });
        console.log(savingsData);
}

function showForm(formId) {
    // Show the selected form
    document.getElementById(formId).style.display = 'block';
    // Center the form
    document.getElementById(formId).style.display = 'flex';
    // Show the backdrop
    document.getElementById('backdrop').style.display = 'block';
}

function closeForm(formId) {
    document.getElementById(formId).style.display = 'none';
    // Hide the backdrop
    document.getElementById('backdrop').style.display = 'none';
    // Clear form data
    const form = document.getElementById(formId).querySelector('.form-container');
    form.reset();
    if (formId === 'savingTargetForm') {
        document.getElementById("savingTargetForm").dataset.id = '';
    }
}

function showMessage(message) {
    alert(message);
}


function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    document.querySelector("header").classList.toggle("dark-mode");
    document.querySelectorAll("nav button").forEach(button => button.classList.toggle("dark-mode"));
    document.querySelector(".table-list").classList.toggle("dark-mode");
    document.querySelectorAll("table").forEach(table => table.classList.toggle("dark-mode"));
    document.querySelectorAll(".form-popup").forEach(form => form.classList.toggle("dark-mode"));
    document.querySelectorAll(".close-btn").forEach(button => button.classList.toggle("dark-mode"));
    document.querySelectorAll("form button").forEach(button => button.classList.toggle("dark-mode"));
    saveDarkModePreference();
}

function saveDarkModePreference() {
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
}

function loadDarkModePreference() {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "enabled") {
        toggleDarkMode();
    }
}

function updateGraphs() {
    // Update the bar chart
    fetch("/get_savings_data")
        .then(response => response.json())
        .then(data => {
            let usernames = data.map(item => item.username);
            let achieved_savings = data.map(item => item.Achieved_Savings);
            let target_savings = data.map(item => item.Target_Savings);
            let trace = {
                x: usernames,
                y: achieved_savings,
                type: "bar",
                text: achieved_savings.map((s, i) => `Saved: ${s}<br>Target: ${target_savings[i]}`),
                hoverinfo: "text",
                textposition: 'none', // Prevent text from showing on bar itself
                marker: { color: "royalblue" }
            };

            let layout = {
                title: {
                    text: "User Saving",
                    font: { color: "black" }
                },
                xaxis: { 
                    title: { 
                        text: "Users", 
                        font: { color: "black" },  // Title color
                    }, 
                    tickfont: { color: "black" }, 
                    automargin: true
                },
                yaxis: { 
                    title: { 
                        text: "Savings", 
                        font: { color: "black" },  // Title color
                        standoff: 20  // Increased spacing
                    }, 
                    tickfont: { color: "black" }, 
                    automargin: true
                },
                margin: { l: 100 },  // Increase left margin to allow space
                
                paper_bgcolor: "rgba(0,0,0,0)",  /* Fully transparent chart background */
                plot_bgcolor: "rgba(0,0,0,0)",   /* Fully transparent plot area */
                margin: { t: 50, l: 50, r: 70, b: 50 }
            };
            
            var config ={
                displayModeBar: false,
                textposition: 'none'
            }
            Plotly.newPlot("chart", [trace], layout, config);
        });

    // Update the pie chart
    let month = document.getElementById("monthFilter").value;
    let year = document.getElementById("yearFilter").value;
    let img = document.getElementById("savingsPieChart");
    let queryParams = new URLSearchParams();
    if (month) queryParams.append("month", month);
    if (year) queryParams.append("year", year);
    img.src = "/savings_chart?" + queryParams.toString();

    // Update the gauge chart
    let gaugeChartContainer = document.getElementById("gaugeChartContainer");
    fetch("/gauge_chart?" + queryParams.toString())
        .then(response => response.text())
        .then(html => {
            gaugeChartContainer.innerHTML = html;

            // Execute any embedded scripts in the response
            let scripts = gaugeChartContainer.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                let newScript = document.createElement("script");
                newScript.textContent = scripts[i].textContent;
                document.body.appendChild(newScript);  // Run script in the body
            }
        });
}

loadData();
