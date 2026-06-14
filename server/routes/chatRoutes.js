const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Lấy lịch sử chat
router.get('/:profileId', chatController.getChatHistory);

// Gửi tin nhắn mới
router.post('/', chatController.sendMessage);
// Yêu cầu CSKH hỗ trợ
router.post('/request-support', chatController.requestSupport);

module.exports = router;
