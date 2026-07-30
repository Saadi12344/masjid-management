const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
    rentalId: {
        type: String,
        required: true,
        unique: true
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
}, { timestamps: true });

module.exports = mongoose.model("Rental", rentalSchema);