const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// ==========================
// List all accounts (never send password)
// ==========================
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================
// Create a new account (admin creates login for staff)
// ==========================
router.post("/", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account already exists with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role === "admin" ? "admin" : "staff"
        });

        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================
// Delete an account
// ==========================
router.delete("/:id", async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "Account not found" });
        }

        res.json({ message: "Account deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
