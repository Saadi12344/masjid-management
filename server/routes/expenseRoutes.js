const express = require("express");
const Expense = require("../models/Expense");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);

// GET all expenses for logged-in user's masjid
router.get("/", async (req, res) => {
    try {
        const expenses = await Expense.find({
            masjidId: req.user.masjidId
        }).sort({ createdAt: -1 });

        res.json(expenses);
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// CREATE expense
router.post("/", async (req, res) => {
    try {
        const {
            title,
            category,
            amount,
            date,
            description
        } = req.body;

        if (!title || !amount || !date) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Generate ID separately for each masjid
        const count = await Expense.countDocuments({
            masjidId: req.user.masjidId
        });

        const expenseId =
            "EXP-" + String(count + 1).padStart(4, "0");

        const expense = await Expense.create({
            masjidId: req.user.masjidId,
            expenseId,
            title,
            category,
            amount,
            date,
            description
        });

        res.status(201).json(expense);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// UPDATE expense
router.put("/:id", adminOnly, async (req, res) => {
    try {
        // Prevent changing masjidId or expenseId
        const {
            masjidId,
            expenseId,
            ...updateData
        } = req.body;

        const expense = await Expense.findOneAndUpdate(
            {
                _id: req.params.id,
                masjidId: req.user.masjidId
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json(expense);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// DELETE expense
router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            masjidId: req.user.masjidId
        });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }
        res.json({
            message: "Expense deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;