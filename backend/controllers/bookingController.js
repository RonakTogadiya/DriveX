const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const { checkDateOverlap, getBookedDatesForListing, calculateTotalDays } = require('../utils/availabilityUtils');
const { calculateTotalCost } = require('../utils/pricingUtils');

// Helper to send notification
const sendNotification = async (userId, type, message, relatedId) => {
    try {
        const notif = await Notification.create({ userId, type, message, relatedId });
        const sockId = global.onlineUsers?.get(userId.toString());
        if (sockId && global.io) {
            global.io.to(sockId).emit('new_notification', notif);
        }
    } catch (err) {
        console.error('Failed to send notification', err);
    }
};

/**
 * @desc    Create a new vehicle booking
 * @route   POST /api/bookings
 * @access  Private (renter)
 */
const createBooking = async (req, res, next) => {
    try {
        const { listingId, startDate, endDate, pickupLocation, notes } = req.body;

        // ── Step 1: Validate input ────────────────────────────────────────
        if (!listingId || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Please provide listingId, startDate, and endDate' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        if (start < new Date()) {
            return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
        }
        if (end <= start) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        // ── Step 2: Fetch vehicle and renter ──────────────────────────────
        const vehicle = await Listing.findById(listingId).populate('owner', 'username email');
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        }
        if (!vehicle.isAvailable) {
            return res.status(400).json({ success: false, message: 'This vehicle is not available for rent' });
        }
        if (vehicle.owner._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot book your own vehicle' });
        }

        // ── Step 3: Check date availability ──────────────────────────────
        const hasConflict = await checkDateOverlap(listingId, start, end);
        if (hasConflict) {
            return res.status(409).json({
                success: false,
                message: 'DATE CONFLICT: Selected dates overlap with an existing booking. Please choose different dates.',
            });
        }

        // ── Step 4: Calculate cost & create booking ───────────────────────
        const totalDays = calculateTotalDays(start, end);
        const totalCost = calculateTotalCost(start, end, vehicle.pricePerDay, vehicle.weekendPrice);

        const booking = await Booking.create({
            listing: listingId,
            renter: req.user._id,
            startDate: start,
            endDate: end,
            pricePerDay: vehicle.pricePerDay,
            totalDays,
            totalCost,
            status: 'PENDING',
            pickupLocation: pickupLocation || vehicle.location?.address || '',
            notes: notes || '',
        });

        // Update renter stats
        await User.findByIdAndUpdate(req.user._id, { $inc: { totalRentals: 1 } });

        const populated = await booking.populate([
            { path: 'listing', select: 'name type brand model imageUrl pricePerDay owner' },
            { path: 'renter', select: 'username email' },
        ]);

        // Emit notification to owner
        if (populated.listing.owner) {
            await sendNotification(
                populated.listing.owner,
                'BOOKING',
                `New booking request for ${populated.listing.name} from ${populated.renter.username}`,
                booking._id
            );
        }

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get logged-in user's bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ renter: req.user._id })
            .populate('listing', 'name type brand model imageUrl pricePerDay location')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get bookings for owner's listings
 * @route   GET /api/bookings/owner-bookings
 * @access  Private (owner)
 */
const getOwnerBookings = async (req, res, next) => {
    try {
        const ownerListings = await Listing.find({ owner: req.user._id }).select('_id');
        const listingIds = ownerListings.map(l => l._id);

        const bookings = await Booking.find({ listing: { $in: listingIds } })
            .populate('listing', 'name brand model pricePerDay imageUrl')
            .populate('renter', 'username email phone licenseType')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('listing', 'name type brand model imageUrl pricePerDay location owner')
            .populate('renter', 'username email phone licenseType');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isRenter = booking.renter._id.toString() === req.user._id.toString();
        const isOwner = booking.listing.owner?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isRenter && !isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel a booking
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isOwner = booking.renter.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
        }

        if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status.toLowerCase()} booking` });
        }

        booking.status = 'CANCELLED';
        booking.cancelledAt = new Date();
        booking.cancelReason = req.body.reason || 'Cancelled by user';
        await booking.save();

        const populatedBooking = await Booking.findById(booking._id).populate('listing');
        const recipientId = isOwner ? populatedBooking.listing.owner : booking.renter;

        await sendNotification(
            recipientId,
            'BOOKING',
            `Booking for ${populatedBooking.listing.name} was cancelled.`,
            booking._id
        );

        res.json({ success: true, message: 'Booking cancelled successfully', data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Confirm a booking (owner action)
 * @route   PATCH /api/bookings/:id/confirm
 * @access  Private (owner/admin)
 */
const confirmBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('listing', 'owner');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const isListingOwner = booking.listing.owner.toString() === req.user._id.toString();
        if (!isListingOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only the vehicle owner can confirm bookings' });
        }

        booking.status = 'CONFIRMED';
        await booking.save();

        await sendNotification(
            booking.renter,
            'BOOKING',
            `Your booking for ${booking.listing.name} has been confirmed.`,
            booking._id
        );

        res.json({ success: true, message: 'Booking confirmed', data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reject a booking request (owner action)
 * @route   PATCH /api/bookings/:id/reject
 * @access  Private (owner/admin)
 */
const rejectBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('listing', 'owner name');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const isListingOwner = booking.listing.owner.toString() === req.user._id.toString();
        if (!isListingOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only the vehicle owner can reject bookings' });
        }

        if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: `Cannot reject a ${booking.status.toLowerCase()} booking` });
        }

        booking.status = 'CANCELLED';
        booking.cancelledAt = new Date();
        booking.cancelReason = req.body.reason || 'Rejected by owner';
        await booking.save();

        await sendNotification(
            booking.renter,
            'BOOKING',
            `Your booking request for ${booking.listing.name} has been rejected by the owner.`,
            booking._id
        );

        res.json({ success: true, message: 'Booking rejected', data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate a PDF receipt for a booking
 * @route   GET /api/bookings/:id/receipt
 * @access  Private (renter/owner/admin)
 */
const downloadReceipt = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('listing', 'name brand model pricePerDay owner')
            .populate('renter', 'username email');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const isRenter = booking.renter._id.toString() === req.user._id.toString();
        const isOwner = booking.listing.owner?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isRenter && !isOwner && !isAdmin) {
             return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt_${booking._id}.pdf`);
        
        doc.pipe(res);

        doc.fontSize(20).text('DriveX Rental Receipt', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Receipt No: ${booking._id}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        doc.text(`Renter Name: ${booking.renter.username}`);
        doc.text(`Email: ${booking.renter.email}`);
        doc.moveDown();

        doc.text('Vehicle Details:', { underline: true });
        doc.text(`${booking.listing.brand} ${booking.listing.model} (${booking.listing.name})`);
        doc.moveDown();

        doc.text('Booking Period:', { underline: true });
        doc.text(`From: ${new Date(booking.startDate).toLocaleDateString()}`);
        doc.text(`To: ${new Date(booking.endDate).toLocaleDateString()}`);
        doc.text(`Total Days: ${booking.totalDays}`);
        doc.moveDown();

        doc.text('Payment Summary:', { underline: true });
        doc.text(`Total Cost: INR ${booking.totalCost}`);
        doc.text(`Deposit Paid: ${booking.depositPaid ? 'Yes' : 'No'}`);
        doc.text(`Rental Paid: ${booking.rentalPaid ? 'Yes' : 'No'}`);
        doc.moveDown();

        doc.fontSize(10).text('Thank you for choosing DriveX!', { align: 'center' });

        doc.end();
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get availability (booked dates) for a listing
 * @route   GET /api/bookings/availability/:listingId
 * @access  Public
 */
const getListingAvailability = async (req, res, next) => {
    try {
        const bookedDates = await getBookedDatesForListing(req.params.listingId);
        res.json({ success: true, data: bookedDates });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getOwnerBookings,
    getBookingById,
    cancelBooking,
    confirmBooking,
    rejectBooking,
    downloadReceipt,
    getListingAvailability,
};
