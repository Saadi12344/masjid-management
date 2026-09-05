const express = require("express");
const Rental = require("../models/Rental");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);

// GET all rentals for logged-in user's masjid
router.get("/", async (req, res) => {
    try {
        const rentals = await Rental.find({
            masjidId: req.user.masjidId
        }).sort({ createdAt: -1 });

        res.json(rentals);
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// CREATE rental
router.post("/", async (req, res) => {
    try {
        const {
            type,
            tenantName,
            property,
            amount,
            phone,
            startDate,
            status
        } = req.body;

        if (!tenantName || !property || !amount || !phone || !startDate) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Generate rental ID separately for each masjid
        const count = await Rental.countDocuments({
            masjidId: req.user.masjidId
        });

        const rentalId =
            "RNT-" + String(count + 1).padStart(4, "0");

        const rental = await Rental.create({
            masjidId: req.user.masjidId,
            rentalId,
            type,
            tenantName,
            property,
            amount,
            phone,
            startDate,
            status
        });

        res.status(201).json(rental);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// UPDATE rental
router.put("/:id", adminOnly, async (req, res) => {
    try {
        // Prevent changing masjidId or rentalId
        const {
            masjidId,
            rentalId,
            ...updateData
        } = req.body;

        const rental = await Rental.findOneAndUpdate(
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

        if (!rental) {
            return res.status(404).json({
                message: "Rental not found"
            });
        }

        res.json(rental);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// DELETE rental
router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const rental = await Rental.findOneAndDelete({
            _id: req.params.id,
            masjidId: req.user.masjidId
        });

        if (!rental) {
            return res.status(404).json({
                message: "Rental not found"
            });
        }

        res.json({
            message: "Rental deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;