const API_URL = "/api/donations";

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

const form = document.getElementById("donationForm");
const tableBody = document.getElementById("tableBody");
const searchBox = document.getElementById("searchBox");
const updateBtn = document.getElementById("updateBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

let donations = [];
let editingId = null;

function statusBadge(status) {
    return status === "Paid"
        ? '<span class="badge bg-success">Paid</span>'
        : '<span class="badge bg-warning text-dark">Pending</span>';
}

async function loadDonations() {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">Loading...</td></tr>`;
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        if (handleAuthError(response)) return;
        donations = await response.json();
        document.getElementById("donationId").value = generateNextId();
        render();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Could not reach server. Is the backend running?</td></tr>`;
    }
}

function generateNextId() {
    const next = donations.length ? Math.max(...donations.map(d => parseInt(d.donationId.split("-")[1]))) + 1 : 1;
    return "DN-" + String(next).padStart(4, "0");
}

function render(list = donations) {
    tableBody.innerHTML = "";
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">No donations recorded yet.</td></tr>`;
        return;
    }
    list.forEach(d => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${d.donationId}</td><td>${d.donorName}</td><td>Rs. ${Number(d.amount).toLocaleString()}</td>
            <td>${d.phone}</td><td>${d.purpose}</td><td>${d.date}</td><td>${statusBadge(d.status)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-secondary print-btn" data-id="${d._id}" title="Print Receipt"><i class="fa-solid fa-print"></i></button>
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${d._id}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${d._id}"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        tableBody.appendChild(row);
    });
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const donorName = document.getElementById("donorName").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const purpose = document.getElementById("purpose").value;
    const date = document.getElementById("date").value;
    const status = document.getElementById("status").value;

    if (!donorName || !amount || !phone || !date) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({ donorName, amount, phone, purpose, date, status })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not save donation." });
            return;
        }
        form.reset();
        Swal.fire({ icon: "success", title: "Success", text: "Donation added successfully." });
        loadDonations();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

searchBox.addEventListener("keyup", function () {
    const value = searchBox.value.toLowerCase();
    render(donations.filter(d => JSON.stringify(d).toLowerCase().includes(value)));
});

tableBody.addEventListener("click", async function (e) {
    const delBtn = e.target.closest(".delete-btn");
    const editBtn = e.target.closest(".edit-btn");
    const printBtn = e.target.closest(".print-btn");

    if (printBtn) {
        const id = printBtn.dataset.id;
        const donation = donations.find(d => d._id === id);
        printDonationReceipt(donation);
        return;
    }

    if (delBtn) {
        const id = delBtn.dataset.id;
        Swal.fire({
            title: "Delete Donation?", text: "This action cannot be undone.", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d", confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
                if (handleAuthError(response)) return;
                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: "Could not delete donation." });
                    return;
                }
                Swal.fire({ icon: "success", title: "Deleted", text: "Donation deleted successfully." });
                loadDonations();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const donation = donations.find(d => d._id === id);
        editingId = id;
        document.getElementById("editDonorName").value = donation.donorName;
        document.getElementById("editAmount").value = donation.amount;
        document.getElementById("editPhone").value = donation.phone;
        document.getElementById("editPurpose").value = donation.purpose;
        document.getElementById("editDate").value = donation.date;
        document.getElementById("editStatus").value = donation.status;
        editModal.show();
    }
});

updateBtn.addEventListener("click", async function () {
    const donorName = document.getElementById("editDonorName").value.trim();
    const amount = document.getElementById("editAmount").value.trim();
    const phone = document.getElementById("editPhone").value.trim();

    if (!donorName || !amount || !phone) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    const body = {
        donorName, amount, phone,
        purpose: document.getElementById("editPurpose").value,
        date: document.getElementById("editDate").value,
        status: document.getElementById("editStatus").value
    };

    try {
        const response = await fetch(`${API_URL}/${editingId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update donation." });
            return;
        }
        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: "Donation information has been updated." });
        loadDonations();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});
document.getElementById("exportBtn").addEventListener("click", function () {
    exportToCSV("donations.csv", [
        { key: "donationId", label: "ID" },
        { key: "donorName", label: "Donor Name" },
        { key: "amount", label: "Amount" },
        { key: "phone", label: "Phone" },
        { key: "purpose", label: "Purpose" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" }
    ], donations);
});

loadDonations();
