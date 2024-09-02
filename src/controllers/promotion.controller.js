const Promotion = require('../models/promotion.model');

exports.createPromotion = async (req, res, next) => {
    try {
        const promotion = new Promotion(req.body);
        await promotion.save();
        res.status(201).json(promotion);
    } catch (error) {
        next(error);
    }
};

exports.getPromotions = async (req, res, next) => {
    try {
        const promotions = await Promotion.find().populate('applicableDishes', 'name');
        res.json(promotions);
    } catch (error) {
        next(error);
    }
};

exports.deletePromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!promotion) return res.status(404).json({ message: 'Aksiya topilmadi' });
        res.json({
            message: 'Aksiya muvaffaqiyatli ochirildi' });
  } catch (error) {
            next(error);
        }
    };