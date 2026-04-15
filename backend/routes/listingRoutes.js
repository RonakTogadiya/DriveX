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
    updateAvailability,
    toggleListingStatus,
    getMyListings
} = require('../controllers/listingController');

// Public routes
router.get('/', getListings);
router.get('/nearby', getNearbyListings);
router.get('/my-listings', protect, authorize('owner', 'admin'), getMyListings);
router.get('/:id', getListingById);

// Private routes (owner or admin)
router.post('/', protect, authorize('owner', 'admin'), createListing);
router.put('/:id', protect, authorize('owner', 'admin'), updateListing);
router.put('/:id/availability', protect, authorize('owner', 'admin'), updateAvailability);
router.patch('/:id/toggle-status', protect, authorize('owner', 'admin'), toggleListingStatus);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteListing);

module.exports = router;
