const express = require("express");
const FeePayment = require("../models/FeePayment");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);


// ==========================
// Get all fee payments
// Super Admin = all masjids
// Admin/Staff = current masjid only
// ==========================
router.get("/", async (req, res) => {
    try {

        let payments;

        if (req.user.role === "superadmin") {

            payments = await FeePayment.find()
                .sort({ createdAt: -1 });

        } else {

            payments = await FeePayment.find({
                masjidId: req.user.masjidId
            }).sort({ createdAt: -1 });

        }

        res.json(payments);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


// ==========================
// Record a new fee payment
// Admin / Staff / Super Admin
// ==========================
router.post("/", async (req, res) => {
    try {

        const {
            studentId,
            studentName,
            amount,
            month,
            date
        } = req.body;


        if (
            !studentId ||
            !studentName ||
            amount === undefined ||
            !month ||
            !date
        ) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }


        // Super Admin must provide masjidId
        // Admin/Staff automatically use their own masjid
        const masjidId =
            req.user.role === "superadmin"
                ? req.body.masjidId
                : req.user.masjidId;


        if (!masjidId) {
            return res.status(400).json({
                message: "Masjid ID is required"
            });
        }


        // Count payments only for selected masjid
        const count = await FeePayment.countDocuments({
            masjidId
        });


        const paymentId =
            "FEE-" + String(count + 1).padStart(4, "0");


        const payment = await FeePayment.create({
            paymentId,
            masjidId,
            studentId,
            studentName,
            amount,
            month,
            date
        });


        res.status(201).json(payment);

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


// ==========================
// Delete fee payment
// Only Admin / Super Admin
// ==========================
router.delete("/:id", adminOnly, async (req, res) => {
    try {

        let filter;

        if (req.user.role === "superadmin") {

            // Super Admin can delete from any masjid
            filter = {
                _id: req.params.id
            };

        } else {

            // Admin can delete only own masjid's payment
            filter = {
                _id: req.params.id,
                masjidId: req.user.masjidId
            };

        }


        const payment = await FeePayment.findOneAndDelete(filter);


        if (!payment) {
            return res.status(404).json({
                message: "Payment record not found"
            });
        }


        res.json({
            message: "Payment record deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
});


module.exports = router;