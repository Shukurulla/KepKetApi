const express = require('express');
const qrController = require('../controllers/qr.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/qr/table-info:
 *   get:
 *     summary: QR kod orqali stol va restoran ma'lumotlarini olish
 *     tags: [QR]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: QR koddan olingan ma'lumot
 *     responses:
 *       200:
 *         description: Stol va restoran ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurantId:
 *                   type: string
 *                 tableNumber:
 *                   type: number
 *       400:
 *         description: Noto'g'ri yoki eskirgan QR kod
 *       404:
 *         description: QR kod topilmadi
 */
router.get('/table-info', qrController.getTableInfo);

/**
 * @swagger
 * /api/qr/generate:
 *   post:
 *     summary: Yangi QR kod yaratish (faqat xodimlar uchun)
 *     tags: [QR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - tableNumber
 *             properties:
 *               restaurantId:
 *                 type: string
 *               tableNumber:
 *                 type: number
 *     responses:
 *       200:
 *         description: Yaratilgan QR kod ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 */
router.post('/generate', authMiddleware, qrController.generateQRCode);

module.exports = router;