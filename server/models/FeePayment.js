const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema({

    paymentId: {
        type: String,
        required: true
    },

    masjidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Masjid",
        required: true,
        index: true
    },

    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    month: {
        type: String,
        required: true
    },

    date: {
        type: String,
        required: true
    }

}, { timestamps: true });


// Same paymentId can exist in different masjids
feePaymentSchema.index(
    { paymentId: 1, masjidId: 1 },
    { unique: true }
);

module.exports = mongoose.model("FeePayment", feePaymentSchema);