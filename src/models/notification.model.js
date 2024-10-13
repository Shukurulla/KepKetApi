const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    table: {
      type: Object,
      required: true,
    },
    waiter: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    meals: [
      {
        foodImage: {
          type: String,
          required: true,
        },
        foodId: {
          type: mongoose.Types.ObjectId,
          required: true,
        },
        foodPrice: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        foodName: {
          type: String,
          required: true,
        },
        mealId: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      default: "Pending",
    },
    restaurantId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
