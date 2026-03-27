const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

/**
 * @desc    Get dashboard statistics for admin
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
const getAdminStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalListings = await Listing.countDocuments();
        const totalBookings = await Booking.countDocuments();
        
        const payments = await Payment.find({ status: 'COMPLETED' });
        const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

        const pendingListings = await Listing.countDocuments({ verificationStatus: 'PENDING' });
        const pendingUsers = await User.countDocuments({ isVerified: false, role: 'owner' });

        res.json({
            success: true,
            data: {
                totalUsers,
                totalListings,
                totalBookings,
                totalRevenue,
                pendingListings,
                pendingUsers
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Toggle block status of a user
 * @route   PATCH /api/admin/users/:id/block
 * @access  Private (admin)
 */
const toggleBlockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot block an admin' });

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: user });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Toggle verification status of a user document
 * @route   PATCH /api/admin/users/:id/verify
 * @access  Private (admin)
 */
const verifyUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isVerified = !user.isVerified;
        await user.save();
        res.json({ success: true, message: `User verification changed to ${user.isVerified}`, data: user });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all listings (including pending/rejected)
 * @route   GET /api/admin/listings
 * @access  Private (admin)
 */
const getAllListings = async (req, res, next) => {
    try {
        const listings = await Listing.find().populate('owner', 'username email').sort({ createdAt: -1 });
        res.json({ success: true, count: listings.length, data: listings });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Verify or reject a listing
 * @route   PATCH /api/admin/listings/:id/verify
 * @access  Private (admin)
 */
const verifyListing = async (req, res, next) => {
    try {
        const { status } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

        listing.verificationStatus = status;
        await listing.save();
        res.json({ success: true, message: `Listing marked as ${status}`, data: listing });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all bookings
 * @route   GET /api/admin/bookings
 * @access  Private (admin)
 */
const getAllBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate('listing', 'name plateNumber')
            .populate('renter', 'username email')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all payments
 * @route   GET /api/admin/payments
 * @access  Private (admin)
 */
const getAllPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find()
            .populate('user', 'username email')
            .populate('booking')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: payments.length, data: payments });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAdminStats,
    getAllUsers,
    toggleBlockUser,
    verifyUser,
    getAllListings,
    verifyListing,
    getAllBookings,
    getAllPayments
};
