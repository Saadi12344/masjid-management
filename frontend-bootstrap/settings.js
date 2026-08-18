const API_URL = "/api/settings";
const USERS_API = "/api/users";
const AUTH_API = "/api/auth";

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

const settingsForm = document.getElementById("settingsForm");
const passwordForm = document.getElementById("passwordForm");
const createUserForm = document.getElementById("createUserForm");
const usersTableBody = document.getElementById("usersTableBody");

async function loadSettings() {
    try {
        const response = await fetchWithRetry(API_URL, { headers: authHeaders() }, 1, 8000);
        if (handleAuthError(response)) return;
        const settings = await response.json();

        document.getElementById("masjidName").value = settings.masjidName || "";
        document.getElementById("imamName").value = settings.imamName || "";
        document.getElementById("address").value = settings.address || "";
        document.getElementById("phone").value = settings.phone || "";
        document.getElementById("email").value = settings.email || "";
    } catch (err) {
        Swal.fire({ icon: "info", title: "Waking up...", text: "Server was asleep, please refresh the page in a few seconds." });
    }
}

settingsForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const body = {
        masjidName: document.getElementById("masjidName").value.trim(),
        imamName: document.getElementById("imamName").value.trim(),
        address: document.getElementById("address").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    try {
        const response = await fetch(API_URL, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
        if (handleAuthError(response)) return;
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: "Could not save settings." });
            return;
        }
        localStorage.setItem("masjid_name_cache", body.masjidName);
        const brandNameEl = document.getElementById("topbarBrandName");
        if (brandNameEl) brandNameEl.textContent = body.masjidName;
        Swal.fire({ icon: "success", title: "Saved", text: "Masjid information updated successfully." });
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

// ==========================
// Change own password (real, connected to backend)
// ==========================
passwordForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();

    if (!currentPassword || !newPassword) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill both password fields." });
        return;
    }

    if (newPassword.length < 6) {
        Swal.fire({ icon: "warning", title: "Weak Password", text: "New password must be at least 6 characters." });
        return;
    }

    try {
        const response = await fetch(`${AUTH_API}/change-password`, {
            method: "PUT", headers: authHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });
        if (handleAuthError(response)) return;
        const data = await response.json();
        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not update password." });
            return;
        }
        passwordForm.reset();
        Swal.fire({ icon: "success", title: "Password Updated", text: "Your password has been changed successfully." });
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
    }
});

// ==========================
// Manage Staff Accounts (admin only)
// ==========================
function renderUsers(users) {
    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">No staff accounts yet.</td></tr>`;
        return;
    }

    const currentUserId = (JSON.parse(localStorage.getItem("masjid_user")) || {}).id;

    usersTableBody.innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'bg-success' : 'bg-primary'}">${u.role}</span></td>
            <td>
                ${u._id === currentUserId
                    ? '<span class="text-secondary small">This is you</span>'
                    : `<button type="button" class="btn btn-sm btn-danger delete-user-btn" data-id="${u._id}"><i class="fa-solid fa-trash"></i></button>`
                }
            </td>
        </tr>
    `).join("");
}

async function loadUsers() {
    try {
        const response = await fetch(USERS_API, { headers: authHeaders() });

        if (response.status === 403) {
            // Not an admin - hide the whole section
            document.getElementById("userManagementSection").style.display = "none";
            return;
        }

        if (handleAuthError(response)) return;

        if (!response.ok) return;

        document.getElementById("userManagementSection").style.display = "block";
        const users = await response.json();
        renderUsers(users);

    } catch (err) {
        // Silently skip - not critical if this section fails to load
    }
}

if (createUserForm) {
    createUserForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("newUserName").value.trim();
        const email = document.getElementById("newUserEmail").value.trim();
        const password = document.getElementById("newUserPassword").value.trim();
        const role = document.getElementById("newUserRole").value;

        if (!name || !email || !password) {
            Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all fields." });
            return;
        }

        try {
            const response = await fetch(USERS_API, {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({ name, email, password, role })
            });
            if (handleAuthError(response)) return;
            const data = await response.json();
            if (!response.ok) {
                Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not create account." });
                return;
            }
            createUserForm.reset();
            Swal.fire({ icon: "success", title: "Account Created", text: `Login created for ${name}.` });
            loadUsers();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
        }
    });
}

if (usersTableBody) {
    usersTableBody.addEventListener("click", async function (e) {
        const delBtn = e.target.closest(".delete-user-btn");
        if (!delBtn) return;

        const id = delBtn.dataset.id;

        Swal.fire({
            title: "Delete this account?",
            text: "This person will no longer be able to log in.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                const response = await fetch(`${USERS_API}/${id}`, { method: "DELETE", headers: authHeaders() });
                if (handleAuthError(response)) return;
                const data = await response.json();
                if (!response.ok) {
                    Swal.fire({ icon: "error", title: "Error", text: data.message || "Could not delete account." });
                    return;
                }
                Swal.fire({ icon: "success", title: "Deleted", text: "Account deleted successfully." });
                loadUsers();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
            }
        });
    });
}

loadSettings();
loadUsers();
