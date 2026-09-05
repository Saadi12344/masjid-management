const API_URL = "/api/rentals";

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

const form = document.getElementById("rentalForm");
const tableBody = document.getElementById("tableBody");
const searchBox = document.getElementById("searchBox");
const updateBtn = document.getElementById("updateBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

let rentals = [];
let editingId = null;

function statusBadge(status) {
    return status === "Active"
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-danger">Vacant</span>';
}

function typeBadge(type) {
    return type === "Expense"
        ? '<span class="badge bg-danger">Expense</span>'
        : '<span class="badge bg-success">Income</span>';
}

function renderSummary(list = rentals) {
    const totalIncome = list.filter(r => r.type !== "Expense").reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpense = list.filter(r => r.type === "Expense").reduce((sum, r) => sum + Number(r.amount), 0);
    const net = totalIncome - totalExpense;

    document.getElementById("rentalSummary").innerHTML = `
        <div class="col-6 col-lg-4">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Rental Income</h6>
                <h3 class="fw-bold text-success mb-0">Rs. ${totalIncome.toLocaleString()}</h3>
            </div>
        </div>
        <div class="col-6 col-lg-4">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Rental Expense</h6>
                <h3 class="fw-bold text-danger mb-0">Rs. ${totalExpense.toLocaleString()}</h3>
            </div>
        </div>
        <div class="col-12 col-lg-4">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Net</h6>
                <h3 class="fw-bold mb-0" style="color:${net >= 0 ? '#198754' : '#dc3545'};">Rs. ${net.toLocaleString()}</h3>
            </div>
        </div>
    `;
}

async function loadRentals() {
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary py-4">Loading...</td></tr>`;
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        if (handleAuthError(response)) return;
        rentals = await response.json();
        document.getElementById("rentalId").value = generateNextId();
        render();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Could not reach server. Is the backend running?</td></tr>`;
    }
}

function generateNextId() {
    const next = rentals.length ? Math.max(...rentals.map(r => parseInt(r.rentalId.split("-")[1]))) + 1 : 1;
    return "RNT-" + String(next).padStart(4, "0");
}

function render(list = rentals) {
    tableBody.innerHTML = "";
    renderSummary(list);

    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary py-4">No rental records yet.</td></tr>`;
        return;
    }
    list.forEach(r => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${r.rentalId}</td><td>${typeBadge(r.type)}</td><td>${r.tenantName}</td><td>${r.property}</td>
            <td>Rs. ${Number(r.amount).toLocaleString()}</td><td>${r.phone}</td><td>${r.startDate}</td><td>${statusBadge(r.status)}</td>
            <td>
                ${canManageEntries() ? `
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${r._id}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${r._id}"><i class="fa-solid fa-trash"></i></button>
                ` : `<span class="text-muted small">View only</span>`}
            </td>`;
        tableBody.appendChild(row);
    });
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const type = document.getElementById("type").value;
    const tenantName = document.getElementById("tenantName").value.trim();
    const property = document.getElementById("property").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const startDate = document.getElementById("startDate").value;
    const status = document.getElementById("status").value;

    if (!tenantName || !property || !amount || !phone || !startDate) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({ type, tenantName, property, amount, phone, startDate, status })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not save record." });
            return;
        }
        form.reset();
        Swal.fire({ icon: "success", title: "Success", text: "Record added successfully." });
        loadRentals();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

searchBox.addEventListener("keyup", function () {
    const value = searchBox.value.toLowerCase();
    render(rentals.filter(r => JSON.stringify(r).toLowerCase().includes(value)));
});

tableBody.addEventListener("click", async function (e) {
    const delBtn = e.target.closest(".delete-btn");
    const editBtn = e.target.closest(".edit-btn");

    if (delBtn) {
        const id = delBtn.dataset.id;
        Swal.fire({
            title: "Delete Record?", text: "This action cannot be undone.", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d", confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
                if (handleAuthError(response)) return;
                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: "Could not delete record." });
                    return;
                }
                Swal.fire({ icon: "success", title: "Deleted", text: "Record deleted successfully." });
                loadRentals();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const rental = rentals.find(r => r._id === id);
        editingId = id;
        document.getElementById("editType").value = rental.type || "Income";
        document.getElementById("editTenantName").value = rental.tenantName;
        document.getElementById("editProperty").value = rental.property;
        document.getElementById("editAmount").value = rental.amount;
        document.getElementById("editPhone").value = rental.phone;
        document.getElementById("editStartDate").value = rental.startDate;
        document.getElementById("editStatus").value = rental.status;
        editModal.show();
    }
});

updateBtn.addEventListener("click", async function () {
    const tenantName = document.getElementById("editTenantName").value.trim();
    const property = document.getElementById("editProperty").value.trim();
    const amount = document.getElementById("editAmount").value.trim();
    const phone = document.getElementById("editPhone").value.trim();

    if (!tenantName || !property || !amount || !phone) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    const body = {
        type: document.getElementById("editType").value,
        tenantName, property, amount, phone,
        startDate: document.getElementById("editStartDate").value,
        status: document.getElementById("editStatus").value
    };

    try {
        const response = await fetch(`${API_URL}/${editingId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update record." });
            return;
        }
        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: "Record has been updated." });
        loadRentals();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

document.getElementById("exportBtn").addEventListener("click", function () {
    exportToCSV("rentals.csv", [
        { key: "rentalId", label: "ID" },
        { key: "type", label: "Type" },
        { key: "tenantName", label: "Tenant/Party" },
        { key: "property", label: "Property" },
        { key: "amount", label: "Amount" },
        { key: "phone", label: "Phone" },
        { key: "startDate", label: "Date" },
        { key: "status", label: "Status" }
    ], rentals);
});

loadRentals();
