const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const recommendController = require('../controllers/recommendController');

// GET /api/recommendations/:profileId
router.get('/:profileId', verifyToken, recommendController.getRecommendations);

module.exports = router;
