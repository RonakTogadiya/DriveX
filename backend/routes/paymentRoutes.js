const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generateQRCode, verifyPayment } = require('../controllers/paymentController');

router.get('/qr/:bookingId/:type', protect, generateQRCode);
router.post('/verify/:bookingId', protect, verifyPayment);

module.exports = router;
