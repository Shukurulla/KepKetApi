const Review = require('../models/review.model');

exports.createReview = async (req, res, next) => {
    try {
        const review = new Review({
            ...req.body,
            user: req.userData.userId
        });
        await review.save();
        res.status(201).json(review);
    } catch (error) {
        next(error);
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ dish: req.params.dishId })
            .populate('user', 'username')
            .populate('dish', 'name');
        res.json(reviews);
    } catch (error) {
        next(error);
    }
};