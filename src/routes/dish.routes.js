const express = require('express');
const dishController = require('../controllers/dish.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Dish:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           description: Taom nomi
 *         price:
 *           type: number
 *           description: Taom narxi
 *         description:
 *           type: string
 *           description: Taom haqida qisqacha ma'lumot
 *         category:
 *           type: string
 *           description: Taom kategoriyasi
 */

/**
 * @swagger
 * /api/dishes:
 *   get:
 *     summary: Barcha taomlarni olish
 *     tags: [Dishes]
 *     responses:
 *       200:
 *         description: Taomlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dish'
 *   post:
 *     summary: Yangi taom qo'shish
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dish'
 *     responses:
 *       201:
 *         description: Yangi taom qo'shildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 */
router.get('/', dishController.getAllDishes);
router.post('/', authMiddleware, dishController.createDish);

/**
 * @swagger
 * /api/dishes/{id}:
 *   get:
 *     summary: Bitta taomni olish
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Taom ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *   put:
 *     summary: Taomni yangilash
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dish'
 *     responses:
 *       200:
 *         description: Taom yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *   delete:
 *     summary: Taomni o'chirish
 *     tags: [Dishes]
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
 *         description: Taom o'chirildi
 */
router.get('/:id', dishController.getDish);
router.put('/:id', authMiddleware, dishController.updateDish);
router.delete('/:id', authMiddleware, dishController.deleteDish);

module.exports = router;