const API_URL = "/api/students";

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

const form = document.getElementById("studentForm");
const tableBody = document.getElementById("tableBody");
const searchBox = document.getElementById("searchBox");
const updateBtn = document.getElementById("updateBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));
const feeModal = new bootstrap.Modal(document.getElementById("feeModal"));
const saveFeeBtn = document.getElementById("saveFeeBtn");
const feeTableBody = document.getElementById("feeTableBody");

let students = [];
let editingId = null;
let currentFeeStudent = null;
let feePayments = [];

async function loadStudents() {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">Loading...</td></tr>`;
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        if (handleAuthError(response)) return;
        students = await response.json();
        document.getElementById("studentId").value = generateNextId();
        render();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Could not reach server. Is the backend running?</td></tr>`;
    }
}

function generateNextId() {
    const next = students.length ? Math.max(...students.map(s => parseInt(s.studentId.split("-")[1]))) + 1 : 1;
    return "STU-" + String(next).padStart(4, "0");
}

function render(list = students) {
    tableBody.innerHTML = "";
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">No students registered yet.</td></tr>`;
        return;
    }
    list.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${s.studentId}</td><td>${s.studentName}</td><td>${s.fatherName}</td><td>${s.studentClass}</td>
            <td>Rs. ${Number(s.fee).toLocaleString()}</td><td>${s.phone}</td>
            <td>
                <button type="button" class="btn btn-sm btn-success fee-btn" data-id="${s._id}" title="Record Fee Payment"><i class="fa-solid fa-money-bill"></i></button>
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${s._id}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${s._id}"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        tableBody.appendChild(row);
    });
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const studentName = document.getElementById("studentName").value.trim();
    const fatherName = document.getElementById("fatherName").value.trim();
    const studentClass = document.getElementById("studentClass").value.trim();
    const fee = document.getElementById("fee").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!studentName || !fatherName || !studentClass || !fee || !phone) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({ studentName, fatherName, studentClass, fee, phone, address })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not save student." });
            return;
        }
        form.reset();
        Swal.fire({ icon: "success", title: "Success", text: "Student added successfully." });
        loadStudents();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

searchBox.addEventListener("keyup", function () {
    const value = searchBox.value.toLowerCase();
    render(students.filter(s => JSON.stringify(s).toLowerCase().includes(value)));
});

tableBody.addEventListener("click", async function (e) {
    const delBtn = e.target.closest(".delete-btn");
    const editBtn = e.target.closest(".edit-btn");
    const feeBtn = e.target.closest(".fee-btn");

    if (feeBtn) {
        const id = feeBtn.dataset.id;
        const student = students.find(s => s._id === id);
        currentFeeStudent = student;
        document.getElementById("feeStudentName").textContent = student.studentName;
        document.getElementById("feeMonth").value = "";
        document.getElementById("feeAmount").value = student.fee;
        document.getElementById("feeDate").value = new Date().toISOString().split("T")[0];
        feeModal.show();
        return;
    }

    if (delBtn) {
        const id = delBtn.dataset.id;
        Swal.fire({
            title: "Delete Student?", text: "This action cannot be undone.", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d", confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
                if (handleAuthError(response)) return;
                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: "Could not delete student." });
                    return;
                }
                Swal.fire({ icon: "success", title: "Deleted", text: "Student deleted successfully." });
                loadStudents();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const student = students.find(s => s._id === id);
        editingId = id;
        document.getElementById("editStudentName").value = student.studentName;
        document.getElementById("editFatherName").value = student.fatherName;
        document.getElementById("editClass").value = student.studentClass;
        document.getElementById("editFee").value = student.fee;
        document.getElementById("editPhone").value = student.phone;
        document.getElementById("editAddress").value = student.address;
        editModal.show();
    }
});

updateBtn.addEventListener("click", async function () {
    const studentName = document.getElementById("editStudentName").value.trim();
    const fatherName = document.getElementById("editFatherName").value.trim();
    const studentClass = document.getElementById("editClass").value.trim();
    const fee = document.getElementById("editFee").value.trim();
    const phone = document.getElementById("editPhone").value.trim();

    if (!studentName || !fatherName || !studentClass || !fee || !phone) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    const body = {
        studentName, fatherName, studentClass, fee, phone,
        address: document.getElementById("editAddress").value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/${editingId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update student." });
            return;
        }
        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: "Student information has been updated." });
        loadStudents();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

document.getElementById("exportBtn").addEventListener("click", function () {
    exportToCSV("students.csv", [
        { key: "studentId", label: "ID" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "studentClass", label: "Class" },
        { key: "fee", label: "Fee" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" }
    ], students);
});

loadStudents();

// ==========================
// Fee Payments
// ==========================
const FEE_API = "/api/fee-payments";

async function loadFeePayments() {
    try {
        const response = await fetch(FEE_API, { headers: authHeaders() });
        if (handleAuthError(response)) return;
        feePayments = await response.json();
        renderFeePayments();
    } catch (err) {
        feeTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Could not load fee payments.</td></tr>`;
    }
}

function renderFeePayments() {
    if (feePayments.length === 0) {
        feeTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">No fee payments recorded yet.</td></tr>`;
        return;
    }
    feeTableBody.innerHTML = feePayments.map(p => `
        <tr>
            <td>${p.paymentId}</td>
            <td>${p.studentName}</td>
            <td>${p.month}</td>
            <td>Rs. ${Number(p.amount).toLocaleString()}</td>
            <td>${p.date}</td>
            <td><button type="button" class="btn btn-sm btn-danger delete-fee-btn" data-id="${p._id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join("");
}

saveFeeBtn.addEventListener("click", async function () {
    const month = document.getElementById("feeMonth").value.trim();
    const amount = document.getElementById("feeAmount").value.trim();
    const date = document.getElementById("feeDate").value;

    if (!month || !amount || !date) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(FEE_API, {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({
                studentId: currentFeeStudent._id,
                studentName: currentFeeStudent.studentName,
                amount, month, date
            })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not record payment." });
            return;
        }
        feeModal.hide();
        Swal.fire({ icon: "success", title: "Payment Recorded", text: `Fee payment added to Cash in Hand.` });
        loadFeePayments();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

feeTableBody.addEventListener("click", async function (e) {
    const delBtn = e.target.closest(".delete-fee-btn");
    if (!delBtn) return;

    const id = delBtn.dataset.id;

    Swal.fire({
        title: "Delete this payment record?",
        text: "This will remove it from Cash in Hand too.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, Delete"
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        try {
            const response = await fetch(`${FEE_API}/${id}`, { method: "DELETE", headers: authHeaders() });
            if (handleAuthError(response)) return;
            if (!response.ok) {
                Swal.fire({ icon: "error", title: "Error", text: "Could not delete payment record." });
                return;
            }
            Swal.fire({ icon: "success", title: "Deleted", text: "Payment record deleted." });
            loadFeePayments();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
        }
    });
});

loadFeePayments();
