const express = require('express');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, reviewController.createReview);
router.get('/dish/:dishId', reviewController.getReviews);

module.exports = router;