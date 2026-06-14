const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');

// Tất cả các API profile đều yêu cầu đăng nhập
router.use(verifyToken);

router.get('/', profileController.getProfiles);
router.post('/', profileController.createProfile);
router.put('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);

router.get('/vip-status', profileController.getVipStatus);
router.post('/upgrade-vip', profileController.upgradeVip);

module.exports = router;
