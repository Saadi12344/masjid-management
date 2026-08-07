const mongoose = require("mongoose");

const prayerTimeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    azan: {
        type: String,
        required: true
    },
    jamaat: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("PrayerTime", prayerTimeSchema);