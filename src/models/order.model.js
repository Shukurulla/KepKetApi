const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: String,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      number: {
        type: Number,
        required: true,
      },
      id: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
    },
    items: [
      {
        dish: { type: Object, ref: "Dish" },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      default: "Pending",
    },
    promoCode: {
      type: String,
    },
    who: {
      type: String,
      default: "Client",
    },
    prepared: {
      type: Object,
      default: [],
    },
    // Hozirgi obyekt o'rniga, waiter faqat ID bo'lishi kerak
    waiter: {
      name: {
        type: String,
      },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    payment: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
