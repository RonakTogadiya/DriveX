const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Helper: Send notification to a user via socket if online.
 */
const sendNotification = async (userId, type, message, relatedId) => {
    try {
        const notif = await Notification.create({ userId, type, message, relatedId });
        const sockId = global.onlineUsers?.get(userId.toString());
        if (sockId && global.io) {
            global.io.to(sockId).emit('new_notification', notif);
        }
    } catch (err) {
        console.error('Failed to send payment notification', err);
    }
};

/**
 * @desc    Create a Razorpay order for a booking payment
 * @route   POST /api/payments/create-order
 * @access  Private (renter)
 */
const createOrder = async (req, res, next) => {
    try {
        const { bookingId, type } = req.body; // type = 'DEPOSIT' or 'RENTAL'

        if (!bookingId || !type) {
            return res.status(400).json({ success: false, message: 'bookingId and type are required' });
        }
        if (!['DEPOSIT', 'RENTAL'].includes(type)) {
            return res.status(400).json({ success: false, message: 'type must be DEPOSIT or RENTAL' });
        }

        const booking = await Booking.findById(bookingId).populate('listing');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        if (booking.renter.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You can only pay for your own bookings' });
        }

        // Check if already paid
        if (type === 'DEPOSIT' && booking.depositPaid) {
            return res.status(400).json({ success: false, message: 'Deposit already paid for this booking' });
        }
        if (type === 'RENTAL' && booking.rentalPaid) {
            return res.status(400).json({ success: false, message: 'Rental already paid for this booking' });
        }

        // Fixed deposit = 2000 INR, rental = totalCost
        const amount = type === 'DEPOSIT' ? 2000 : booking.totalCost;

        // Create Razorpay order (amount in paise)
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `rcpt_${bookingId}_${type}_${Date.now()}`,
            notes: {
                bookingId: bookingId,
                type: type,
                userId: req.user._id.toString(),
            },
        });

        // Create a PENDING payment record
        const payment = await Payment.create({
            booking: bookingId,
            user: req.user._id,
            amount: amount,
            type: type,
            method: 'RAZORPAY',
            status: 'PENDING',
            razorpayOrderId: razorpayOrder.id,
        });

        res.status(201).json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                paymentRecordId: payment._id,
            },
        });
    } catch (err) {
        console.error('Razorpay createOrder error:', err);
        next(err);
    }
};

/**
 * @desc    Verify Razorpay payment after checkout popup success
 * @route   POST /api/payments/verify-payment
 * @access  Private (renter)
 */
const verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification parameters' });
        }

        // Verify signature using HMAC SHA256
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            // Mark payment as failed
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'FAILED' }
            );
            return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
        }

        // Update payment record
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                status: 'COMPLETED',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                transactionId: razorpay_payment_id,
                paidAt: new Date(),
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found for this order' });
        }

        // Update booking payment status
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            if (payment.type === 'DEPOSIT') {
                booking.depositPaid = true;
            } else if (payment.type === 'RENTAL') {
                booking.rentalPaid = true;
            }
            await booking.save();

            // Send notification to renter
            await sendNotification(
                payment.user,
                'PAYMENT',
                `Your ${payment.type.toLowerCase()} payment of ₹${payment.amount} was successful!`,
                booking._id
            );
        }

        res.json({
            success: true,
            message: `${payment.type} payment verified successfully!`,
            data: payment,
        });
    } catch (err) {
        console.error('Razorpay verifyPayment error:', err);
        next(err);
    }
};

/**
 * @desc    Handle Razorpay webhook events (fallback verification)
 * @route   POST /api/payments/webhook
 * @access  Public (verified via webhook signature)
 */
const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature
        const receivedSignature = req.headers['x-razorpay-signature'];
        if (!receivedSignature || !webhookSecret) {
            return res.status(400).json({ success: false, message: 'Missing webhook signature or secret' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body) // raw body buffer
            .digest('hex');

        if (receivedSignature !== expectedSignature) {
            console.warn('Webhook signature verification failed');
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const event = JSON.parse(req.body);
        const { event: eventType, payload } = event;

        if (eventType === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;

            const payment = await Payment.findOne({ razorpayOrderId: orderId });
            if (payment && payment.status === 'PENDING') {
                payment.status = 'COMPLETED';
                payment.razorpayPaymentId = paymentEntity.id;
                payment.transactionId = paymentEntity.id;
                payment.paidAt = new Date();
                await payment.save();

                // Update booking
                const booking = await Booking.findById(payment.booking);
                if (booking) {
                    if (payment.type === 'DEPOSIT') booking.depositPaid = true;
                    else if (payment.type === 'RENTAL') booking.rentalPaid = true;
                    await booking.save();
                }
            }
        } else if (eventType === 'payment.failed') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;

            await Payment.findOneAndUpdate(
                { razorpayOrderId: orderId, status: 'PENDING' },
                { status: 'FAILED' }
            );
        }

        // Always respond 200 to acknowledge webhook
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Webhook processing error:', err);
        res.status(200).json({ success: true }); // Still respond 200 to prevent retries
    }
};

/**
 * @desc    Initiate a refund for a completed payment (Admin only)
 * @route   POST /api/payments/:id/refund
 * @access  Private (admin)
 */
const initiateRefund = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        if (payment.status !== 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
        }
        if (payment.refundStatus === 'PROCESSED') {
            return res.status(400).json({ success: false, message: 'This payment has already been refunded' });
        }
        if (!payment.razorpayPaymentId) {
            return res.status(400).json({ success: false, message: 'No Razorpay payment ID found for refund' });
        }

        // Initiate refund via Razorpay API
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(payment.amount * 100), // full refund in paise
            notes: {
                reason: req.body.reason || 'Admin initiated refund',
                paymentId: payment._id.toString(),
            },
        });

        // Update payment record
        payment.refundId = refund.id;
        payment.refundStatus = 'PROCESSED';
        payment.refundAmount = payment.amount;
        payment.status = 'REFUNDED';
        await payment.save();

        // Send notification to user
        await sendNotification(
            payment.user,
            'PAYMENT',
            `Your payment of ₹${payment.amount} has been refunded.`,
            payment.booking
        );

        res.json({
            success: true,
            message: 'Refund initiated successfully',
            data: payment,
        });
    } catch (err) {
        console.error('Razorpay refund error:', err);

        // If Razorpay API call fails, update refund status
        if (req.params.id) {
            await Payment.findByIdAndUpdate(req.params.id, { refundStatus: 'FAILED' });
        }
        next(err);
    }
};

module.exports = { createOrder, verifyPayment, handleWebhook, initiateRefund };
