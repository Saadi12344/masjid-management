const API_URL = "/api/events";

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

const form = document.getElementById("eventForm");
const tableBody = document.getElementById("tableBody");
const searchBox = document.getElementById("searchBox");
const updateBtn = document.getElementById("updateBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

let events = [];
let editingId = null;

async function loadEvents() {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Loading...</td></tr>`;
    try {
        const response = await fetchWithRetry(API_URL, { headers: authHeaders() }, 1, 8000);
        if (handleAuthError(response)) return;
        events = await response.json();
        document.getElementById("eventId").value = generateNextId();
        render();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Server is taking a moment to wake up — please refresh in a few seconds.</td></tr>`;
    }
}

function generateNextId() {
    const next = events.length ? Math.max(...events.map(ev => parseInt(ev.eventId.split("-")[1]))) + 1 : 1;
    return "EVT-" + String(next).padStart(4, "0");
}

function render(list = events) {
    tableBody.innerHTML = "";
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">No events scheduled yet.</td></tr>`;
        return;
    }
    list.forEach(ev => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${ev.eventId}</td><td>${ev.eventName}</td><td>${ev.date}</td><td>${ev.time}</td><td>${ev.venue}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${ev._id}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${ev._id}"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        tableBody.appendChild(row);
    });
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const eventName = document.getElementById("eventName").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const venue = document.getElementById("venue").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!eventName || !date || !time || !venue) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({ eventName, date, time, venue, description })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not save event." });
            return;
        }
        form.reset();
        Swal.fire({ icon: "success", title: "Success", text: "Event added successfully." });
        loadEvents();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

searchBox.addEventListener("keyup", function () {
    const value = searchBox.value.toLowerCase();
    render(events.filter(ev => JSON.stringify(ev).toLowerCase().includes(value)));
});

tableBody.addEventListener("click", async function (e) {
    const delBtn = e.target.closest(".delete-btn");
    const editBtn = e.target.closest(".edit-btn");

    if (delBtn) {
        const id = delBtn.dataset.id;
        Swal.fire({
            title: "Delete Event?", text: "This action cannot be undone.", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d", confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
                if (handleAuthError(response)) return;
                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: "Could not delete event." });
                    return;
                }
                Swal.fire({ icon: "success", title: "Deleted", text: "Event deleted successfully." });
                loadEvents();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const ev = events.find(x => x._id === id);
        editingId = id;
        document.getElementById("editEventName").value = ev.eventName;
        document.getElementById("editDate").value = ev.date;
        document.getElementById("editTime").value = ev.time;
        document.getElementById("editVenue").value = ev.venue;
        document.getElementById("editDescription").value = ev.description;
        editModal.show();
    }
});

updateBtn.addEventListener("click", async function () {
    const eventName = document.getElementById("editEventName").value.trim();
    const date = document.getElementById("editDate").value;
    const time = document.getElementById("editTime").value;
    const venue = document.getElementById("editVenue").value.trim();

    if (!eventName || !date || !time || !venue) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
        return;
    }

    const body = {
        eventName, date, time, venue,
        description: document.getElementById("editDescription").value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/${editingId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not update event." });
            return;
        }
        editModal.hide();
        Swal.fire({ icon: "success", title: "Updated Successfully", text: "Event information has been updated." });
        loadEvents();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

loadEvents();
