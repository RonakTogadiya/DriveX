const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['BOOKING', 'CHAT', 'REMINDER', 'PAYMENT', 'LISTING_APPROVED', 'LISTING_REJECTED', 'USER_VERIFIED'], required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Can be bookingId or listingId
    read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
