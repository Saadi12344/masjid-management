const API_URL = "/api/auth";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");


// ==========================
// Show / Hide Password
// ==========================
function showPassword() {
    passwordInput.type =
        passwordInput.type === "password"
            ? "text"
            : "password";
}


// ==========================
// If already logged in
// ==========================
if (localStorage.getItem("masjid_token")) {
    window.location.href = "dashboard.html";
}


// ==========================
// Handle Login
// ==========================
loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;


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

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        });


        const data = await response.json();


        // ==========================================
        // Multiple Masjids
        // ==========================================

        if (
            response.ok &&
            data.requiresMasjidSelection
        ) {

            Swal.close();

            showMasjidSelection(
                email,
                password,
                data.masjids
            );

            return;
        }


        // ==========================================
        // Login Failed
        // ==========================================

        if (!response.ok) {

            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: data.message || "Invalid email or password."
            });

            return;
        }


        // ==========================================
        // Login Successful
        // ==========================================

        saveLogin(data);

    } catch (err) {

        console.error("Login error:", err);

        Swal.fire({
            icon: "error",
            title: "Connection Error",
            text: "Could not reach the server. Make sure the backend is running."
        });
    }
});


// ==================================================
// Show Masjid Selection
// ==================================================

function showMasjidSelection(email, password, masjids) {

    let options = "";

    masjids.forEach(masjid => {

        options += `
            <option value="${masjid._id}">
                ${masjid.name}
            </option>
        `;

    });


    Swal.fire({

        title: "Select Masjid",

        html: `
            <p class="text-muted mb-3">
                This email is registered with multiple masjids.
                Please select your masjid.
            </p>

            <select id="loginMasjid" class="form-select">
                <option value="">Select Masjid</option>
                ${options}
            </select>
        `,

        showCancelButton: true,

        confirmButtonText: "Continue",

        cancelButtonText: "Cancel",

        preConfirm: () => {

            const masjidId =
                document.getElementById("loginMasjid").value;

            if (!masjidId) {

                Swal.showValidationMessage(
                    "Please select a masjid"
                );

                return false;
            }

            return masjidId;
        }

    }).then(async result => {

        if (!result.isConfirmed) {
            return;
        }


        const masjidId = result.value;


        Swal.fire({
            title: "Logging in...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });


        try {

            const response = await fetch(`${API_URL}/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password,
                    masjidId
                })

            });


            const data = await response.json();


            if (!response.ok) {

                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: data.message || "Invalid login details."
                });

                return;
            }


            saveLogin(data);

        } catch (err) {

            console.error("Masjid login error:", err);

            Swal.fire({
                icon: "error",
                title: "Connection Error",
                text: "Could not reach the server."
            });

        }

    });
}


// ==================================================
// Save Login
// ==================================================

function saveLogin(data) {

    localStorage.setItem(
        "masjid_token",
        data.token
    );

    localStorage.setItem(
        "masjid_user",
        JSON.stringify(data.user)
    );


    Swal.fire({

        icon: "success",

        title: "Welcome!",

        text: `Logged in as ${data.user.name}`,

        timer: 1200,

        showConfirmButton: false

    }).then(() => {

        window.location.href = "dashboard.html";

    });
}