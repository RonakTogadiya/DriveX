const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createOrder, verifyPayment, handleWebhook, initiateRefund } = require('../controllers/paymentController');

// Razorpay webhook — needs raw body, NO auth (verified via signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

// Admin-only: initiate refund
router.post('/:id/refund', protect, authorize('admin'), initiateRefund);

module.exports = router;
