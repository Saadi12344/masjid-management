const express = require("express");
const FeePayment = require("../models/FeePayment");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Get all fee payments
router.get("/", async (req, res) => {
    try {
        const payments = await FeePayment.find().sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Record a new fee payment
router.post("/", async (req, res) => {
    try {
        const { studentId, studentName, amount, month, date } = req.body;

        if (!studentId || !studentName || !amount || !month || !date) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await FeePayment.countDocuments();
        const paymentId = "FEE-" + String(count + 1).padStart(4, "0");

        const payment = await FeePayment.create({ paymentId, studentId, studentName, amount, month, date });
        res.status(201).json(payment);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete a fee payment (e.g. entered by mistake)
router.delete("/:id", async (req, res) => {
    try {
        const payment = await FeePayment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        res.json({ message: "Payment record deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
