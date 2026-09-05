const express = require("express");
const Staff = require("../models/Staff");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// All staff routes require login
router.use(protect);


// ==========================
// Get all staff
// Super Admin = all masjids
// Admin/Staff = current masjid only
// ==========================
router.get("/", async (req, res) => {
    try {

        let staff;

        if (req.user.role === "superadmin") {

            staff = await Staff.find()
                .sort({ createdAt: -1 });

        } else {

            staff = await Staff.find({
                masjidId: req.user.masjidId
            }).sort({ createdAt: -1 });

        }

        res.json(staff);

    } catch (err) {
        console.error("Get staff error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


// ==========================
// Add new staff
// Only Admin / Super Admin
// ==========================
router.post("/", adminOnly, async (req, res) => {
    try {

        const {
            name,
            designation,
            salary,
            cnic,
            phone,
            city
        } = req.body;

        if (!name || !designation || !salary || !phone || !city) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }


        // Super Admin must provide masjidId
        // Admin automatically uses own masjid
        const masjidId =
            req.user.role === "superadmin"
                ? req.body.masjidId
                : req.user.masjidId;


        if (!masjidId) {
            return res.status(400).json({
                message: "Masjid ID is required"
            });
        }


        // Count staff only for selected masjid
        const count = await Staff.countDocuments({
            masjidId
        });

        const staffId =
            "STF-" + String(count + 1).padStart(4, "0");


        const staff = await Staff.create({
            staffId,
            name,
            designation,
            salary,
            cnic,
            phone,
            city,
            masjidId
        });


        res.status(201).json(staff);

    } catch (err) {
        console.error("Add staff error:", err);

        if (err.code === 11000) {
            return res.status(400).json({
                message: "Staff ID already exists. Please try again."
            });
        }

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


// ==========================
// Update staff
// Only Admin / Super Admin
// ==========================
router.put("/:id", adminOnly, async (req, res) => {
    try {

        const {
            name,
            designation,
            salary,
            cnic,
            phone,
            city
        } = req.body;


        let filter;

        if (req.user.role === "superadmin") {

            // Super Admin can update staff from any masjid
            filter = {
                _id: req.params.id
            };

        } else {

            // Admin can update only own masjid's staff
            filter = {
                _id: req.params.id,
                masjidId: req.user.masjidId
            };

        }


        const staff = await Staff.findOneAndUpdate(
            filter,
            {
                name,
                designation,
                salary,
                cnic,
                phone,
                city
            },
            {
                new: true,
                runValidators: true
            }
        );


        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }


        res.json(staff);

    } catch (err) {
        console.error("Update staff error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


// ==========================
// Delete staff
// Only Admin / Super Admin
// ==========================
router.delete("/:id", adminOnly, async (req, res) => {
    try {

        let filter;

        if (req.user.role === "superadmin") {

            // Super Admin can delete staff from any masjid
            filter = {
                _id: req.params.id
            };

        } else {

            // Admin can delete only own masjid's staff
            filter = {
                _id: req.params.id,
                masjidId: req.user.masjidId
            };

        }


        const staff = await Staff.findOneAndDelete(filter);


        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }


        res.json({
            message: "Staff deleted successfully"
        });

    } catch (err) {
        console.error("Delete staff error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


module.exports = router;