const mongoose = require("mongoose");
const WaiterSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    imageWaiter: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 5,
    },
    atWork: {
      type: Boolean,
      default: true,
    },
    ratings: {
      type: Object,
    },
    numberOfService: {
      type: Object,
    },

    notification: {
      type: Object,
      default: [],
    },
    restaurantId: {
      type: String,
      required: true,
    },
    busy: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Waiter", WaiterSchema);
