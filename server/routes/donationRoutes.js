const express = require("express");
const Donation = require("../models/Donation");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);

// GET all donations for logged-in user's masjid
router.get("/", async (req, res) => {
    try {
        const donations = await Donation.find({
            masjidId: req.user.masjidId
        }).sort({ createdAt: -1 });

        res.json(donations);
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// CREATE donation
router.post("/", async (req, res) => {
    try {
        const {
            donorName,
            amount,
            phone,
            purpose,
            date,
            status
        } = req.body;

        if (!donorName || !amount || !phone || !date) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Generate donation ID separately for each masjid
        const count = await Donation.countDocuments({
            masjidId: req.user.masjidId
        });

        const donationId =
            "DN-" + String(count + 1).padStart(4, "0");

        const donation = await Donation.create({
            masjidId: req.user.masjidId,
            donationId,
            donorName,
            amount,
            phone,
            purpose,
            date,
            status
        });

        res.status(201).json(donation);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// UPDATE donation
router.put("/:id", adminOnly, async (req, res) => {
    try {
        // Do not allow user to change masjidId
        const {
            masjidId,
            donationId,
            ...updateData
        } = req.body;

        const donation = await Donation.findOneAndUpdate(
            {
                _id: req.params.id,
                masjidId: req.user.masjidId
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!donation) {
            return res.status(404).json({
                message: "Donation not found"
            });
        }

        res.json(donation);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// DELETE donation
router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const donation = await Donation.findOneAndDelete({
            _id: req.params.id,
            masjidId: req.user.masjidId
        });

        if (!donation) {
            return res.status(404).json({
                message: "Donation not found"
            });
        }

        res.json({
            message: "Donation deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;