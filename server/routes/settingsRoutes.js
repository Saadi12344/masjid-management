const express = require("express");
const Settings = require("../models/Settings");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);


// ==========================
// Get settings
// Super Admin = can view any masjid
// Admin/Staff = current masjid
// ==========================
router.get("/", async (req, res) => {
    try {

        const masjidId = req.query.masjidId;

        let settings;

        if (req.user.role === "superadmin") {

            // Super Admin can request a specific masjid
            if (!masjidId) {
                return res.status(400).json({
                    message: "Masjid ID is required"
                });
            }

            settings = await Settings.findOne({
                masjidId
            });

        } else {

            settings = await Settings.findOne({
                masjidId: req.user.masjidId
            });

        }


        if (!settings) {
            return res.status(404).json({
                message: "Settings not found"
            });
        }


        res.json(settings);

    } catch (err) {
        console.error("Get settings error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


// ==========================
// Update settings
// Only Admin / Super Admin
// ==========================
router.put("/", adminOnly, async (req, res) => {
    try {

        const {
            masjidId,
            masjidName,
            imamName,
            address,
            phone,
            email
        } = req.body;


        let targetMasjidId;


        if (req.user.role === "superadmin") {

            // Super Admin must specify masjid
            targetMasjidId = masjidId;

        } else {

            // Admin can only update own masjid
            targetMasjidId = req.user.masjidId;

        }


        if (!targetMasjidId) {
            return res.status(400).json({
                message: "Masjid ID is required"
            });
        }


        let settings = await Settings.findOne({
            masjidId: targetMasjidId
        });


        if (!settings) {

            settings = await Settings.create({
                masjidId: targetMasjidId,
                masjidName,
                imamName,
                address,
                phone,
                email
            });

        } else {

            settings = await Settings.findOneAndUpdate(
                {
                    masjidId: targetMasjidId
                },
                {
                    masjidName,
                    imamName,
                    address,
                    phone,
                    email
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        }


        res.json(settings);

    } catch (err) {
        console.error("Update settings error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


module.exports = router;