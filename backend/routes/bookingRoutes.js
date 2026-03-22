const express = require('express');
const router = express.Router();
const {
    createBooking, getMyBookings, getBookingById,
    cancelBooking, confirmBooking, getListingAvailability,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/availability/:listingId', getListingAvailability);      // Public
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/confirm', protect, confirmBooking);

module.exports = router;
