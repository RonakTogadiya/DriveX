const express = require('express');
const router = express.Router();
const { getChatHistory, getInbox } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/inbox', protect, getInbox);
router.get('/:roomId', protect, getChatHistory);

module.exports = router;
