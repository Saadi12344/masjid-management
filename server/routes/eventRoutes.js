const express = require("express");
const Event = require("../models/Event");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { eventName, date, time, venue, description } = req.body;

        if (!eventName || !date || !time || !venue) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await Event.countDocuments();
        const eventId = "EVT-" + String(count + 1).padStart(4, "0");

        const event = await Event.create({ eventId, eventName, date, time, venue, description });
        res.status(201).json(event);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json({ message: "Event deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
