const API_URL = "/api/prayer";

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

const tableBody = document.getElementById("tableBody");
const updateBtn = document.getElementById("updateBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

let times = [];
let editingName = null;

async function loadTimes() {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">Loading...</td></tr>`;
    try {
        const response = await fetchWithRetry(API_URL, { headers: authHeaders() }, 1, 8000);
        if (handleAuthError(response)) return;
        times = await response.json();
        render();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">Server is taking a moment to wake up — please refresh in a few seconds.</td></tr>`;
    }
}

function render() {
    tableBody.innerHTML = "";
    times.forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><b>${t.name}</b></td><td>${t.azan}</td><td>${t.jamaat}</td>
            <td><button type="button" class="btn btn-sm btn-primary edit-btn" data-name="${t.name}"><i class="fa-solid fa-pen"></i> Edit</button></td>
        `;
        tableBody.appendChild(row);
    });
}

tableBody.addEventListener("click", function (e) {
    const editBtn = e.target.closest(".edit-btn");
    if (!editBtn) return;

    const name = editBtn.dataset.name;
    const t = times.find(x => x.name === name);
    editingName = name;

    document.getElementById("editPrayerName").value = t.name;
    document.getElementById("editAzan").value = t.azan;
    document.getElementById("editJamaat").value = t.jamaat;

    editModal.show();
});

updateBtn.addEventListener("click", async function () {
    const azan = document.getElementById("editAzan").value;
    const jamaat = document.getElementById("editJamaat").value;

    if (!azan || !jamaat) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please set both times." });
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${editingName}`, {
            method: "PUT", headers: authHeaders(), body: JSON.stringify({ azan, jamaat })
        });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update timing." });
            return;
        }
        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: `${editingName} timing has been updated.` });
        loadTimes();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

loadTimes();
