const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    getNearbyListings,
    updateAvailability
} = require('../controllers/listingController');

// Public routes
router.get('/', getListings);
router.get('/nearby', getNearbyListings);
router.get('/:id', getListingById);

// Private routes (owner or admin)
router.post('/', protect, authorize('owner', 'admin'), createListing);
router.put('/:id', protect, authorize('owner', 'admin'), updateListing);
router.put('/:id/availability', protect, authorize('owner', 'admin'), updateAvailability);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteListing);

module.exports = router;
