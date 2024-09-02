const express = require('express');
const promotionController = require('../controllers/promotion.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, promotionController.createPromotion);
router.get('/', promotionController.getPromotions);
router.delete('/:id', authMiddleware, promotionController.deletePromotion);

module.exports = router;