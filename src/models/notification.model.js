const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    table: {
      type: Object,
      required: true,
    },
    waiter: {
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
    meals: {
      type: Object,
      required: true,
    },
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
