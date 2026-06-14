const express = require('express');
const router = express.Router();
const myListController = require('../controllers/myListController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/:profileId', myListController.getMyList);
router.post('/:profileId', myListController.addToMyList);
router.delete('/:profileId/:movieId', myListController.removeFromMyList);

module.exports = router;
