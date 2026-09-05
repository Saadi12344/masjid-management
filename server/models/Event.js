const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        masjidId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Masjid",
            required: true,
            index: true
        },

        eventId: {
            type: String,
            required: true
        },

        eventName: {
            type: String,
            required: true
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        venue: {
            type: String,
            required: true
        },

        description: {
            type: String
        }
    },
    { timestamps: true }
);

// Event ID unique within each masjid
eventSchema.index(
    { masjidId: 1, eventId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Event", eventSchema);