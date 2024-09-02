const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Foydalanuvchining barcha bildirishnomalarini olish
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bildirishnomalar ro'yxati
 */
router.get('/', authMiddleware, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Bildirishnomani o'qilgan deb belgilash
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'qilgan deb belgilangan bildirishnoma
 */
router.put('/:id/read', authMiddleware, notificationController.markAsRead);


router.post('/', authMiddleware, notificationController.createNotification);

module.exports = router;