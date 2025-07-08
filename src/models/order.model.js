const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: String,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      number: {
        type: Number,
        required: true,
      },
      id: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
    },
    customerName: {
      type: String,
      default: "Mijoz",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    items: [
      {
        dish: {
          type: Object,
          ref: "Dish",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    promoCode: {
      type: String,
      default: null,
    },
    who: {
      type: String,
      enum: ["Client", "Waiter", "Admin"],
      default: "Client",
    },
    prepared: {
      type: Array,
      default: [],
    },
    waiter: {
      name: {
        type: String,
        default: "",
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Waiter",
      },
    },
    payment: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      default: "cash",
    },
    showOrder: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 20,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better performance
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ "waiter.id": 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for order age in minutes
orderSchema.virtual("ageInMinutes").get(function () {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
});

// Virtual for formatted total price
orderSchema.virtual("formattedTotalPrice").get(function () {
  return new Intl.NumberFormat("uz-UZ").format(this.totalPrice);
});

// Instance method to check if order is overdue
orderSchema.methods.isOverdue = function () {
  const ageInMinutes = this.ageInMinutes;
  return ageInMinutes > this.estimatedTime && this.status !== "completed";
};

// Static method to get orders by waiter
orderSchema.statics.getOrdersByWaiter = function (waiterId) {
  return this.find({ "waiter.id": waiterId }).sort({ createdAt: -1 });
};

// Static method to get active orders for restaurant
orderSchema.statics.getActiveOrdersForRestaurant = function (restaurantId) {
  return this.find({
    restaurantId,
    status: { $in: ["pending", "preparing", "ready"] },
    showOrder: true,
  }).sort({ createdAt: -1 });
};

// Pre-save middleware to update total price
orderSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    let total = 0;
    this.items.forEach((item) => {
      total += (item.dish.price || item.price || 0) * (item.quantity || 1);
    });
    this.totalPrice = total;
  }
  next();
});

// Post-save middleware for logging
orderSchema.post("save", function (doc) {
  console.log(`Order ${doc._id} saved with status: ${doc.status}`);
});

module.exports = mongoose.model("Order", orderSchema);
