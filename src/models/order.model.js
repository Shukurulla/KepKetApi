const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: String,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: { type: Object, required: true },
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
    waiter: { type: Object, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
