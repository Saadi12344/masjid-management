const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    studentName: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    studentClass: {
        type: String,
        required: true
    },
    fee: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
