const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    brand: {
      type: String,
      required: true,
    },
    password: {
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
    restaurantLogo: {
      type: String,
      default:
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.logodesign.net%2Flogos%2Ftext&psig=AOvVaw2n28FnvLmAfR87qW79pEpX&ust=1725803179656000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCOik9oD8sIgDFQAAAAAdAAAAABAE",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
