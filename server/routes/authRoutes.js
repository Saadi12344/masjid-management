const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Masjid = require("../models/Masjid");
const protect = require("../middleware/auth");

const router = express.Router();


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
    try {
        const { email, password, masjidId } = req.body;

        // -------------------------------------------------
        // Basic validation
        // -------------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // -------------------------------------------------
        // Find all users with this email
        //
        // Same email can exist in different masjids.
        // Populate masjid so frontend can receive its name.
        // -------------------------------------------------

        const users = await User.find({
            email: normalizedEmail
        }).populate("masjidId", "name");


        if (!users || users.length === 0) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        // -------------------------------------------------
        // Verify password
        // -------------------------------------------------

        const matchingUsers = [];

        for (const user of users) {

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (passwordMatch) {
                matchingUsers.push(user);
            }
        }


        if (matchingUsers.length === 0) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        // =================================================
        // SUPERADMIN
        // =================================================

        const superadmins = matchingUsers.filter(
            user => user.role === "superadmin"
        );


        if (superadmins.length > 0) {

            // There should normally be only one superadmin
            const user = superadmins[0];


            const token = jwt.sign(
                {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    masjidId: null
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }
            );


            return res.json({
                message: "Login successful",

                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    masjidId: null
                }
            });
        }


        // =================================================
        // NORMAL USER / ADMIN
        // =================================================

        // Non-superadmin must have a masjid
        const validUsers = matchingUsers.filter(
            user => user.masjidId
        );


        if (validUsers.length === 0) {
            return res.status(403).json({
                message:
                    "Your account is not linked to a masjid. Please contact the administrator."
            });
        }


        // =================================================
        // MASJID WAS PROVIDED
        // =================================================

        if (masjidId) {

            // Validate MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(masjidId)) {
                return res.status(400).json({
                    message: "Invalid masjid"
                });
            }


            // Find account belonging to selected masjid
            const user = validUsers.find(
                user =>
                    user.masjidId._id.toString() ===
                    masjidId.toString()
            );


            if (!user) {
                return res.status(400).json({
                    message: "Invalid email, password or masjid"
                });
            }


            // -------------------------------------------------
            // Generate JWT
            // -------------------------------------------------

            const token = jwt.sign(
                {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,

                    // IMPORTANT:
                    // JWT stores only the Masjid ObjectId
                    masjidId: user.masjidId._id.toString()
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }
            );


            return res.json({
                message: "Login successful",

                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,

                    // ObjectId sent to frontend
                    masjidId: user.masjidId._id,

                    // Useful for dashboard/header
                    masjidName: user.masjidId.name
                }
            });
        }


        // =================================================
        // ONLY ONE MASJID ACCOUNT
        // =================================================

        if (validUsers.length === 1) {

            const user = validUsers[0];


            const token = jwt.sign(
                {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,

                    masjidId: user.masjidId._id.toString()
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }
            );


            return res.json({
                message: "Login successful",

                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    masjidId: user.masjidId._id,
                    masjidName: user.masjidId.name
                }
            });
        }


        // =================================================
        // SAME EMAIL + PASSWORD IN MULTIPLE MASJIDS
        // =================================================

        // Password has already been verified.
        // Return only the masjid choices.
        //
        // Do NOT return user IDs, roles or passwords here.

        return res.json({
            requiresMasjidSelection: true,

            masjids: validUsers.map(user => ({
                _id: user.masjidId._id,
                name: user.masjidId.name
            }))
        });

    } catch (err) {

        console.error("Login error:", err);

        return res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// CHANGE OWN PASSWORD
// =====================================================

router.put("/change-password", protect, async (req, res) => {
    try {

        const {
            currentPassword,
            newPassword
        } = req.body;


        // -------------------------------------------------
        // Validation
        // -------------------------------------------------

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Please fill both password fields"
            });
        }


        if (newPassword.length < 6) {
            return res.status(400).json({
                message:
                    "New password must be at least 6 characters"
            });
        }


        // -------------------------------------------------
        // Get current user from database
        // -------------------------------------------------

        const user = await User.findById(req.user.id);


        if (!user) {
            return res.status(404).json({
                message: "Account not found"
            });
        }


        // -------------------------------------------------
        // Verify current password
        // -------------------------------------------------

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );


        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }


        // -------------------------------------------------
        // Prevent same password
        // -------------------------------------------------

        const samePassword = await bcrypt.compare(
            newPassword,
            user.password
        );


        if (samePassword) {
            return res.status(400).json({
                message:
                    "New password must be different from current password"
            });
        }


        // -------------------------------------------------
        // Hash new password
        // -------------------------------------------------

        user.password = await bcrypt.hash(
            newPassword,
            10
        );


        await user.save();


        return res.json({
            message: "Password updated successfully"
        });

    } catch (err) {

        console.error(
            "Change password error:",
            err
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;