function authHeaders() {
    const token = localStorage.getItem("masjid_token");
    return { "Authorization": "Bearer " + token };
}

async function fetchApi(url) {
    try {
        const response = await fetch(url, { headers: authHeaders() });
        if (response.status === 401) {
            localStorage.removeItem("masjid_token");
            localStorage.removeItem("masjid_user");
            window.location.href = "login.html";
            return [];
        }
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        return [];
    }
}

let allDonations = [];
let allExpenses = [];
let allStudents = [];
let allRentals = [];
let allFeePayments = [];

function filterByDate(list) {
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;

    return list.filter(item => {
        if (from && item.date < from) return false;
        if (to && item.date > to) return false;
        return true;
    });
}

function renderReports() {
    const donations = filterByDate(allDonations);
    const expenses = filterByDate(allExpenses);
    const feePayments = filterByDate(allFeePayments);

    const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalFeeCollected = feePayments.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalIncome = totalDonations + totalFeeCollected;
    const totalExpenses = expenses.reduce((sum, x) => sum + Number(x.amount), 0);
    const balance = totalIncome - totalExpenses;

    document.getElementById("summaryCards").innerHTML = `
        <div class="col-6 col-lg-3">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Total Income (Donations + Fees)</h6>
                <h3 class="fw-bold text-success mb-0">Rs. ${totalIncome.toLocaleString()}</h3>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Total Expenses</h6>
                <h3 class="fw-bold text-danger mb-0">Rs. ${totalExpenses.toLocaleString()}</h3>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Net Balance (Cash in Hand)</h6>
                <h3 class="fw-bold mb-0 ${balance >= 0 ? 'text-success' : 'text-danger'}">Rs. ${balance.toLocaleString()}</h3>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="card stat-card p-4 text-center">
                <h6 class="text-secondary mb-2">Students / Rentals</h6>
                <h3 class="fw-bold text-primary mb-0">${allStudents.length} / ${allRentals.length}</h3>
            </div>
        </div>
    `;

    const donationsBody = document.getElementById("donationsTableBody");
    if (donations.length === 0) {
        donationsBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">No donation records found for this range.</td></tr>`;
    } else {
        donationsBody.innerHTML = donations.slice(0, 10).map(d => `
            <tr>
                <td>${d.donorName}</td>
                <td>Rs. ${Number(d.amount).toLocaleString()}</td>
                <td>${d.date}</td>
                <td>${d.status === "Paid" ? '<span class="badge bg-success">Paid</span>' : '<span class="badge bg-warning text-dark">Pending</span>'}</td>
            </tr>
        `).join("");
    }

    const expensesBody = document.getElementById("expensesTableBody");
    if (expenses.length === 0) {
        expensesBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">No expense records found for this range.</td></tr>`;
    } else {
        expensesBody.innerHTML = expenses.slice(0, 10).map(x => `
            <tr>
                <td>${x.title}</td>
                <td><span class="badge bg-primary">${x.category}</span></td>
                <td>Rs. ${Number(x.amount).toLocaleString()}</td>
                <td>${x.date}</td>
            </tr>
        `).join("");
    }
}

async function loadReports() {
    const [donations, expenses, students, rentals, feePayments] = await Promise.all([
        fetchApi("/api/donations"),
        fetchApi("/api/expenses"),
        fetchApi("/api/students"),
        fetchApi("/api/rentals"),
        fetchApi("/api/fee-payments")
    ]);

    allDonations = donations;
    allExpenses = expenses;
    allStudents = students;
    allRentals = rentals;
    allFeePayments = feePayments;

    renderReports();
}

document.getElementById("applyFilterBtn").addEventListener("click", renderReports);

document.getElementById("clearFilterBtn").addEventListener("click", function () {
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    renderReports();
});

document.getElementById("printBtn").addEventListener("click", () => window.print());

loadReports();
