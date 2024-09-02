const express = require('express');
const reservationController = require('../controllers/reservation.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, reservationController.createReservation);
router.get('/', authMiddleware, reservationController.getReservations);
router.put('/:id', authMiddleware, reservationController.updateReservationStatus);

module.exports = router;