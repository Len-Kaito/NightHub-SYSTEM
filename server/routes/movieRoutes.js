const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/movies', movieController.getAllMovies);
router.get('/movies/top10', movieController.getTop10Movies);
router.get('/movies/:id', movieController.getMovieById);
router.get('/categories', movieController.getCategories);
router.get('/tags', movieController.getTags);

module.exports = router;
