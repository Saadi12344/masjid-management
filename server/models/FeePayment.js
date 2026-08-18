const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true
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

module.exports = mongoose.model("FeePayment", feePaymentSchema);
