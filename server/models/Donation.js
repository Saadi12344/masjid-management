const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    masjidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Masjid",
      required: true,
      index: true
    },

    donationId: {
      type: String,
      required: true
    },

    donorName: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    purpose: {
      type: String,
      default: "General"
    },

    date: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "Pending"
    }
  },
  { timestamps: true }
);

// Same donationId can exist in different masjids,
// but cannot be duplicated within the same masjid.
donationSchema.index(
  { masjidId: 1, donationId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Donation", donationSchema);