const QRCode = require('../models/qr.model');

exports.getTableInfo = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'QR kod kiritilmagan' });
    }

    const qrCodeData = await QRCode.findOne({ code, isActive: true });

    if (!qrCodeData) {
      return res.status(404).json({ message: 'Yaroqli QR kod topilmadi' });
    }

    if (qrCodeData.expiresAt < new Date()) {
      qrCodeData.isActive = false;
      await qrCodeData.save();
      return res.status(400).json({ message: 'QR kod eskirgan' });
    }

    res.json({
      restaurantId: qrCodeData.restaurantId,
      tableNumber: qrCodeData.tableNumber
    });
  } catch (error) {
    console.error('QR kod tekshirishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

exports.generateQRCode = async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.body;

    if (!restaurantId || !tableNumber) {
      return res.status(400).json({ message: 'Restoran ID va stol raqami kiritilishi shart' });
    }

    const qrCode = await QRCode.generateQRCode(restaurantId, tableNumber);

    res.json({
      code: qrCode.code,
      expiresAt: qrCode.expiresAt
    });
  } catch (error) {
    console.error('QR kod yaratishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};