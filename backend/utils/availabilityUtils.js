const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

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
    if (conflict) return true;

    // Check against owner-defined blockedDates
    const listing = await Listing.findById(listingId);
    if (listing && listing.blockedDates && listing.blockedDates.length > 0) {
        const start = new Date(requestedStart);
        const end = new Date(requestedEnd);
        for (const date of listing.blockedDates) {
            const blocked = new Date(date);
            // blocked date falls exactly on or inside the requested time window
            if (blocked >= start && blocked <= end) return true;
        }
    }

    return false;
};

/**
 * getBookedDatesForListing — Returns all booked date ranges for frontend calendars
 */
const getBookedDatesForListing = async (listingId) => {
    const bookings = await Booking.find({
        listing: listingId,
        status: { $in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
    }).select('startDate endDate status');

    const mappedBookings = bookings.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
    }));

    const listing = await Listing.findById(listingId).select('blockedDates');
    if (listing && listing.blockedDates) {
        listing.blockedDates.forEach(date => {
            mappedBookings.push({
                startDate: date,
                endDate: date,
                status: 'BLOCKED'
            });
        });
    }

    return mappedBookings;
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
