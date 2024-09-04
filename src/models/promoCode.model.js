const mongoose = require("mongoose");

const promoCodeSchema = mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  worked: {
    type: Boolean,
    default: false,
  },
  workedBy: {
    type: mongoose.Types.ObjectId,
  },
  discount: {
    type: Number,
    required: true,
  },
  restaurantId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);
