const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    brand: {
      type: String,
      required: true,
    },
    phone: { type: String, required: true },
    cuisine: { type: String },
    openingHours: { type: String },
    owner: { type: String, ref: "User" },
    tables: [
      {
        number: { type: Number },
        capacity: { type: Number },
        restaurantId: {
          type: String,
        },
      },
    ],
    waiters: {
      type: Object,
      default: [],
    },
    categories: {
      type: Object,
      default: [],
    },
    promotions: {
      type: Object,
      default: [],
    },
    socialLink: [
      {
        socialName: {
          type: String,
        },
        link: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
