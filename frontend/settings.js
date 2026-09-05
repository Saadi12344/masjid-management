// =====================================================
// API URLs
// =====================================================

const SETTINGS_API = "/api/settings";
const MASJID_API = "/api/masjids";
const USERS_API = "/api/users";


// =====================================================
// AUTH HEADERS
// =====================================================

function authHeaders() {

    const token = localStorage.getItem("masjid_token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


// =====================================================
// HANDLE AUTH ERROR
// =====================================================

function handleAuthError(response) {

    if (response.status === 401) {

        localStorage.removeItem("masjid_token");
        localStorage.removeItem("masjid_user");

        window.location.href = "login.html";

        return true;
    }

    return false;
}


// =====================================================
// GET LOGGED-IN USER
// =====================================================

function getLoggedInUser() {

    try {

        const user = localStorage.getItem("masjid_user");

        if (!user) {
            return null;
        }

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Could not read logged-in user:",
            error
        );

        return null;
    }
}


// =====================================================
// DOM ELEMENTS
// =====================================================

const settingsForm =
    document.getElementById("settingsForm");

const passwordForm =
    document.getElementById("passwordForm");

const superadminMasjidSection =
    document.getElementById("superadminMasjidSection");

const masjidInformationSection =
    document.getElementById("masjidInformationSection");

const masjidTableBody =
    document.getElementById("masjidTableBody");

const addMasjidBtn =
    document.getElementById("addMasjidBtn");

const masjidForm =
    document.getElementById("masjidForm");

const adminForm =
    document.getElementById("adminForm");


// =====================================================
// USER MANAGEMENT DOM
// =====================================================

const userManagementSection =
    document.getElementById("userManagementSection");

const userTableBody =
    document.getElementById("userTableBody");

const addUserBtn =
    document.getElementById("addUserBtn");

const userForm =
    document.getElementById("userForm");

const userModalElement =
    document.getElementById("userModal");


// =====================================================
// BOOTSTRAP MODALS
// =====================================================

const masjidModalElement =
    document.getElementById("masjidModal");

const adminModalElement =
    document.getElementById("adminModal");


const masjidModal =
    masjidModalElement
        ? new bootstrap.Modal(masjidModalElement)
        : null;


const adminModal =
    adminModalElement
        ? new bootstrap.Modal(adminModalElement)
        : null;


const userModal =
    userModalElement
        ? new bootstrap.Modal(userModalElement)
        : null;


// =====================================================
// LOAD SETTINGS
// =====================================================

async function loadSettings() {

    const user = getLoggedInUser();

    if (!user) {
        return;
    }


    // -------------------------------------------------
    // SUPERADMIN
    // -------------------------------------------------

    if (user.role === "superadmin") {

        if (masjidInformationSection) {

            masjidInformationSection.style.display =
                "none";
        }

        return;
    }


    // -------------------------------------------------
    // ADMIN / STAFF
    // -------------------------------------------------

    if (!user.masjidId) {

        console.error(
            "Logged-in user has no masjidId."
        );

        Swal.fire({
            icon: "error",
            title: "Masjid Not Assigned",
            text:
                "Your account is not linked to a masjid."
        });

        return;
    }


    try {

        const response = await fetch(
            `${SETTINGS_API}?masjidId=${encodeURIComponent(
                user.masjidId
            )}`,
            {
                headers: authHeaders()
            }
        );


        if (handleAuthError(response)) {
            return;
        }


        if (!response.ok) {

            const result =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                result.message ||
                "Could not load settings"
            );
        }


        const settings =
            await response.json();


        document.getElementById("masjidName").value =
            settings.masjidName || "";

        document.getElementById("imamName").value =
            settings.imamName || "";

        document.getElementById("address").value =
            settings.address || "";

        document.getElementById("phone").value =
            settings.phone || "";

        document.getElementById("email").value =
            settings.email || "";


        // -------------------------------------------------
        // UPDATE TOPBAR
        // -------------------------------------------------

        const brandNameEl =
            document.getElementById("topbarBrandName");


        if (
            brandNameEl &&
            settings.masjidName
        ) {

            brandNameEl.textContent =
                settings.masjidName;
        }


    } catch (error) {

        console.error(
            "Load settings error:",
            error
        );

        Swal.fire({
            icon: "error",
            title: "Error",
            text:
                error.message ||
                "Could not load settings."
        });
    }
}


// =====================================================
// SAVE SETTINGS
// =====================================================

if (settingsForm) {

    settingsForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const user =
                getLoggedInUser();


            if (!user) {
                return;
            }


            // Superadmin doesn't use this form
            if (user.role === "superadmin") {

                Swal.fire({
                    icon: "info",
                    title: "Not Available",
                    text:
                        "Superadmin manages masjid information from Masjid Management."
                });

                return;
            }


            if (!user.masjidId) {

                Swal.fire({
                    icon: "error",
                    title: "Masjid Not Assigned",
                    text:
                        "Your account is not linked to a masjid."
                });

                return;
            }


            const body = {

                masjidId: user.masjidId,

                masjidName:
                    document.getElementById(
                        "masjidName"
                    ).value.trim(),

                imamName:
                    document.getElementById(
                        "imamName"
                    ).value.trim(),

                address:
                    document.getElementById(
                        "address"
                    ).value.trim(),

                phone:
                    document.getElementById(
                        "phone"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "email"
                    ).value.trim()
            };


            try {

                const response =
                    await fetch(
                        SETTINGS_API,
                        {
                            method: "PUT",
                            headers: authHeaders(),
                            body: JSON.stringify(body)
                        }
                    );


                if (handleAuthError(response)) {
                    return;
                }


                const result =
                    await response.json()
                        .catch(() => ({}));


                if (!response.ok) {

                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text:
                            result.message ||
                            "Could not save settings."
                    });

                    return;
                }


                localStorage.setItem(
                    "masjid_name_cache",
                    body.masjidName
                );


                const brandNameEl =
                    document.getElementById(
                        "topbarBrandName"
                    );


                if (brandNameEl) {

                    brandNameEl.textContent =
                        body.masjidName;
                }


                Swal.fire({
                    icon: "success",
                    title: "Saved",
                    text:
                        "Masjid information updated successfully."
                });


            } catch (error) {

                console.error(
                    "Save settings error:",
                    error
                );

                Swal.fire({
                    icon: "error",
                    title: "Connection Error",
                    text:
                        "Could not reach the server."
                });
            }
        }
    );
}


// =====================================================
// PASSWORD FORM
// =====================================================

if (passwordForm) {

    passwordForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const current =
                document.getElementById(
                    "currentPassword"
                ).value.trim();


            const newPass =
                document.getElementById(
                    "newPassword"
                ).value.trim();


            if (!current || !newPass) {

                Swal.fire({
                    icon: "warning",
                    title: "Missing Information",
                    text:
                        "Please fill both password fields."
                });

                return;
            }


            if (newPass.length < 6) {

                Swal.fire({
                    icon: "warning",
                    title: "Weak Password",
                    text:
                        "New password must be at least 6 characters."
                });

                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/auth/change-password",
                        {
                            method: "PUT",
                            headers: authHeaders(),
                            body: JSON.stringify({
                                currentPassword: current,
                                newPassword: newPass
                            })
                        }
                    );


                if (handleAuthError(response)) {
                    return;
                }


                const result =
                    await response.json()
                        .catch(() => ({}));


                if (!response.ok) {

                    Swal.fire({
                        icon: "error",
                        title: "Password Update Failed",
                        text:
                            result.message ||
                            "Could not update password."
                    });

                    return;
                }


                passwordForm.reset();


                Swal.fire({
                    icon: "success",
                    title: "Password Updated",
                    text:
                        "Your password has been changed successfully."
                });


            } catch (error) {

                console.error(
                    "Password update error:",
                    error
                );

                Swal.fire({
                    icon: "error",
                    title: "Connection Error",
                    text:
                        "Could not reach the server."
                });
            }
        }
    );
}


// =====================================================
// SETUP ROLE BASED SECTIONS
// =====================================================

function setupRoleBasedSections() {

    const user = getLoggedInUser();

    if (!user) {
        return;
    }


    // =================================================
    // SUPERADMIN
    // =================================================

    if (user.role === "superadmin") {

        if (superadminMasjidSection) {

            superadminMasjidSection.style.display =
                "block";
        }


        if (masjidInformationSection) {

            masjidInformationSection.style.display =
                "none";
        }


        // Superadmin gets user management
        if (userManagementSection) {

            userManagementSection.style.display =
                "block";
        }


        if (addUserBtn) {

            addUserBtn.style.display =
                "none";
        }


        loadMasjids();

        loadAllUsers();

        return;
    }


    // =================================================
    // ADMIN
    // =================================================

    if (user.role === "admin") {

        if (superadminMasjidSection) {

            superadminMasjidSection.style.display =
                "none";
        }


        if (masjidInformationSection) {

            masjidInformationSection.style.display =
                "block";
        }


        if (userManagementSection) {

            userManagementSection.style.display =
                "block";
        }


        // Admin CAN create staff
        if (addUserBtn) {

            addUserBtn.style.display =
                "inline-block";
        }


        loadOwnMasjidUsers();

        return;
    }


    // =================================================
    // STAFF
    // =================================================

    if (user.role === "staff") {

        if (superadminMasjidSection) {

            superadminMasjidSection.style.display =
                "none";
        }


        if (masjidInformationSection) {

            masjidInformationSection.style.display =
                "block";
        }


        // Staff cannot manage users
        if (userManagementSection) {

            userManagementSection.style.display =
                "none";
        }
    }
}


// =====================================================
// LOAD ALL MASJIDS
// =====================================================

async function loadMasjids() {

    if (!masjidTableBody) {
        return;
    }


    try {

        masjidTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center text-secondary"
                >
                    Loading Masjids...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                MASJID_API,
                {
                    headers: authHeaders()
                }
            );


        if (handleAuthError(response)) {
            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Could not load Masjids"
            );
        }


        const masjids =
            Array.isArray(result)
                ? result
                : result.masjids || [];


        renderMasjids(masjids);


    } catch (error) {

        console.error(
            "Load Masjids error:",
            error
        );


        masjidTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center text-danger"
                >
                    Could not load Masjids.
                </td>
            </tr>
        `;


        Swal.fire({
            icon: "error",
            title: "Error",
            text:
                error.message ||
                "Could not load Masjids."
        });
    }
}


// =====================================================
// RENDER MASJIDS
// =====================================================

function renderMasjids(masjids) {

    if (!masjidTableBody) {
        return;
    }


    if (!masjids.length) {

        masjidTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center text-secondary"
                >
                    No Masjids found.
                </td>
            </tr>
        `;

        return;
    }


    masjidTableBody.innerHTML =
        masjids.map(masjid => {

            const id =
                masjid._id ||
                masjid.id;


            const name =
                masjid.name ||
                "Unnamed Masjid";


            const phone =
                masjid.phone ||
                "-";


            const email =
                masjid.email ||
                "-";


            const isActive =
                masjid.isActive !== false;


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(name)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(phone)}
                    </td>

                    <td>
                        ${escapeHtml(email)}
                    </td>

                    <td>

                        ${
                            isActive
                                ? `
                                    <span class="badge bg-success">
                                        Active
                                    </span>
                                  `
                                : `
                                    <span class="badge bg-secondary">
                                        Inactive
                                    </span>
                                  `
                        }

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-sm btn-brand"
                            onclick="openAdminModal(
                                '${escapeAttribute(id)}',
                                '${escapeAttribute(name)}'
                            )"
                        >

                            <i class="fa-solid fa-user-plus"></i>

                            Create Admin

                        </button>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            onclick="viewMasjidUsers(
                                '${escapeAttribute(id)}',
                                '${escapeAttribute(name)}'
                            )"
                        >

                            <i class="fa-solid fa-users"></i>

                            View Users

                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}


// =====================================================
// VIEW USERS OF SELECTED MASJID
// =====================================================

async function viewMasjidUsers(
    masjidId,
    masjidName
) {

    if (!userManagementSection) {
        return;
    }


    userManagementSection.style.display =
        "block";


    const title =
        document.getElementById(
            "userManagementTitle"
        );


    if (title) {

        title.textContent =
            `${masjidName} - Users`;
    }


    try {

        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-secondary"
                >
                    Loading users...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                `${USERS_API}?masjidId=${encodeURIComponent(
                    masjidId
                )}`,
                {
                    headers: authHeaders()
                }
            );


        if (handleAuthError(response)) {
            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Could not load users."
            );
        }


        const users =
            Array.isArray(result)
                ? result
                : result.users || [];


        renderUsers(
            users,
            true
        );


    } catch (error) {

        console.error(
            "View masjid users error:",
            error
        );


        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-danger"
                >
                    Could not load users.
                </td>
            </tr>
        `;
    }
}


// =====================================================
// LOAD ALL USERS
// =====================================================

async function loadAllUsers() {

    if (!userTableBody) {
        return;
    }


    try {

        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-secondary"
                >
                    Loading users...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                USERS_API,
                {
                    headers: authHeaders()
                }
            );


        if (handleAuthError(response)) {
            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Could not load users."
            );
        }


        const users =
            Array.isArray(result)
                ? result
                : result.users || [];


        renderUsers(
            users,
            true
        );


    } catch (error) {

        console.error(
            "Load all users error:",
            error
        );


        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-danger"
                >
                    Could not load users.
                </td>
            </tr>
        `;
    }
}


// =====================================================
// LOAD OWN MASJID USERS
// =====================================================

async function loadOwnMasjidUsers() {

    const user =
        getLoggedInUser();


    if (!user || !user.masjidId) {
        return;
    }


    if (!userTableBody) {
        return;
    }


    try {

        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-secondary"
                >
                    Loading users...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                USERS_API,
                {
                    headers: authHeaders()
                }
            );


        if (handleAuthError(response)) {
            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Could not load users."
            );
        }


        const users =
            Array.isArray(result)
                ? result
                : result.users || [];


        renderUsers(
            users,
            false
        );


    } catch (error) {

        console.error(
            "Load own masjid users error:",
            error
        );


        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-danger"
                >
                    Could not load users.
                </td>
            </tr>
        `;
    }
}


// =====================================================
// RENDER USERS
// =====================================================

function renderUsers(
    users,
    isSuperadmin
) {

    if (!userTableBody) {
        return;
    }


    if (!users.length) {

        userTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-secondary"
                >
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    userTableBody.innerHTML =
        users.map(user => {

            const id =
                user._id ||
                user.id;


            const masjidName =
                user.masjidId &&
                typeof user.masjidId === "object"
                    ? user.masjidId.name
                    : "-";


            return `
                <tr>

                    <td>
                        ${escapeHtml(
                            user.name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            user.email || "-"
                        )}
                    </td>

                    <td>

                        <span class="badge ${
                            user.role === "superadmin"
                                ? "bg-danger"
                                : user.role === "admin"
                                    ? "bg-primary"
                                    : "bg-secondary"
                        }">

                            ${escapeHtml(
                                user.role || "-"
                            )}

                        </span>

                    </td>

                    ${
                        isSuperadmin
                            ? `
                                <td>
                                    ${escapeHtml(
                                        masjidName
                                    )}
                                </td>
                              `
                            : ""
                    }

                    <td>

                        ${
                            user.role !== "superadmin"
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger"
                                        onclick="deleteUser(
                                            '${escapeAttribute(id)}'
                                        )"
                                    >
                                        <i class="fa-solid fa-trash"></i>
                                        Delete
                                    </button>
                                  `
                                : ""
                        }

                    </td>

                </tr>
            `;

        }).join("");
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


// =====================================================
// OPEN CREATE MASJID MODAL
// =====================================================

if (addMasjidBtn) {

    addMasjidBtn.addEventListener(
        "click",
        function () {

            if (masjidForm) {
                masjidForm.reset();
            }


            if (masjidModal) {
                masjidModal.show();
            }
        }
    );
}


// =====================================================
// CREATE MASJID
// =====================================================

if (masjidForm) {

    masjidForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const name =
                document.getElementById(
                    "newMasjidName"
                ).value.trim();


            const address =
                document.getElementById(
                    "newMasjidAddress"
                ).value.trim();


            const phone =
                document.getElementById(
                    "newMasjidPhone"
                ).value.trim();


            const email =
                document.getElementById(
                    "newMasjidEmail"
                ).value.trim();


            if (!name) {

                Swal.fire({
                    icon: "warning",
                    title: "Missing Information",
                    text:
                        "Please enter Masjid name."
                });

                return;
            }


            try {

                const response =
                    await fetch(
                        MASJID_API,
                        {
                            method: "POST",
                            headers: authHeaders(),
                            body: JSON.stringify({
                                name,
                                address,
                                phone,
                                email
                            })
                        }
                    );


                if (handleAuthError(response)) {
                    return;
                }


                const result =
                    await response.json()
                        .catch(() => ({}));


                if (!response.ok) {

                    Swal.fire({
                        icon: "error",
                        title: "Could Not Create Masjid",
                        text:
                            result.message ||
                            "Something went wrong."
                    });

                    return;
                }


                if (masjidModal) {
                    masjidModal.hide();
                }


                masjidForm.reset();


                await loadMasjids();


                const createdMasjid =
                    result.masjid ||
                    result.data;


                if (createdMasjid) {

                    const createdId =
                        createdMasjid._id ||
                        createdMasjid.id;


                    const createdName =
                        createdMasjid.name ||
                        name;


                    Swal.fire({
                        icon: "success",
                        title: "Masjid Created",
                        text:
                            "Masjid has been created successfully.",
                        showCancelButton: true,
                        confirmButtonText:
                            "Create Admin",
                        cancelButtonText:
                            "Later"
                    }).then(
                        swalResult => {

                            if (
                                swalResult.isConfirmed
                            ) {

                                openAdminModal(
                                    createdId,
                                    createdName
                                );
                            }
                        }
                    );

                } else {

                    Swal.fire({
                        icon: "success",
                        title: "Masjid Created",
                        text:
                            "Masjid has been created successfully."
                    });
                }


            } catch (error) {

                console.error(
                    "Create Masjid error:",
                    error
                );

                Swal.fire({
                    icon: "error",
                    title: "Connection Error",
                    text:
                        "Could not reach the server."
                });
            }
        }
    );
}


// =====================================================
// OPEN CREATE ADMIN MODAL
// =====================================================

function openAdminModal(
    masjidId,
    masjidName
) {

    const selectedMasjidId =
        document.getElementById(
            "selectedMasjidId"
        );


    const selectedMasjidName =
        document.getElementById(
            "selectedMasjidName"
        );


    if (!adminModal) {
        return;
    }


    if (adminForm) {
        adminForm.reset();
    }


    if (selectedMasjidId) {
        selectedMasjidId.value =
            masjidId;
    }


    if (selectedMasjidName) {
        selectedMasjidName.textContent =
            masjidName;
    }


    adminModal.show();
}


// =====================================================
// CREATE ADMIN
// =====================================================

if (adminForm) {

    adminForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const masjidId =
                document.getElementById(
                    "selectedMasjidId"
                ).value;


            const name =
                document.getElementById(
                    "adminName"
                ).value.trim();


            const email =
                document.getElementById(
                    "adminEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "adminPassword"
                ).value;


            if (
                !masjidId ||
                !name ||
                !email ||
                !password
            ) {

                Swal.fire({
                    icon: "warning",
                    title: "Missing Information",
                    text:
                        "Please fill all Admin fields."
                });

                return;
            }


            if (password.length < 6) {

                Swal.fire({
                    icon: "warning",
                    title: "Weak Password",
                    text:
                        "Password must be at least 6 characters."
                });

                return;
            }


            try {

                const response =
                    await fetch(
                        USERS_API,
                        {
                            method: "POST",
                            headers: authHeaders(),
                            body: JSON.stringify({

                                name,

                                email,

                                password,

                                role: "admin",

                                masjidId
                            })
                        }
                    );


                if (handleAuthError(response)) {
                    return;
                }


                const result =
                    await response.json()
                        .catch(() => ({}));


                if (!response.ok) {

                    Swal.fire({
                        icon: "error",
                        title: "Could Not Create Admin",
                        text:
                            result.message ||
                            "Something went wrong."
                    });

                    return;
                }


                if (adminModal) {
                    adminModal.hide();
                }


                adminForm.reset();


                Swal.fire({
                    icon: "success",
                    title: "Admin Created",
                    text:
                        "Admin account has been created successfully."
                });


                await loadMasjids();


                // Refresh user list if visible
                if (
                    userManagementSection &&
                    userManagementSection.style.display !== "none"
                ) {

                    await loadAllUsers();
                }


            } catch (error) {

                console.error(
                    "Create Admin error:",
                    error
                );

                Swal.fire({
                    icon: "error",
                    title: "Connection Error",
                    text:
                        "Could not reach the server."
                });
            }
        }
    );
}


// =====================================================
// OPEN CREATE STAFF USER MODAL
// =====================================================

if (addUserBtn) {

    addUserBtn.addEventListener(
        "click",
        function () {

            const user =
                getLoggedInUser();


            if (!user) {
                return;
            }


            // Only Admin can create staff
            if (user.role !== "admin") {

                Swal.fire({
                    icon: "info",
                    title: "Not Available",
                    text:
                        "Only masjid Admin can create staff users."
                });

                return;
            }


            if (userForm) {
                userForm.reset();
            }


            const userRole =
                document.getElementById(
                    "newUserRole"
                );


            if (userRole) {
                userRole.value = "staff";
            }


            const userMasjidId =
                document.getElementById(
                    "newUserMasjidId"
                );


            if (userMasjidId) {
                userMasjidId.value =
                    user.masjidId;
            }


            if (userModal) {
                userModal.show();
            }
        }
    );
}


// =====================================================
// CREATE STAFF USER
// =====================================================

if (userForm) {

    userForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const user =
                getLoggedInUser();


            if (
                !user ||
                user.role !== "admin"
            ) {

                Swal.fire({
                    icon: "error",
                    title: "Access Denied",
                    text:
                        "Only Admin can create staff users."
                });

                return;
            }


            const name =
                document.getElementById(
                    "newUserName"
                ).value.trim();


            const email =
                document.getElementById(
                    "newUserEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "newUserPassword"
                ).value;


            if (
                !name ||
                !email ||
                !password
            ) {

                Swal.fire({
                    icon: "warning",
                    title: "Missing Information",
                    text:
                        "Please fill all fields."
                });

                return;
            }


            if (password.length < 6) {

                Swal.fire({
                    icon: "warning",
                    title: "Weak Password",
                    text:
                        "Password must be at least 6 characters."
                });

                return;
            }


            try {

                const response =
                    await fetch(
                        USERS_API,
                        {
                            method: "POST",
                            headers: authHeaders(),
                            body: JSON.stringify({

                                name,

                                email,

                                password,

                                role: "staff",

                                masjidId:
                                    user.masjidId
                            })
                        }
                    );


                if (handleAuthError(response)) {
                    return;
                }


                const result =
                    await response.json()
                        .catch(() => ({}));


                if (!response.ok) {

                    Swal.fire({
                        icon: "error",
                        title: "Could Not Create User",
                        text:
                            result.message ||
                            "Something went wrong."
                    });

                    return;
                }


                if (userModal) {
                    userModal.hide();
                }


                userForm.reset();


                Swal.fire({
                    icon: "success",
                    title: "User Created",
                    text:
                        "Staff user has been created successfully."
                });


                await loadOwnMasjidUsers();


            } catch (error) {

                console.error(
                    "Create User error:",
                    error
                );


                Swal.fire({
                    icon: "error",
                    title: "Connection Error",
                    text:
                        "Could not reach the server."
                });
            }
        }
    );
}


// =====================================================
// DELETE USER
// =====================================================

async function deleteUser(userId) {

    const user =
        getLoggedInUser();


    if (!user) {
        return;
    }


    if (
        user.role !== "admin" &&
        user.role !== "superadmin"
    ) {

        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text:
                "You do not have permission to delete users."
        });

        return;
    }


    const confirmation =
        await Swal.fire({

            icon: "warning",

            title: "Delete User?",

            text:
                "This user account will be permanently deleted.",

            showCancelButton: true,

            confirmButtonText:
                "Yes, Delete",

            cancelButtonText:
                "Cancel"
        });


    if (!confirmation.isConfirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${USERS_API}/${encodeURIComponent(
                    userId
                )}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );


        if (handleAuthError(response)) {
            return;
        }


        const result =
            await response.json()
                .catch(() => ({}));


        if (!response.ok) {

            Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text:
                    result.message ||
                    "Could not delete user."
            });

            return;
        }


        Swal.fire({
            icon: "success",
            title: "Deleted",
            text:
                "User deleted successfully."
        });


        if (user.role === "superadmin") {

            await loadAllUsers();

        } else {

            await loadOwnMasjidUsers();
        }


    } catch (error) {

        console.error(
            "Delete user error:",
            error
        );


        Swal.fire({
            icon: "error",
            title: "Connection Error",
            text:
                "Could not reach the server."
        });
    }
}


// =====================================================
// INITIALIZE PAGE
// =====================================================

setupRoleBasedSections();

loadSettings();