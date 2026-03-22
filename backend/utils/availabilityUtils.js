const Booking = require('../models/Booking');

/**
 * checkDateOverlap — Core availability engine
 * Returns true if requested dates conflict with an existing booking.
 *
 * Overlap condition: newStart < existingEnd AND newEnd > existingStart
 */
const checkDateOverlap = async (listingId, requestedStart, requestedEnd, excludeBookingId = null) => {
    const query = {
        listing: listingId,
        status: { $in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        startDate: { $lt: new Date(requestedEnd) },
        endDate: { $gt: new Date(requestedStart) },
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const conflict = await Booking.findOne(query);
    return !!conflict;
};

/**
 * getBookedDatesForListing — Returns all booked date ranges for frontend calendars
 */
const getBookedDatesForListing = async (listingId) => {
    const bookings = await Booking.find({
        listing: listingId,
        status: { $in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
    }).select('startDate endDate status');

    return bookings.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
    }));
};

/**
 * calculateTotalDays — Calculate rental duration in days
 */
const calculateTotalDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = { checkDateOverlap, getBookedDatesForListing, calculateTotalDays };
