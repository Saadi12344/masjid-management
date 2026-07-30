const express = require("express");
const Staff = require("../models/Staff");
const protect = require("../middleware/auth");

const router = express.Router();

// All staff routes require login
router.use(protect);

router.get("/", async (req, res) => {
    try {
        const staff = await Staff.find().sort({ createdAt: -1 });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, designation, salary, cnic, phone, city } = req.body;

        if (!name || !designation || !salary || !phone || !city) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await Staff.countDocuments();
        const staffId = "STF-" + String(count + 1).padStart(4, "0");

        const staff = await Staff.create({ staffId, name, designation, salary, cnic, phone, city });
        res.status(201).json(staff);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        res.json(staff);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        res.json({ message: "Staff deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;