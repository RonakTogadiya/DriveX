const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/authMiddleware');

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
router.get('/profile', protect, (req, res) => {
    res.json({ success: true, data: req.user });
});

/**
 * @desc    Update current user's profile (username, bio, profilePicture)
 * @route   PUT /api/users/profile
 * @access  Private
 */
router.put('/profile', protect, async (req, res, next) => {
    try {
        const allowed = ['username', 'bio', 'profilePicture'];
        const updates = {};
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const updated = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Update a user's gravityClearance (admin only)
 * @route   PATCH /api/users/:id/clearance
 * @access  Private/Admin
 */
router.patch('/:id/clearance', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { gravityClearance } = req.body;
        const validLevels = ['CIVILIAN', 'PILOT', 'COMMANDER', 'ADMIN'];
        if (!validLevels.includes(gravityClearance)) {
            return res.status(400).json({ success: false, message: 'Invalid clearance level' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { gravityClearance },
            { new: true }
        ).select('-passwordHash');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, message: `Clearance updated to ${gravityClearance}`, data: user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
