const express = require("express");
const Student = require("../models/Student");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { studentName, fatherName, studentClass, fee, phone, address } = req.body;

        if (!studentName || !fatherName || !studentClass || !fee || !phone) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const count = await Student.countDocuments();
        const studentId = "STU-" + String(count + 1).padStart(4, "0");

        const student = await Student.create({ studentId, studentName, fatherName, studentClass, fee, phone, address });
        res.status(201).json(student);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json(student);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: "Student deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
