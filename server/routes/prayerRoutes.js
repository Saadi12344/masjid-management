const express = require("express");
const mongoose = require("mongoose");

const PrayerTime = require("../models/PrayerTime");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);


// =====================================================
// DEFAULT PRAYER TIMES
// =====================================================

const DEFAULT_TIMES = [
    {
        name: "Fajr",
        azan: "05:00",
        jamaat: "05:20"
    },
    {
        name: "Zuhr",
        azan: "13:15",
        jamaat: "13:35"
    },
    {
        name: "Asr",
        azan: "16:45",
        jamaat: "17:05"
    },
    {
        name: "Maghrib",
        azan: "18:50",
        jamaat: "18:55"
    },
    {
        name: "Isha",
        azan: "20:15",
        jamaat: "20:35"
    },
    {
        name: "Jumma",
        azan: "13:15",
        jamaat: "13:45"
    }
];


// =====================================================
// GET PRAYER TIMINGS
// =====================================================
//
// Superadmin:
//     If masjidId query is provided → that masjid
//     If no masjidId → all masjids
//
// Admin/User:
//     Only own masjid
//
// =====================================================

router.get("/", async (req, res) => {
    try {

        let times;


        // =================================================
        // SUPERADMIN
        // =================================================

        if (req.user.role === "superadmin") {

            const { masjidId } = req.query;


            // Superadmin requested a specific masjid
            if (masjidId) {

                if (!mongoose.Types.ObjectId.isValid(masjidId)) {
                    return res.status(400).json({
                        message: "Invalid masjid ID"
                    });
                }


                times = await PrayerTime.find({
                    masjidId
                }).sort({ name: 1 });


                // Create defaults if this masjid
                // has no prayer timings
                if (times.length === 0) {

                    const defaultTimes = DEFAULT_TIMES.map(
                        time => ({
                            ...time,
                            masjidId
                        })
                    );


                    await PrayerTime.insertMany(
                        defaultTimes
                    );


                    times = await PrayerTime.find({
                        masjidId
                    }).sort({ name: 1 });
                }

            }

            // Superadmin requested all masjids
            else {

                times = await PrayerTime.find()
                    .sort({
                        masjidId: 1,
                        name: 1
                    });
            }

        }


        // =================================================
        // NORMAL ADMIN / USER
        // =================================================

        else {

            if (!req.user.masjidId) {
                return res.status(403).json({
                    message: "Account is not linked to a masjid"
                });
            }


            times = await PrayerTime.find({
                masjidId: req.user.masjidId
            }).sort({ name: 1 });


            // Create default timings for this masjid
            if (times.length === 0) {

                const defaultTimes = DEFAULT_TIMES.map(
                    time => ({
                        ...time,
                        masjidId: req.user.masjidId
                    })
                );


                await PrayerTime.insertMany(
                    defaultTimes
                );


                times = await PrayerTime.find({
                    masjidId: req.user.masjidId
                }).sort({ name: 1 });
            }
        }


        res.json(times);

    } catch (err) {

        console.error(
            "Get prayer timings error:",
            err
        );

        // Duplicate index error
        if (err.code === 11000) {
            return res.status(409).json({
                message:
                    "Prayer timings already exist. Please refresh and try again."
            });
        }


        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// UPDATE PRAYER TIMING
// =====================================================
//
// Only Admin / Superadmin
//
// Admin:
//     Can update own masjid only
//
// Superadmin:
//     Must provide masjidId
//
// =====================================================

router.put("/:name", adminOnly, async (req, res) => {
    try {

        const {
            azan,
            jamaat,
            masjidId
        } = req.body;


        if (!azan || !jamaat) {
            return res.status(400).json({
                message:
                    "Please set both azan and jamaat time"
            });
        }


        let filter;


        // =================================================
        // SUPERADMIN
        // =================================================

        if (req.user.role === "superadmin") {

            if (!masjidId) {
                return res.status(400).json({
                    message:
                        "Masjid ID is required for superadmin"
                });
            }


            if (
                !mongoose.Types.ObjectId.isValid(masjidId)
            ) {
                return res.status(400).json({
                    message: "Invalid masjid ID"
                });
            }


            filter = {
                name: req.params.name,
                masjidId
            };

        }


        // =================================================
        // NORMAL ADMIN
        // =================================================

        else {

            filter = {
                name: req.params.name,
                masjidId: req.user.masjidId
            };
        }


        // =================================================
        // UPDATE
        // =================================================

        const time = await PrayerTime.findOneAndUpdate(
            filter,
            {
                azan,
                jamaat
            },
            {
                new: true,
                runValidators: true
            }
        );


        if (!time) {
            return res.status(404).json({
                message: "Prayer not found"
            });
        }


        res.json(time);

    } catch (err) {

        console.error(
            "Update prayer timing error:",
            err
        );


        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;