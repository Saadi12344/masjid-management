const express = require("express");
const Settings = require("../models/Settings");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Get settings (create default doc on first run)
router.get("/", async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        res.json(settings);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Update settings
router.put("/", async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
        }

        res.json(settings);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
