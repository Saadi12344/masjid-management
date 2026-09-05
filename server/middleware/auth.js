const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {

    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "Not authorized, no token"
        });
    }


    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Not authorized, no token"
        });
    }


    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        if (!decoded.id || !decoded.role) {
            return res.status(401).json({
                message: "Not authorized, invalid token"
            });
        }


        // Get current user from database
        const user = await User.findById(
            decoded.id
        ).select(
            "_id name email role masjidId"
        );


        if (!user) {
            return res.status(401).json({
                message: "Account no longer exists"
            });
        }


        // Every user except superadmin
        // must belong to a masjid
        if (
            user.role !== "superadmin" &&
            !user.masjidId
        ) {
            return res.status(403).json({
                message:
                    "Account is not linked to a masjid"
            });
        }


        // Always use current database values
        // Never trust old JWT role/masjidId
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            masjidId: user.masjidId
                ? user.masjidId.toString()
                : null
        };


        next();

    } catch (err) {

        console.error(
            "Auth middleware error:",
            err.message
        );

        return res.status(401).json({
            message:
                "Not authorized, invalid or expired token"
        });
    }
}

module.exports = protect;