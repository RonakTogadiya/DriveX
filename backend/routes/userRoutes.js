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
 * @desc    Get user's wishlist
 * @route   GET /api/users/wishlist
 * @access  Private
 */
router.get('/wishlist', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist', 'name type brand model imageUrl pricePerDay location owner averageRating');
        res.json({ success: true, count: user.wishlist.length, data: user.wishlist });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Toggle wishlist item
 * @route   POST /api/users/wishlist/:listingId
 * @access  Private
 */
router.post('/wishlist/:listingId', protect, async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const user = await User.findById(req.user._id);
        
        const isWishlisted = user.wishlist.includes(listingId);
        
        if (isWishlisted) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== listingId);
        } else {
            user.wishlist.push(listingId);
        }
        
        await user.save();
        res.json({ success: true, message: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', data: user.wishlist });
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

module.exports = router;
