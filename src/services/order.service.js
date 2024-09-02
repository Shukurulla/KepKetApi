const Order = require('../models/order.model');
const notificationService = require('./notification.service');

exports.createOrder = async (orderData) => {
    const order = new Order(orderData);
    await order.save();

    // Oshpazga bildirishnoma yuborish
    await notificationService.sendNotificationToUser(
        order.chef,
        'Yangi buyurtma qabul qilindi',
        'NEW_ORDER',
        order._id,
        'Order'
    );

    return order;
};

exports.getAllOrders = async () => {
    return await Order.find().populate('items.dish').populate('waiter', 'username');
};

exports.getOrderById = async (id) => {
    return await Order.findById(id).populate('items.dish').populate('waiter', 'username');
};

exports.updateOrderStatus = async (id, status) => {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (status === 'ready') {
        // Ofitsiantga bildirishnoma yuborish
        await notificationService.sendNotificationToUser(
            order.waiter,
            'Buyurtma tayyor',
            'ORDER_READY',
            order._id,
            'Order'
        );
    }

    return order;
};