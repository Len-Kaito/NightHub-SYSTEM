const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// GET /api/faq
router.get('/', faqController.getFAQ);

module.exports = router;
