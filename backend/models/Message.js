const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
