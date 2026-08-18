const API_URL = "/api/expenses";

function authHeaders() {
    const token = localStorage.getItem("masjid_token");
    return { "Content-Type": "application/json", "Authorization": "Bearer " + token };
}

function handleAuthError(response) {
    if (response.status === 401) {
        localStorage.removeItem("masjid_token");
        localStorage.removeItem("masjid_user");
        window.location.href = "login.html";
        return true;
    }
    return false;
}

const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("tableBody");
const searchBox = document.getElementById("searchBox");
const updateBtn = document.getElementById("updateBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

let expenses = [];
let editingId = null;

async function loadExpenses() {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">Loading...</td></tr>`;
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        if (handleAuthError(response)) return;
        expenses = await response.json();
        document.getElementById("expenseId").value = generateNextId();
        render();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Could not reach server. Is the backend running?</td></tr>`;
    }
}

function generateNextId() {
    const next = expenses.length ? Math.max(...expenses.map(x => parseInt(x.expenseId.split("-")[1]))) + 1 : 1;
    return "EXP-" + String(next).padStart(4, "0");
}

function render(list = expenses) {
    tableBody.innerHTML = "";
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">No expenses recorded yet.</td></tr>`;
        return;
    }
    list.forEach(x => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${x.expenseId}</td><td>${x.title}</td><td><span class="badge bg-primary">${x.category}</span></td>
            <td>Rs. ${Number(x.amount).toLocaleString()}</td><td>${x.date}</td><td>${x.description || "-"}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${x._id}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${x._id}"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        tableBody.appendChild(row);
    });
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const amount = document.getElementById("amount").value.trim();
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value.trim();

    if (!title || !amount || !date) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({ title, category, amount, date, description })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not save expense." });
            return;
        }
        form.reset();
        Swal.fire({ icon: "success", title: "Success", text: "Expense added successfully." });
        loadExpenses();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

searchBox.addEventListener("keyup", function () {
    const value = searchBox.value.toLowerCase();
    render(expenses.filter(x => JSON.stringify(x).toLowerCase().includes(value)));
});

tableBody.addEventListener("click", async function (e) {
    const delBtn = e.target.closest(".delete-btn");
    const editBtn = e.target.closest(".edit-btn");

    if (delBtn) {
        const id = delBtn.dataset.id;
        Swal.fire({
            title: "Delete Expense?", text: "This action cannot be undone.", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d", confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
                if (handleAuthError(response)) return;
                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: "Could not delete expense." });
                    return;
                }
                Swal.fire({ icon: "success", title: "Deleted", text: "Expense deleted successfully." });
                loadExpenses();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const expense = expenses.find(x => x._id === id);
        editingId = id;
        document.getElementById("editTitle").value = expense.title;
        document.getElementById("editCategory").value = expense.category;
        document.getElementById("editAmount").value = expense.amount;
        document.getElementById("editDate").value = expense.date;
        document.getElementById("editDescription").value = expense.description;
        editModal.show();
    }
});

updateBtn.addEventListener("click", async function () {
    const title = document.getElementById("editTitle").value.trim();
    const amount = document.getElementById("editAmount").value.trim();
    const date = document.getElementById("editDate").value;

    if (!title || !amount || !date) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    const body = {
        title, amount, date,
        category: document.getElementById("editCategory").value,
        description: document.getElementById("editDescription").value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/${editingId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update expense." });
            return;
        }
        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: "Expense information has been updated." });
        loadExpenses();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

document.getElementById("exportBtn").addEventListener("click", function () {
    exportToCSV("expenses.csv", [
        { key: "expenseId", label: "ID" },
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount" },
        { key: "date", label: "Date" },
        { key: "description", label: "Description" }
    ], expenses);
});

loadExpenses();
