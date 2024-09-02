const Order = require('../models/order.model');
const User = require('../models/user.model');

exports.getDailyStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyOrders = await Order.find({ createdAt: { $gte: today } });
        const totalRevenue = dailyOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const orderCount = dailyOrders.length;

        res.json({
            date: today,
            orderCount,
            totalRevenue
        });
    } catch (error) {
        next(error);
    }
};

exports.getWaiterPerformance = async (req, res, next) => {
    try {
        const waiters = await User.find({ role: 'waiter' });
        const waiterStats = await Promise.all(waiters.map(async (waiter) => {
            const orders = await Order.find({ waiter: waiter._id });
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

            return {
                waiterId: waiter._id,
                waiterName: waiter.username,
                totalOrders,
                totalRevenue
            };
        }));

        res.json(waiterStats);
    } catch (error) {
        next(error);
    }
};