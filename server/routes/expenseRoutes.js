const express = require("express");
const Expense = require("../models/Expense");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ createdAt: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { title, category, amount, date, description } = req.body;

        if (!title || !amount || !date) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await Expense.countDocuments();
        const expenseId = "EXP-" + String(count + 1).padStart(4, "0");

        const expense = await Expense.create({ expenseId, title, category, amount, date, description });
        res.status(201).json(expense);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.json(expense);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.json({ message: "Expense deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;