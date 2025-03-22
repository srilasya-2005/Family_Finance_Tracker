document.addEventListener("DOMContentLoaded", function () {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // Months are zero-indexed

    console.log("Current Year:", currentYear);
    console.log("Current Month:", currentMonth);

    // Populate year dropdown
    const yearDropdown = document.getElementById("year");
    if (yearDropdown) {
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true; // Set current year as default
            }
            yearDropdown.appendChild(option);
        }
    } else {
        console.error("Year dropdown element not found!");
    }

    // Populate month dropdown
    const monthDropdown = document.getElementById("month");
    if (monthDropdown) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthNames.forEach((monthName, index) => {
            const option = document.createElement("option");
            option.value = index + 1;
            option.textContent = monthName;
            if (index + 1 === currentMonth) {
                option.selected = true; // Set current month as default
            }
            monthDropdown.appendChild(option);
        });
    } else {
        console.error("Month dropdown element not found!");
    }

    updateCategoryPlot();  // Load default category plot when page loads
    updateCharts();  // Load default charts when page loads
});

function updateCategoryPlot() {
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;

    fetch(`/plot/category_data/${year}/${month}`)
        .then(response => response.json())
        .then(data => {
            if (data.no_data) {
                alert("Insufficient data available for the selected month and year.");
            } else {
                document.getElementById("categoryChart").src = "data:image/png;base64," + data.category_plot;
            }
        })
        .catch(error => console.error("Error updating chart:", error));
}

async function updateLineChart() {
    const year = document.getElementById("pieYear").value;  // Get selected year

    try {
        const response = await fetch(`/plot/line_chart/${year}`);
        const data = await response.json();
        document.getElementById("lineChart").src = "data:image/png;base64," + data.line_chart;
    } catch (error) {
        console.error("Error updating line chart:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    updateCharts();  // Load default charts when page loads
});

async function updateCharts() {
    const user = document.getElementById("pieUser").value;
    const year = document.getElementById("pieYear").value;
    const month = document.getElementById("pieMonth").value;

    try {
        let noData = false;

        // Update Pie Chart
        const pieResponse = await fetch(`/plot/pie_chart/${year}/${month}?user=${encodeURIComponent(user)}`);
        const pieData = await pieResponse.json();
        if (pieData.no_data) noData = true;
        else document.getElementById("pieChart").src = "data:image/png;base64," + pieData.pie_chart;

        // Update Bar Chart
        const barResponse = await fetch(`/plot/bar_chart/${year}/${month}?user=${encodeURIComponent(user)}`);
        const barData = await barResponse.json();
        if (barData.no_data) noData = true;
        else document.getElementById("barChart").src = "data:image/png;base64," + barData.bar_chart;

        // Update Stacked Bar Chart
        const stackedResponse = await fetch(`/plot/stacked_bar_chart/${year}/${month}`);
        const stackedData = await stackedResponse.json();
        if (stackedData.no_data) noData = true;
        else document.getElementById("stackedBarChart").src = "data:image/png;base64," + stackedData.stacked_bar_chart;

        // Update Line Chart
        await updateLineChart();  // Add this function call

        if (noData) {
            alert("Insufficient data available for the selected month and year.");
        }

    } catch (error) {
        console.error("Error updating charts:", error);
    }
}
function loadExpenses(page) {
fetch(`/dashboard_view?expense_page=${page}`)
.then(response => response.text())
.then(data => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/html');
  const newTableBody = doc.getElementById('expense-table-body').innerHTML;
  document.getElementById('expense-table-body').innerHTML = newTableBody;

  const newPagination = doc.querySelector('.pagination').innerHTML;
  document.querySelector('.pagination').innerHTML = newPagination;
})
.catch(error => console.error('Error loading expenses:', error));}