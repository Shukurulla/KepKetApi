const mongoose = require("mongoose");

const callSchema = mongoose.Schema({
  table: {
    type: Object,
    required: true,
  },
  waiter: {
    type: Object,
    required: true,
  },
  restaurantId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
});

module.exports = mongoose.model("Call", callSchema);
