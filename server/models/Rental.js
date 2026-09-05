const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
    {
        masjidId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Masjid",
            required: true,
            index: true
        },

        rentalId: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ["Income", "Expense"],
            default: "Income"
        },

        tenantName: {
            type: String,
            required: true
        },

        property: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        startDate: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: "Active"
        }
    },
    { timestamps: true }
);

// Rental ID unique within each masjid
rentalSchema.index(
    { masjidId: 1, rentalId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Rental", rentalSchema);