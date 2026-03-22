const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: protect
 * Verifies the JWT in the Authorization header.
 * Attaches the full user document (minus passwordHash) to req.user.
 */
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request (exclude passwordHash)
            req.user = await User.findById(decoded.id).select('-passwordHash');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

/**
 * Middleware: authorize
 * Role-based access control.
 * Usage: authorize('admin'), authorize('owner', 'admin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};

/**
 * Middleware: checkGravityClearance
 * Sci-fi themed clearance check.
 * Compares user's gravityClearance against the listing's requiredClearance.
 */
const CLEARANCE_LEVELS = { CIVILIAN: 1, PILOT: 2, COMMANDER: 3, ADMIN: 4 };

const checkGravityClearance = (requiredLevel) => {
    return (req, res, next) => {
        const userLevel = CLEARANCE_LEVELS[req.user.gravityClearance] || 0;
        const required = CLEARANCE_LEVELS[requiredLevel] || 0;

        if (userLevel < required) {
            return res.status(403).json({
                success: false,
                message: `⚠️ GRAVITY CLEARANCE DENIED. Required: ${requiredLevel}. Your Level: ${req.user.gravityClearance}.`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize, checkGravityClearance, CLEARANCE_LEVELS };
