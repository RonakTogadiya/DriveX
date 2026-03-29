const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['DEPOSIT', 'RENTAL'], required: true },
    method: { type: String, enum: ['QR_UPI', 'CARD', 'CASH', 'RAZORPAY'], default: 'RAZORPAY' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    transactionId: { type: String },
    paidAt: { type: Date },

    // Razorpay-specific fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Refund fields
    refundId: { type: String },
    refundStatus: { type: String, enum: ['NONE', 'INITIATED', 'PROCESSED', 'FAILED'], default: 'NONE' },
    refundAmount: { type: Number }
}, { timestamps: true });

paymentSchema.index({ booking: 1, type: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
