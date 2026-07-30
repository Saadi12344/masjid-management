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

async function loadDashboard() {
    const [staff, donations, expenses, rentals, students] = await Promise.all([
        fetchApi("/api/staff"),
        fetchApi("/api/donations"),
        fetchApi("/api/expenses"),
        fetchApi("/api/rentals"),
        fetchApi("/api/students")
    ]);

    const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalExpenses = expenses.reduce((sum, x) => sum + Number(x.amount), 0);
    const cashInHand = totalDonations - totalExpenses;
    const totalRentalIncome = rentals
        .filter(r => r.status === "Active")
        .reduce((sum, r) => sum + Number(r.amount), 0);

    document.getElementById("totalStaff").textContent = staff.length;
    document.getElementById("totalDonations").textContent = "Rs. " + cashInHand.toLocaleString();
    document.getElementById("totalRentals").textContent = "Rs. " + totalRentalIncome.toLocaleString();
    document.getElementById("totalStudents").textContent = students.length;

    const recentBody = document.getElementById("recentDonationsBody");
    if (donations.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">No donations recorded yet.</td></tr>`;
    } else {
        recentBody.innerHTML = donations.slice(0, 5).map(d => `
            <tr>
                <td>${d.donorName}</td>
                <td>Rs. ${Number(d.amount).toLocaleString()}</td>
                <td>${d.date}</td>
                <td>${d.status === "Paid" ? '<span class="badge bg-success">Paid</span>' : '<span class="badge bg-warning text-dark">Pending</span>'}</td>
            </tr>
        `).join("");
    }
}

async function loadPrayerTimes() {
    const times = await fetchApi("/api/prayer");
    document.getElementById("prayerTableBody").innerHTML = times.map(t => `
        <tr><td><b>${t.name}</b></td><td>${t.azan}</td><td>${t.jamaat}</td></tr>
    `).join("");
}

loadDashboard();
loadPrayerTimes();
