// Include this script FIRST (before sweetalert2 and page-specific js)
// on every page that should require login: dashboard.html, staff.html,
// students.html, donations.html, expenses.html, rentals.html, prayer.html,
// events.html, reports.html, settings.html

(function () {
    const token = localStorage.getItem("masjid_token");

    if (!token) {
        window.location.href = "login.html";
    }

    // Apply saved theme immediately (before page paints) to avoid a light-mode flash
    const savedTheme = localStorage.getItem("masjid_theme") || "light";
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
})();

function getLoggedInUser() {
    return JSON.parse(localStorage.getItem("masjid_user")) || { name: "Admin" };
}

// "staff" role = view + create only, no edit/delete on records.
// (superadmin / admin can always manage entries)
function canManageEntries() {
    const user = getLoggedInUser();
    return !!user && user.role !== "staff";
}

function logout() {
    localStorage.removeItem("masjid_token");
    localStorage.removeItem("masjid_user");
    window.location.href = "login.html";
}

function applyThemeIcon() {
    const theme = document.documentElement.getAttribute("data-bs-theme") || "light";
    const icon = document.querySelector("#themeToggle i");
    if (icon) {
        icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const nameEl = document.getElementById("loggedInUserName");
    if (nameEl) {
        nameEl.textContent = getLoggedInUser().name;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    applyThemeIcon();

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const current = document.documentElement.getAttribute("data-bs-theme") || "light";
            const next = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-bs-theme", next);
            localStorage.setItem("masjid_theme", next);
            applyThemeIcon();
        });
    }

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("show");
    }

    if (sidebarToggle && sidebar && backdrop) {
        sidebarToggle.addEventListener("click", function () {
            sidebar.classList.toggle("open");
            backdrop.classList.toggle("show");
        });
        backdrop.addEventListener("click", closeSidebar);
    }

    // Dynamic masjid name in navbar (from Settings, cached for instant paint)
    const brandNameEl = document.getElementById("topbarBrandName");
    if (brandNameEl) {
        const cachedName = localStorage.getItem("masjid_name_cache");
        if (cachedName) brandNameEl.textContent = cachedName;

        const token = localStorage.getItem("masjid_token");
        fetch("/api/settings", { headers: { "Authorization": "Bearer " + token } })
            .then(res => res.ok ? res.json() : null)
            .then(settings => {
                if (settings && settings.masjidName) {
                    brandNameEl.textContent = settings.masjidName;
                    localStorage.setItem("masjid_name_cache", settings.masjidName);
                }
            })
            .catch(() => {});
    }
});


