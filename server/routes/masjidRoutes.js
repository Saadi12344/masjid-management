const express = require("express");

const Masjid = require("../models/Masjid");
const protect = require("../middleware/auth");

const router = express.Router();


// =====================================================
// SUPERADMIN ONLY
// =====================================================

router.use(protect);

router.use((req, res, next) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({
            message: "Only superadmin can manage masjids"
        });
    }

    next();
});


// =====================================================
// GET ALL MASJIDS
// =====================================================

router.get("/", async (req, res) => {
    try {

        const masjids = await Masjid.find()
            .sort({ createdAt: -1 });

        res.json(masjids);

    } catch (error) {

        console.error("Get masjids error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// GET SINGLE MASJID
// =====================================================

router.get("/:id", async (req, res) => {
    try {

        const masjid = await Masjid.findById(req.params.id);

        if (!masjid) {
            return res.status(404).json({
                message: "Masjid not found"
            });
        }

        res.json(masjid);

    } catch (error) {

        console.error("Get masjid error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// CREATE MASJID
// =====================================================

router.post("/", async (req, res) => {
    try {

        const {
            name,
            address,
            phone,
            email,
            logo
        } = req.body;


        // Basic validation
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Masjid name is required"
            });
        }


        // Create masjid
        const masjid = await Masjid.create({
            name: name.trim(),
            address: address ? address.trim() : "",
            phone: phone ? phone.trim() : "",
            email: email ? email.toLowerCase().trim() : "",
            logo: logo || "",
            isActive: true
        });


        res.status(201).json({
            message: "Masjid created successfully",

            masjid: {
                id: masjid._id,
                name: masjid.name,
                address: masjid.address,
                phone: masjid.phone,
                email: masjid.email,
                logo: masjid.logo,
                isActive: masjid.isActive
            }
        });

    } catch (error) {

        console.error("Create masjid error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// UPDATE MASJID
// =====================================================

router.put("/:id", async (req, res) => {
    try {

        const {
            name,
            address,
            phone,
            email,
            logo,
            isActive
        } = req.body;


        const masjid = await Masjid.findById(req.params.id);

        if (!masjid) {
            return res.status(404).json({
                message: "Masjid not found"
            });
        }


        if (name !== undefined) {
            masjid.name = name.trim();
        }

        if (address !== undefined) {
            masjid.address = address.trim();
        }

        if (phone !== undefined) {
            masjid.phone = phone.trim();
        }

        if (email !== undefined) {
            masjid.email = email.toLowerCase().trim();
        }

        if (logo !== undefined) {
            masjid.logo = logo;
        }

        if (isActive !== undefined) {
            masjid.isActive = isActive;
        }


        await masjid.save();


        res.json({
            message: "Masjid updated successfully",
            masjid
        });

    } catch (error) {

        console.error("Update masjid error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;