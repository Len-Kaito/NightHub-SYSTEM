const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Phân quyền: Cần check token và role ở cấp độ middleware cao hơn nếu có
// Hiện tại giả định client sẽ gọi API với tư cách là admin.

// ==================== DASHBOARD ====================
router.get('/dashboard-stats', adminController.getDashboardStats);

// ==================== PHIM ====================
router.get('/movies', adminController.getMovies);
router.post('/movies', adminController.addMovie);
router.put('/movies/:id', adminController.updateMovie);
router.delete('/movies/:id', adminController.deleteMovie);
router.put('/movies/:id/status', adminController.updateMovieStatus);
router.put('/movies/:id/censor-status', adminController.updateCensorStatus);

// ==================== QUẢNG CÁO ====================
router.get('/ads', adminController.getAds);
router.post('/ads', adminController.createAd);

// ==================== KIỂM DUYỆT ====================
router.get('/reports', adminController.getReports);
router.post('/reports/resolve', adminController.resolveReport);
router.post('/reports/scan', adminController.scanReports);

// ==================== NGƯỜI DÙNG ====================
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.toggleUserStatus);

// ==================== NHẬT KÝ ====================
router.get('/logs', adminController.getLogs);

module.exports = router;
