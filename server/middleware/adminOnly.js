function adminOnly(req, res, next) {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Only admin can perform this action" });
    }
}

module.exports = adminOnly;
