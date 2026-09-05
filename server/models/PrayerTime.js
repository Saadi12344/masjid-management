const mongoose = require("mongoose");

const prayerTimeSchema = new mongoose.Schema({

    masjidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Masjid",
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true
    },

    azan: {
        type: String,
        required: true
    },

    jamaat: {
        type: String,
        required: true
    }

}, { timestamps: true });


// Same prayer name allowed in different masjids
// But duplicate Fajr in the same masjid is not allowed
prayerTimeSchema.index(
    { masjidId: 1, name: 1 },
    { unique: true }
);

module.exports = mongoose.model("PrayerTime", prayerTimeSchema);