const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getAdminStats,
    getAllUsers, toggleBlockUser, verifyUser,
    getAllListings, verifyListing,
    getAllBookings, getAllPayments
} = require('../controllers/adminController');

// All routes require authentication and "admin" role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);

router.get('/users', getAllUsers);
router.patch('/users/:id/block', toggleBlockUser);
router.patch('/users/:id/verify', verifyUser);

router.get('/listings', getAllListings);
router.patch('/listings/:id/verify', verifyListing);

router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);

module.exports = router;
