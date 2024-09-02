const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedItem: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' },
    onModel: { type: String, enum: ['Order', 'Dish', 'Reservation'] }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);