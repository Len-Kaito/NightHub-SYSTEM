const express = require('express');
const router = express.Router();
const watchHistoryController = require('../controllers/watchHistoryController');
const { verifyToken } = require('../middleware/auth');

// Yêu cầu đăng nhập
router.use(verifyToken);

// POST /api/watch-history/play
router.post('/play', watchHistoryController.updateWatchHistory);

// GET /api/watch-history/:profileId
router.get('/:profileId', watchHistoryController.getWatchHistory);

module.exports = router;
