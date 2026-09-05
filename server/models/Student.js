const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        masjidId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Masjid",
            required: true,
            index: true
        },

        studentId: {
            type: String,
            required: true
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
    },
    { timestamps: true }
);

// Student ID unique within each masjid
studentSchema.index(
    { masjidId: 1, studentId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Student", studentSchema);