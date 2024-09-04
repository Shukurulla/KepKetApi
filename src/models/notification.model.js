const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    table: {
      type: String,
      required: true,
    },
    waiter: {
      type: String,
      required: true,
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
