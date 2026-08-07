const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    masjidName: {
        type: String,
        default: "Jama Masjid As-Salam"
    },
    imamName: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
