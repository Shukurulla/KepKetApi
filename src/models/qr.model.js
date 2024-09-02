const mongoose = require('mongoose');
const crypto = require('crypto');

const qrSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: { type: Number, required: true },
  code: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

qrSchema.statics.generateQRCode = async function(restaurantId, tableNumber) {
  const code = crypto.randomBytes(10).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 soatdan keyin eskiradi
  
  const qrCode = new this({
    restaurantId,
    tableNumber,
    code,
    expiresAt
  });

  await qrCode.save();
  return qrCode;
};

module.exports = mongoose.model('QRCode', qrSchema);