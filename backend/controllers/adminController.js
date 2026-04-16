const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// Helper to send notification (same pattern as bookingController)
const sendNotification = async (userId, type, message, relatedId) => {
    try {
        const notif = await Notification.create({ userId, type, message, relatedId });
        const sockId = global.onlineUsers?.get(userId.toString());
        if (sockId && global.io) {
            global.io.to(sockId).emit('new_notification', notif);
        }
    } catch (err) {
        console.error('Failed to send admin notification', err);
    }
};


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


const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};


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


const verifyUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isVerified = !user.isVerified;
        await user.save();

        // Send notification to user about verification status change
        if (user.isVerified) {
            await sendNotification(
                user._id,
                'USER_VERIFIED',
                'Your account has been verified! You can now list vehicles on DriveLink.',
                user._id
            );
        }

        res.json({ success: true, message: `User verification changed to ${user.isVerified}`, data: user });
    } catch (err) {
        next(err);
    }
};


const getAllListings = async (req, res, next) => {
    try {
        const listings = await Listing.find().populate('owner', 'username email').sort({ createdAt: -1 });
        res.json({ success: true, count: listings.length, data: listings });
    } catch (err) {
        next(err);
    }
};


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

        // Send notification to owner about listing status change
        if (listing.owner && (status === 'APPROVED' || status === 'REJECTED')) {
            const notifType = status === 'APPROVED' ? 'LISTING_APPROVED' : 'LISTING_REJECTED';
            const notifMessage = status === 'APPROVED'
                ? `Your vehicle "${listing.name}" has been approved and is now live on DriveLink!`
                : `Your vehicle "${listing.name}" has been rejected by admin. Please review and resubmit.`;

            await sendNotification(
                listing.owner,
                notifType,
                notifMessage,
                listing._id
            );
        }

        res.json({ success: true, message: `Listing marked as ${status}`, data: listing });
    } catch (err) {
        next(err);
    }
};


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


const getPendingOwners = async (req, res, next) => {
    try {
        const pendingOwners = await User.find({ role: 'owner', approvalStatus: 'PENDING' })
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: pendingOwners.length, data: pendingOwners });
    } catch (err) {
        next(err);
    }
};


const approveOwner = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role !== 'owner') return res.status(400).json({ success: false, message: 'User is not an owner' });
        if (user.approvalStatus === 'APPROVED') return res.status(400).json({ success: false, message: 'Owner is already approved' });

        user.approvalStatus = 'APPROVED';
        user.isVerified = true;
        await user.save();

        // Auto-create the first vehicle listing from initialVehicle data
        if (user.initialVehicle && user.initialVehicle.name) {
            await Listing.create({
                name: user.initialVehicle.name,
                brand: user.initialVehicle.brand || 'Unknown',
                model: user.initialVehicle.model || 'Unknown',
                year: user.initialVehicle.year || new Date().getFullYear(),
                type: user.initialVehicle.type || 'CAR',
                fuelType: user.initialVehicle.fuelType || 'PETROL',
                pricePerDay: user.initialVehicle.pricePerDay || 1000,
                description: `Vehicle listed by ${user.username} upon registration approval.`,
                owner: user._id,
                isAvailable: true,
                verificationStatus: 'APPROVED',
            });
        }

        // Send notification
        await sendNotification(
            user._id,
            'USER_VERIFIED',
            'Congratulations! Your owner account has been approved. You can now log in and manage your vehicles on DriveLink.',
            user._id
        );

        res.json({ success: true, message: 'Owner approved successfully', data: user });
    } catch (err) {
        next(err);
    }
};


const rejectOwner = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role !== 'owner') return res.status(400).json({ success: false, message: 'User is not an owner' });

        user.approvalStatus = 'REJECTED';
        await user.save();

        const reason = req.body.reason || 'Your registration did not meet our requirements.';

        // Send notification
        await sendNotification(
            user._id,
            'LISTING_REJECTED',
            `Your owner registration has been rejected. Reason: ${reason}`,
            user._id
        );

        res.json({ success: true, message: 'Owner registration rejected', data: user });
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
    getAllPayments,
    getPendingOwners,
    approveOwner,
    rejectOwner
};
