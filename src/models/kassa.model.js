const mongoose = require("mongoose");

const kassaSchema = new mongoose.Schema(
  {
    table: {
      number: {
        type: String,
        required: true,
      },
      id: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
    },
    waiter: {
      name: {
        type: String,
        required: true,
      },
      id: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
    },
    meals: {
      type: Object,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    forWaiter: {
      type: Number,
      requried: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const KassaModel = mongoose.model("kassa", kassaSchema);

module.exports = KassaModel;
