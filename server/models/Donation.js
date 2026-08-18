const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    donationId: {
        type: String,
        required: true,
        unique: true
    },
    donorName: {
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
    purpose: {
        type: String,
        default: "General"
    },
    date: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "Pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Donation", donationSchema);
