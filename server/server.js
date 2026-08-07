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

const app = express();

console.log("MONGO_URI is set:", !!process.env.MONGO_URI);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/prayer", prayerRoutes);
app.use("/api/settings", settingsRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});