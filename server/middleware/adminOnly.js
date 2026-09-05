function adminOnly(req, res, next) {

    if (!req.user) {
        return res.status(401).json({
            message: "Not authorized"
        });
    }


    // Superadmin has access to all masjids
    if (req.user.role === "superadmin") {
        return next();
    }


    // Normal admin has access to admin routes
    if (req.user.role === "admin") {
        return next();
    }


    // Normal users are not allowed
    return res.status(403).json({
        message: "Only admin or superadmin can perform this action"
    });
}


module.exports = adminOnly;