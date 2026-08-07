const express = require("express");
const PrayerTime = require("../models/Prayers");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

const DEFAULT_TIMES = [
    { name: "Fajr", azan: "05:00", jamaat: "05:20" },
    { name: "Zuhr", azan: "13:15", jamaat: "13:35" },
    { name: "Asr", azan: "16:45", jamaat: "17:05" },
    { name: "Maghrib", azan: "18:50", jamaat: "18:55" },
    { name: "Isha", azan: "20:15", jamaat: "20:35" },
    { name: "Jumma", azan: "13:15", jamaat: "13:45" }
];

router.get("/", async (req, res) => {
    try {
        const count = await PrayerTime.countDocuments();

        if (count === 0) {
            await PrayerTime.insertMany(DEFAULT_TIMES);
        }

        const times = await PrayerTime.find();
        res.json(times);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:name", async (req, res) => {
    try {
        const { azan, jamaat } = req.body;

        if (!azan || !jamaat) {
            return res.status(400).json({ message: "Please set both azan and jamaat time" });
        }

        const time = await PrayerTime.findOneAndUpdate(
            { name: req.params.name },
            { azan, jamaat },
            { new: true }
        );

        if (!time) {
            return res.status(404).json({ message: "Prayer not found" });
        }

        res.json(time);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;