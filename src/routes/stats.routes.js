const express = require('express');
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/stats/daily:
 *   get:
 *     summary: Kunlik statistikani olish
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kunlik statistika
 */
router.get('/daily', authMiddleware, statsController.getDailyStats);

/**
 * @swagger
 * /api/stats/waiter-performance:
 *   get:
 *     summary: Ofitsiantlar ishlash ko'rsatkichlarini olish
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ofitsiantlar ishlash ko'rsatkichlari
 */
router.get('/waiter-performance', authMiddleware, statsController.getWaiterPerformance);

module.exports = router;