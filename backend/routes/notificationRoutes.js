const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, clearAll } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/clear', protect, clearAll);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
