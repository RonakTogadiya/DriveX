const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usually the renter
    amount: { type: Number, required: true },
    type: { type: String, enum: ['DEPOSIT', 'RENTAL'], required: true },
    method: { type: String, enum: ['QR_UPI', 'CARD', 'CASH'], default: 'QR_UPI' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    transactionId: { type: String },
    paidAt: { type: Date }
}, { timestamps: true });

paymentSchema.index({ booking: 1, type: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
