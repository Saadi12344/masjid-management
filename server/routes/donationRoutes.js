const express = require("express");
const Donation = require("../models/Donation");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
    try {
        const donations = await Donation.find().sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { donorName, amount, phone, purpose, date, status } = req.body;

        if (!donorName || !amount || !phone || !date) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await Donation.countDocuments();
        const donationId = "DN-" + String(count + 1).padStart(4, "0");

        const donation = await Donation.create({ donationId, donorName, amount, phone, purpose, date, status });
        res.status(201).json(donation);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        res.json(donation);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const donation = await Donation.findByIdAndDelete(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        res.json({ message: "Donation deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;