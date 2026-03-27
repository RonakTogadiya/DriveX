const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const qrcode = require('qrcode');

/**
 * @desc    Generate UPI QR Code for payment
 * @route   GET /api/payments/qr/:bookingId/:type
 * @access  Private (renter)
 */
const generateQRCode = async (req, res, next) => {
    try {
        const { bookingId, type } = req.params;
        const booking = await Booking.findById(bookingId).populate('listing');
        
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.renter.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Fixed deposit for MVP is 2000 INR
        const amount = type === 'DEPOSIT' ? 2000 : booking.totalCost;
        
        const upiString = `upi://pay?pa=mockowner@upi&pn=DriveX_Owner&am=${amount}&cu=INR`;
        const qrDataUrl = await qrcode.toDataURL(upiString, { width: 300, margin: 2, color: { dark: '#111827', light: '#FFFFFF' } });

        res.json({ success: true, qr: qrDataUrl, amount });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Verify/Confirm payment (Simulated flow for MVP)
 * @route   POST /api/payments/verify/:bookingId
 * @access  Private (renter)
 */
const verifyPayment = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const { type, transactionId } = req.body; // type = 'DEPOSIT' or 'RENTAL'

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.renter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const amount = type === 'DEPOSIT' ? 2000 : booking.totalCost;

        // Create payment record
        const payment = await Payment.create({
            booking: bookingId,
            user: req.user._id,
            amount: amount,
            type: type,
            status: 'COMPLETED',
            transactionId: transactionId || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            paidAt: new Date()
        });

        // Update booking state
        if (type === 'DEPOSIT') {
            booking.depositPaid = true;
        } else if (type === 'RENTAL') {
            booking.rentalPaid = true;
        }
        await booking.save();

        res.json({ success: true, message: `${type} payment successful!`, data: payment });
    } catch (err) {
        next(err);
    }
};

module.exports = { generateQRCode, verifyPayment };
