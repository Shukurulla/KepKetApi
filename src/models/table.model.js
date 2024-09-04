const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  tableNumber: {
    //Stol raqami
    type: Number,
    required: true,
  },
  capacity: {
    // Nechta orindiq mavjudligi
    type: Number,
    required: true,
  },
  restaurantId: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Table", tableSchema);
