const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Masjid = require("../models/Masjid");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();


// =====================================================
// ALL ROUTES REQUIRE LOGIN
// =====================================================

router.use(protect);


// =====================================================
// GET ALL USERS
// =====================================================

router.get("/", adminOnly, async (req, res) => {
  try {
    let users;

    // -------------------------------------------------
    // SUPERADMIN
    // Can see users from all masjids
    // -------------------------------------------------

    if (req.user.role === "superadmin") {
      users = await User.find()
        .select("-password")
        .populate("masjidId", "name");
    }

    // -------------------------------------------------
    // ADMIN
    // Can only see users from own masjid
    // -------------------------------------------------

    else {
      users = await User.find({
        masjidId: req.user.masjidId
      })
        .select("-password")
        .populate("masjidId", "name");
    }


    res.json(users);

  } catch (error) {

    console.error("Get users error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =====================================================
// GET SINGLE USER
// =====================================================

router.get("/:id", adminOnly, async (req, res) => {
  try {
    let user;

    // -------------------------------------------------
    // SUPERADMIN
    // Can access any user
    // -------------------------------------------------

    if (req.user.role === "superadmin") {

      user = await User.findById(req.params.id)
        .select("-password")
        .populate("masjidId", "name");
    }

    // -------------------------------------------------
    // ADMIN
    // Can only access own masjid users
    // -------------------------------------------------

    else {

      user = await User.findOne({
        _id: req.params.id,
        masjidId: req.user.masjidId
      })
        .select("-password")
        .populate("masjidId", "name");
    }


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    res.json(user);

  } catch (error) {

    console.error("Get user error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =====================================================
// CREATE USER
// =====================================================

router.post("/", adminOnly, async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      role,
      masjidId
    } = req.body;


    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }


    // =================================================
    // VALIDATE ROLE
    // =================================================

    const allowedRoles = [
      "staff",
      "admin",
      "superadmin"
    ];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }


    let finalRole;
    let finalMasjidId;


    // =================================================
    // SUPERADMIN
    // =================================================

    if (req.user.role === "superadmin") {

      finalRole = role || "staff";


      // ------------------------------------------------
      // Creating another SUPERADMIN
      // ------------------------------------------------

      if (finalRole === "superadmin") {

        finalMasjidId = undefined;

      }

      // ------------------------------------------------
      // Creating ADMIN or STAFF
      // ------------------------------------------------

      else {

        if (!masjidId) {
          return res.status(400).json({
            message: "masjidId is required"
          });
        }


        // Check Masjid exists
        const masjid = await Masjid.findById(masjidId);

        if (!masjid) {
          return res.status(404).json({
            message: "Masjid not found"
          });
        }


        // Do not assign users to inactive Masjid
        if (!masjid.isActive) {
          return res.status(400).json({
            message: "This masjid is inactive"
          });
        }


        finalMasjidId = masjid._id;
      }
    }


    // =================================================
    // NORMAL ADMIN
    // =================================================

    else {

      // ------------------------------------------------
      // Admin can ONLY create STAFF
      // ------------------------------------------------

      if (role && role !== "staff") {
        return res.status(403).json({
          message: "Admin can only create staff users"
        });
      }


      // ------------------------------------------------
      // Admin must have a Masjid
      // ------------------------------------------------

      if (!req.user.masjidId) {
        return res.status(403).json({
          message: "Admin is not assigned to any masjid"
        });
      }


      finalRole = "staff";


      // ------------------------------------------------
      // Automatically use Admin's Masjid
      // ------------------------------------------------

      finalMasjidId = req.user.masjidId;
    }


    // =================================================
    // NORMALIZE EMAIL
    // =================================================

    const normalizedEmail = email.toLowerCase().trim();


    // =================================================
    // DUPLICATE EMAIL CHECK
    // =================================================

    if (finalMasjidId) {

      const existingUser = await User.findOne({
        email: normalizedEmail,
        masjidId: finalMasjidId
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            "User with this email already exists in this masjid"
        });
      }

    } else {

      // ------------------------------------------------
      // Superadmin email check
      // ------------------------------------------------

      const existingSuperAdmin = await User.findOne({
        email: normalizedEmail,
        role: "superadmin"
      });

      if (existingSuperAdmin) {
        return res.status(400).json({
          message:
            "Superadmin with this email already exists"
        });
      }
    }


    // =================================================
    // HASH PASSWORD
    // =================================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // =================================================
    // CREATE USER
    // =================================================

    const user = await User.create({

      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role: finalRole,

      masjidId: finalMasjidId
    });


    // =================================================
    // RESPONSE
    // =================================================

    res.status(201).json({

      message: "User created successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        masjidId: user.masjidId
      }
    });

  } catch (error) {

    console.error("Create user error:", error);


    // MongoDB duplicate key
    if (error.code === 11000) {

      return res.status(400).json({
        message:
          "User with this email already exists"
      });
    }


    res.status(500).json({
      message: "Server error"
    });
  }
});


// =====================================================
// UPDATE USER
// =====================================================

router.put("/:id", adminOnly, async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      role,
      masjidId
    } = req.body;


    let user;


    // =================================================
    // FIND USER
    // =================================================

    // Superadmin can update any user
    if (req.user.role === "superadmin") {

      user = await User.findById(req.params.id);
    }

    // Admin can only update own masjid users
    else {

      user = await User.findOne({
        _id: req.params.id,
        masjidId: req.user.masjidId
      });
    }


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    // =================================================
    // ROLE UPDATE
    // =================================================

    if (role !== undefined) {

      const allowedRoles = [
        "staff",
        "admin",
        "superadmin"
      ];


      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role"
        });
      }


      // ------------------------------------------------
      // ADMIN
      // ------------------------------------------------

      if (req.user.role !== "superadmin") {

        // Admin cannot change role
        if (role !== "staff") {
          return res.status(403).json({
            message:
              "Admin can only manage staff users"
          });
        }

        user.role = "staff";
      }


      // ------------------------------------------------
      // SUPERADMIN
      // ------------------------------------------------

      else {

        user.role = role;
      }
    }


    // =================================================
    // NAME
    // =================================================

    if (name !== undefined) {

      if (!name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty"
        });
      }

      user.name = name.trim();
    }


    // =================================================
    // EMAIL
    // =================================================

    if (email !== undefined) {

      const newEmail = email.toLowerCase().trim();


      if (!newEmail) {
        return res.status(400).json({
          message: "Email cannot be empty"
        });
      }


      const duplicateQuery = {
        email: newEmail,
        _id: { $ne: user._id }
      };


      // For normal users
      if (user.role !== "superadmin") {

        duplicateQuery.masjidId = user.masjidId;
      }

      // For superadmin
      else {

        duplicateQuery.role = "superadmin";
      }


      const duplicateUser = await User.findOne(
        duplicateQuery
      );


      if (duplicateUser) {
        return res.status(400).json({
          message:
            "User with this email already exists"
        });
      }


      user.email = newEmail;
    }


    // =================================================
    // MASJID UPDATE
    // =================================================

    if (req.user.role === "superadmin") {

      // ------------------------------------------------
      // SUPERADMIN
      // ------------------------------------------------

      if (user.role === "superadmin") {

        // Superadmin does not belong to a Masjid
        user.masjidId = undefined;
      }

      else if (masjidId !== undefined) {

        // Check Masjid exists
        const masjid = await Masjid.findById(
          masjidId
        );


        if (!masjid) {
          return res.status(404).json({
            message: "Masjid not found"
          });
        }


        // Cannot assign inactive Masjid
        if (!masjid.isActive) {
          return res.status(400).json({
            message: "This masjid is inactive"
          });
        }


        user.masjidId = masjid._id;
      }

    }

    else {

      // ------------------------------------------------
      // NORMAL ADMIN
      // ------------------------------------------------

      // Admin can NEVER change Masjid
      user.masjidId = req.user.masjidId;
    }


    // =================================================
    // PASSWORD
    // =================================================

    if (
      password !== undefined &&
      password !== ""
    ) {

      user.password = await bcrypt.hash(
        password,
        10
      );
    }


    // =================================================
    // SAVE USER
    // =================================================

    await user.save();


    // =================================================
    // RESPONSE
    // =================================================

    res.json({

      message: "User updated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        masjidId: user.masjidId
      }
    });

  } catch (error) {

    console.error("Update user error:", error);


    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "User with this email already exists"
      });
    }


    res.status(500).json({
      message: "Server error"
    });
  }
});


// =====================================================
// DELETE USER
// =====================================================

router.delete("/:id", adminOnly, async (req, res) => {
  try {

    let user;


    // =================================================
    // FIND USER
    // =================================================

    // Superadmin can find any user
    if (req.user.role === "superadmin") {

      user = await User.findById(req.params.id);
    }

    // Admin can only find own masjid users
    else {

      user = await User.findOne({
        _id: req.params.id,
        masjidId: req.user.masjidId
      });
    }


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    // =================================================
    // PREVENT SELF DELETE
    // =================================================

    if (
      user._id.toString() ===
      req.user.id.toString()
    ) {

      return res.status(400).json({
        message:
          "You cannot delete your own account"
      });
    }


    // =================================================
    // ADMIN PROTECTION
    // =================================================

    if (
      req.user.role !== "superadmin" &&
      user.role !== "staff"
    ) {

      return res.status(403).json({
        message:
          "Admin can only delete staff users"
      });
    }


    // =================================================
    // SUPERADMIN PROTECTION
    // =================================================

    if (
      user.role === "superadmin" &&
      req.user.role !== "superadmin"
    ) {

      return res.status(403).json({
        message:
          "You cannot delete a superadmin"
      });
    }


    // =================================================
    // DELETE
    // =================================================

    await User.findByIdAndDelete(user._id);


    res.json({
      message: "User deleted successfully"
    });

  } catch (error) {

    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;