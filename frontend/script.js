const API_URL = "/api/auth";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// ==========================
// Show / Hide Password
// ==========================
function showPassword() {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
}

// ==========================
// If already logged in, skip login page
// ==========================
if (localStorage.getItem("masjid_token")) {
    window.location.href = "dashboard.html";
}

// ==========================
// Handle Login
// ==========================
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        Swal.fire({
            icon: "warning",
            title: "Missing Information",
            text: "Please enter both email and password."
        });
        return;
    }

    Swal.fire({
        title: "Logging in...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: data.message || "Invalid email or password."
            });
            return;
        }

        // Save token and user info for future requests
        localStorage.setItem("masjid_token", data.token);
        localStorage.setItem("masjid_user", JSON.stringify(data.user));

        Swal.fire({
            icon: "success",
            title: "Welcome!",
            text: `Logged in as ${data.user.name}`,
            timer: 1200,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "dashboard.html";
        });

    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Connection Error",
            text: "Could not reach the server. Make sure the backend is running (node server.js)."
        });
    }
});
