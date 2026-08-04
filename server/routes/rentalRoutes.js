const express = require("express");
const Rental = require("../models/Rental");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
    try {
        const rentals = await Rental.find().sort({ createdAt: -1 });
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { type, tenantName, property, amount, phone, startDate, status } = req.body;

        if (!tenantName || !property || !amount || !phone || !startDate) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await Rental.countDocuments();
        const rentalId = "RNT-" + String(count + 1).padStart(4, "0");

        const rental = await Rental.create({ rentalId, type, tenantName, property, amount, phone, startDate, status });
        res.status(201).json(rental);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const rental = await Rental.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!rental) {
            return res.status(404).json({ message: "Rental not found" });
        }

        res.json(rental);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const rental = await Rental.findByIdAndDelete(req.params.id);

        if (!rental) {
            return res.status(404).json({ message: "Rental not found" });
        }

        res.json({ message: "Rental deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
