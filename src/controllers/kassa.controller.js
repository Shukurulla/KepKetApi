const KassaModel = require("../models/kassa.model.js");
const orderModel = require("../models/order.model.js");
const waiterModel = require("../models/waiter.model.js");

exports.createKassa = async (req, res) => {
  try {
    const order = await KassaModel.create(req.body);
    const findOrder = await orderModel.findById(req.body.orderId);
    if (!findOrder) {
      return res.status(400).json({ message: "Bunday buyurtma topilmadi" });
    }
    await orderModel.findByIdAndUpdate(
      findOrder._id,
      {
        $set: { showOrder: false, payment: true },
      },
      { new: true }
    );

    const findWaiter = await waiterModel.findById(req.body.waiter.id);
    if (!findWaiter) {
      return res.status(400).json({ message: "Bunday ofitsiyant topilmadi" });
    }
    await waiterModel.findByIdAndUpdate(findWaiter._id, {
      $set: { busy: false, orderCount: findWaiter.orderCount + 1 },
    });
    res.json(order);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

exports.getKassa = async (req, res) => {
  try {
    const { userId } = req.userData;
    const findKassa = await KassaModel.find({ restaurantId: userId });
    if (!findKassa) {
      return res
        .status(400)
        .json({ message: "Bu restoranning kassa malumotlari topilmadi" });
    }

    res.json(
      findKassa.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

exports.getKassaById = async (req, res) => {
  try {
    const { id } = req.params;
    const findKassa = await KassaModel.findById(id);
    if (!findKassa) {
      return res
        .status(400)
        .json({ message: "Bunday kassa malumoti topilmadi" });
    }
    res.json(findKassa);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};
exports.allDelete = async (req, res) => {
  try {
    const findKassa = await KassaModel.find();
    for (let i = 0; i < findKassa.length; i++) {
      await KassaModel.findByIdAndDelete(findKassa[i]._id);
    }
    res.json(findKassa);
  } catch (error) {
    res.json({ message: error.message });
  }
};
