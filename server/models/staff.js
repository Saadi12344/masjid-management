const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
    staffId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    cnic: {
        type: String
    },
    phone: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);