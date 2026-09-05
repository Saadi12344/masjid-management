const express = require("express");
const Event = require("../models/Event");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);

// GET all events for logged-in user's masjid
router.get("/", async (req, res) => {
    try {
        const events = await Event.find({
            masjidId: req.user.masjidId
        }).sort({ date: 1 });

        res.json(events);
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// CREATE event
router.post("/", async (req, res) => {
    try {
        const {
            eventName,
            date,
            time,
            venue,
            description
        } = req.body;

        if (!eventName || !date || !time || !venue) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Generate event ID separately for each masjid
        const count = await Event.countDocuments({
            masjidId: req.user.masjidId
        });

        const eventId =
            "EVT-" + String(count + 1).padStart(4, "0");

        const event = await Event.create({
            masjidId: req.user.masjidId,
            eventId,
            eventName,
            date,
            time,
            venue,
            description
        });

        res.status(201).json(event);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// UPDATE event
router.put("/:id", adminOnly, async (req, res) => {
    try {
        // Prevent changing masjidId or eventId
        const {
            masjidId,
            eventId,
            ...updateData
        } = req.body;

        const event = await Event.findOneAndUpdate(
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

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json(event);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

// DELETE event
router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.id,
            masjidId: req.user.masjidId
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json({
            message: "Event deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;