require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const staffRoutes = require("./routes/staffRoutes");
const donationRoutes = require("./routes/donationRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const rentalRoutes = require("./routes/rentalRoutes");
const studentRoutes = require("./routes/studentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const prayerRoutes = require("./routes/prayerRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const userRoutes = require("./routes/userRoutes");
const feePaymentRoutes = require("./routes/feePaymentRoutes");
const masjidRoutes = require("./routes/masjidRoutes");

const app = express();

console.log("MONGO_URI is set:", !!process.env.MONGO_URI);


// =====================================================
// CONNECT TO MONGODB
// =====================================================

connectDB();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());


// Disable caching for all API responses — data changes frequently,
// browser should never serve a stale cached copy (fixes 304 issue).
app.set("etag", false);
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use(express.json());
app.use(express.json());


// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/staff", staffRoutes);

app.use("/api/donations", donationRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/rentals", rentalRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/prayer", prayerRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/users", userRoutes);

app.use("/api/fee-payments", feePaymentRoutes);

// Superadmin → Masjid Management
app.use("/api/masjids", masjidRoutes);


// =====================================================
// SERVE FRONTEND
// =====================================================

app.use(express.static(path.join(__dirname, "../frontend")));


// =====================================================
// HOME / LOGIN PAGE
// =====================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});