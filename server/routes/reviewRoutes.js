const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

// Lấy bình luận (Public)
router.get('/:movieId', reviewController.getReviews);

// Thêm bình luận (Requires Login)
router.post('/:movieId', verifyToken, reviewController.addReview);

// Xóa bình luận
router.delete('/:movieId/:commentId', verifyToken, reviewController.deleteReview);

// Báo cáo bình luận
router.post('/:movieId/:commentId/report', verifyToken, reviewController.reportReview);

module.exports = router;
