const Notification = require('../models/Notification');
const Booking = require('../models/Booking');

exports.getNotifications = async (req, res) => {
    try {
        // --- 1. Check for upcoming due dates ---
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const upcomingBookings = await Booking.find({
            renter: req.user.id,
            status: { $in: ['CONFIRMED', 'ACTIVE'] },
            endDate: { $lte: tomorrow, $gte: new Date() }
        }).populate('listing', 'name');

        for (const booking of upcomingBookings) {
            // Check if reminder already sent
            const existing = await Notification.findOne({
                userId: req.user.id,
                relatedId: booking._id,
                type: 'REMINDER' // Important!
            });
            if (!existing) {
                await Notification.create({
                    userId: req.user.id,
                    type: 'REMINDER',
                    message: `Reminder: Your booking for ${booking.listing.name} ends soon!`,
                    relatedId: booking._id
                });
            }
        }

        // --- 2. Fetch notifications ---
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating notification' });
    }
};

exports.clearAll = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id }, { read: true });
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error clearing notifications' });
    }
};
