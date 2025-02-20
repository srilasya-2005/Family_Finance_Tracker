document.addEventListener("DOMContentLoaded", () => {
  loadExpenses();

  document.getElementById("expense-form").addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const expenseId = event.target.getAttribute("data-edit-id");

      if (!formData.get("name") || !formData.get("category") || !formData.get("date") || !formData.get("amount")) {
          alert("Please fill all required fields!");
          return;
      }

      if (expenseId) {
          await updateExpense(expenseId, formData);
      } else {
          await addExpense(formData);
      }

      event.target.reset();
      event.target.removeAttribute("data-edit-id");
      loadExpenses();
  });
});

async function addExpense(formData) {
  try {
      const response = await fetch("/add_expense", {
          method: "POST",
          body: formData,
      });

      const result = await response.json();
      alert(result.message);
      loadExpenses();
  } catch (error) {
      console.error("Error adding expense:", error);
  }
}

async function loadExpenses() {
  try {
      const response = await fetch("/get_expenses");
      const expenses = await response.json();
      const tableBody = document.getElementById("expense-table-body");

      tableBody.innerHTML = "";
      expenses.forEach((exp) => {
          const row = document.createElement("tr");
          row.dataset.id = exp.id;
          row.innerHTML = `
              <td>${exp.name}</td>
              <td>${exp.date}</td>
              <td>${exp.category}</td>
              <td>${exp.description || '-'}</td>
              <td>₹${exp.amount}</td>
              <td>
                  <button class='edit-btn' onclick='editExpense(${exp.id})'>Edit</button>
                  <button class='delete-btn' onclick='deleteExpense(${exp.id})'>Delete</button>
              </td>
              <td>
                  ${exp.file_name ? `<a href="/uploads/${exp.file_name}" target="_blank">${exp.file_name}</a>` : 'No file'}
              </td>
          `;
          tableBody.appendChild(row);
      });
  } catch (error) {
      console.error("Error loading expenses:", error);
  }
}

async function editExpense(id) {
  try {
      const response = await fetch(`/get_expenses`);
      const expenses = await response.json();
      const expense = expenses.find(e => e.id === id);

      if (!expense) {
          alert("Expense not found!");
          return;
      }

      document.getElementById("name").value = expense.name;
      document.getElementById("category").value = expense.category;
      document.getElementById("date").value = expense.date;
      document.getElementById("amount").value = expense.amount;
      document.getElementById("description").value = expense.description;
      document.getElementById("expense-form").setAttribute("data-edit-id", id);
  } catch (error) {
      console.error("Error editing expense:", error);
  }
}

async function updateExpense(id, formData) {
  try {
      const response = await fetch(`/edit_expense/${id}`, {
          method: "PUT",
          body: formData,
      });

      const result = await response.json();
      alert(result.message);
      loadExpenses();
  } catch (error) {
      console.error("Error updating expense:", error);
  }
}

async function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
      try {
          const response = await fetch(`/delete_expense/${id}`, { method: "DELETE" });
          const result = await response.json();
          alert(result.message);
          loadExpenses();
      } catch (error) {
          console.error("Error deleting expense:", error);
      }
  }
}
