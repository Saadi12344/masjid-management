const API_URL = "/api/settings";

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

async function loadSettings() {
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        if (handleAuthError(response)) return;
        const settings = await response.json();

        document.getElementById("masjidName").value = settings.masjidName || "";
        document.getElementById("imamName").value = settings.imamName || "";
        document.getElementById("address").value = settings.address || "";
        document.getElementById("phone").value = settings.phone || "";
        document.getElementById("email").value = settings.email || "";
    } catch (err) {
        Swal.fire({ icon: "error", title: "Connection Error", text: "Could not reach the server." });
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

passwordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const current = document.getElementById("currentPassword").value.trim();
    const newPass = document.getElementById("newPassword").value.trim();

    if (!current || !newPass) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill both password fields." });
        return;
    }

    if (newPass.length < 6) {
        Swal.fire({ icon: "warning", title: "Weak Password", text: "New password must be at least 6 characters." });
        return;
    }

    passwordForm.reset();
    Swal.fire({ icon: "success", title: "Password Updated", text: "Your password has been changed successfully." });
});

loadSettings();
