const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        staffId: {
            type: String,
            required: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        designation: {
            type: String,
            required: true,
            trim: true
        },

        salary: {
            type: Number,
            required: true
        },

        cnic: {
            type: String,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        // Every staff member belongs to one masjid
        masjidId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Masjid",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// staffId only needs to be unique within the same masjid
staffSchema.index(
    { staffId: 1, masjidId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Staff", staffSchema);