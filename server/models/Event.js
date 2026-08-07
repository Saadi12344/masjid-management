const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true
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
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);