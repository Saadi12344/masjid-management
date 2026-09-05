const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        masjidId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Masjid",
            required: true,
            index: true
        },

        expenseId: {
            type: String,
            required: true
        },

        title: {
            type: String,
            required: true
        },

        category: {
            type: String,
            default: "Other"
        },

        amount: {
            type: Number,
            required: true
        },

        date: {
            type: String,
            required: true
        },

        description: {
            type: String
        }
    },
    { timestamps: true }
);

// Expense ID unique within each masjid
expenseSchema.index(
    { masjidId: 1, expenseId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Expense", expenseSchema);