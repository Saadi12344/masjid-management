const express = require("express");

const Student = require("../models/Student");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.use(protect);


// =====================================================
// GET ALL STUDENTS
// =====================================================

router.get("/", async (req, res) => {

    try {

        if (
            req.user.role !== "superadmin" &&
            !req.user.masjidId
        ) {
            return res.status(403).json({
                message:
                    "Account is not linked to a masjid"
            });
        }


        let filter = {};


        // Superadmin can see all students
        if (req.user.role === "superadmin") {

            if (req.query.masjidId) {
                filter.masjidId =
                    req.query.masjidId;
            }

        } else {

            // Normal user/admin
            filter.masjidId =
                req.user.masjidId;
        }


        const students = await Student.find(
            filter
        ).sort({
            createdAt: -1
        });


        res.json(students);

    } catch (err) {

        console.error(
            "Get students error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// CREATE STUDENT
// =====================================================

router.post("/", async (req, res) => {

    try {

        if (!req.user.masjidId) {
            return res.status(403).json({
                message:
                    "Account is not linked to a masjid"
            });
        }


        const {
            studentName,
            fatherName,
            studentClass,
            fee,
            phone,
            address
        } = req.body;


        if (
            !studentName ||
            !fatherName ||
            !studentClass ||
            fee === undefined ||
            fee === null ||
            !phone
        ) {
            return res.status(400).json({
                message:
                    "Please fill all required fields"
            });
        }


        // Generate student ID separately
        // for each masjid
        const count =
            await Student.countDocuments({
                masjidId: req.user.masjidId
            });


        const studentId =
            "STU-" +
            String(count + 1).padStart(4, "0");


        const student =
            await Student.create({
                masjidId: req.user.masjidId,
                studentId,
                studentName,
                fatherName,
                studentClass,
                fee,
                phone,
                address
            });


        res.status(201).json(student);

    } catch (err) {

        console.error(
            "Create student error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// UPDATE STUDENT
// =====================================================

router.put("/:id", adminOnly, async (req, res) => {

    try {

        if (!req.user.masjidId) {
            return res.status(403).json({
                message:
                    "Account is not linked to a masjid"
            });
        }


        // Never allow changing masjidId
        // or studentId
        const {
            masjidId,
            studentId,
            ...updateData
        } = req.body;


        const student =
            await Student.findOneAndUpdate(
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


        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        res.json(student);

    } catch (err) {

        console.error(
            "Update student error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================================
// DELETE STUDENT
// =====================================================

router.delete("/:id", adminOnly, async (req, res) => {

    try {

        if (!req.user.masjidId) {
            return res.status(403).json({
                message:
                    "Account is not linked to a masjid"
            });
        }


        const student =
            await Student.findOneAndDelete({
                _id: req.params.id,
                masjidId: req.user.masjidId
            });


        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }


        res.json({
            message:
                "Student deleted successfully"
        });

    } catch (err) {

        console.error(
            "Delete student error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;