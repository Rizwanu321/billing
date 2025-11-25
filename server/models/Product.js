// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: function (v) {
          return v !== null && !isNaN(v);
        },
        message: "Stock must be a valid number",
      },
    },
    unit: {
      type: String,
      required: [true, "Unit of measurement is required"],
      enum: ["piece", "kg", "gram", "liter", "ml", "packet", "box", "dozen"],
      default: "piece",
    },
    minQuantity: {
      type: Number,
      default: 0.01,
      min: [0.01, "Minimum quantity cannot be less than 0.01"],
    },
    isStockRequired: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Pre-save middleware for additional validation
productSchema.pre("save", function (next) {
  // Ensure stock is a valid number
  if (typeof this.stock !== "number" || isNaN(this.stock)) {
    this.stock = 0;
  }

  // Ensure stock is not negative
  this.stock = Math.max(0, this.stock);

  next();
});

module.exports = mongoose.model("Product", productSchema);
