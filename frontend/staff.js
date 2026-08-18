const API_URL = "/api/staff";

function authHeaders() {
    const token = localStorage.getItem("masjid_token");
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
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

const staffForm = document.getElementById("staffForm");
const tableBody = document.getElementById("staffTableBody");
const searchInput = document.getElementById("searchStaff");
const updateBtn = document.getElementById("updateBtn");

const editModal = new bootstrap.Modal(document.getElementById("editModal"));

let staffList = [];
let editingId = null;

async function loadStaff() {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">Loading...</td></tr>`;

    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        if (handleAuthError(response)) return;

        staffList = await response.json();
        document.getElementById("staffId").value = generateNextId();
        render();

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Could not reach server. Is the backend running?</td></tr>`;
    }
}

function generateNextId() {
    const next = staffList.length
        ? Math.max(...staffList.map(s => parseInt(s.staffId.split("-")[1]))) + 1
        : 1;
    return "STF-" + String(next).padStart(4, "0");
}

function render(list = staffList) {
    tableBody.innerHTML = "";

    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">No staff members added yet.</td></tr>`;
        return;
    }

    list.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${s.staffId}</td>
            <td>${s.name}</td>
            <td>${s.designation}</td>
            <td>${s.salary}</td>
            <td>${s.cnic || "-"}</td>
            <td>${s.phone}</td>
            <td>${s.city}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${s._id}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${s._id}"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

staffForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const designation = document.getElementById("designation").value.trim();
    const salary = document.getElementById("salary").value.trim();
    const cnic = document.getElementById("cnic").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();

    if (!name || !designation || !salary || !phone || !city) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ name, designation, salary, cnic, phone, city })
        });

        if (handleAuthError(response)) return;

        const data = await response.json();

        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not save staff." });
            return;
        }

        staffForm.reset();
        Swal.fire({ icon: "success", title: "Success", text: "Staff added successfully." });
        loadStaff();

    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

searchInput.addEventListener("keyup", function () {
    const value = searchInput.value.toLowerCase();
    render(staffList.filter(s => JSON.stringify(s).toLowerCase().includes(value)));
});

tableBody.addEventListener("click", async function (e) {
    const deleteButton = e.target.closest(".delete-btn");
    const editButton = e.target.closest(".edit-btn");

    if (deleteButton) {
        const id = deleteButton.dataset.id;

        Swal.fire({
            title: "Delete Staff?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE",
                    headers: authHeaders()
                });

                if (handleAuthError(response)) return;

                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: "Could not delete staff." });
                    return;
                }

                Swal.fire({ icon: "success", title: "Deleted", text: "Staff deleted successfully." });
                loadStaff();

            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    }

    if (editButton) {
        const id = editButton.dataset.id;
        const s = staffList.find(x => x._id === id);
        editingId = id;

        document.getElementById("editName").value = s.name;
        document.getElementById("editDesignation").value = s.designation;
        document.getElementById("editSalary").value = s.salary;
        document.getElementById("editPhone").value = s.phone;
        document.getElementById("editCity").value = s.city;

        editModal.show();
    }
});

updateBtn.addEventListener("click", async function () {
    const name = document.getElementById("editName").value.trim();
    const designation = document.getElementById("editDesignation").value.trim();
    const salary = document.getElementById("editSalary").value.trim();
    const phone = document.getElementById("editPhone").value.trim();
    const city = document.getElementById("editCity").value.trim();

    if (!name || !designation || !salary || !phone || !city) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${editingId}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ name, designation, salary, phone, city })
        });

        if (handleAuthError(response)) return;

        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update staff." });
            return;
        }

        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: "Staff information has been updated." });
        loadStaff();

    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

const cnicInput = document.getElementById("cnic");
cnicInput.addEventListener("input", function () {
    let value = this.value.replace(/\D/g, "");
    if (value.length > 5) value = value.slice(0, 5) + "-" + value.slice(5);
    if (value.length > 13) value = value.slice(0, 13) + "-" + value.slice(13);
    this.value = value;
});

document.getElementById("exportBtn").addEventListener("click", function () {
    exportToCSV("staff.csv", [
        { key: "staffId", label: "Staff ID" },
        { key: "name", label: "Name" },
        { key: "designation", label: "Designation" },
        { key: "salary", label: "Salary" },
        { key: "cnic", label: "CNIC" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" }
    ], staffList);
});

loadStaff();
