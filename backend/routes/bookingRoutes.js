const express = require('express');
const router = express.Router();
const {
    createBooking, getMyBookings, getOwnerBookings, getBookingById,
    cancelBooking, confirmBooking, rejectBooking, downloadReceipt, getListingAvailability,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/availability/:listingId', getListingAvailability);      // Public
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/owner-bookings', protect, authorize('owner', 'admin'), getOwnerBookings);
router.get('/:id', protect, getBookingById);
router.get('/:id/receipt', protect, downloadReceipt);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/confirm', protect, confirmBooking);
router.patch('/:id/reject', protect, rejectBooking);

module.exports = router;
