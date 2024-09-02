const Reservation = require('../models/reservation.model');

exports.createReservation = async (req, res, next) => {
    try {
        const reservation = new Reservation({
            ...req.body,
            client: req.userData.userId
        });
        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        next(error);
    }
};

exports.getReservations = async (req, res, next) => {
    try {
        const reservations = await Reservation.find().populate('client', 'username');
        res.json(reservations);
    } catch (error) {
        next(error);
    }
};

exports.updateReservationStatus = async (req, res, next) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!reservation) return res.status(404).json({ message: 'Rezervatsiya topilmadi' });
        res.json(reservation);
    } catch (error) {
        next(error);
    }
};