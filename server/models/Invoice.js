// models/Invoice.js - SIMPLIFIED (No Credit System)
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    customer: {
      name: String,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
      },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required for each item"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required for each item"],
          min: [0.01, "Quantity must be at least 0.01"],
        },
        unit: {
          type: String,
          required: [true, "Unit is required for each item"],
          enum: [
            "piece",
            "kg",
            "gram",
            "liter",
            "ml",
            "packet",
            "box",
            "dozen",
          ],
        },
        price: {
          type: Number,
          required: [true, "Price is required for each item"],
          min: [0, "Price cannot be negative"],
        },
        subtotal: {
          type: Number,
          required: [true, "Subtotal is required for each item"],
          min: [0, "Subtotal cannot be negative"],
        },
      },
    ],
    subtotal: {
      type: Number,
      required: [true, "Invoice subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      required: [true, "Tax amount is required"],
      min: [0, "Tax cannot be negative"],
      default: 0,
    },
    total: {
      type: Number,
      required: [true, "Invoice total is required"],
      min: [0, "Total cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "final", "paid"],
        message: "{VALUE} is not a valid status",
      },
      default: "draft",
    },
    isPrinted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "card", "due", "credit", "mixed"], // Keep 'credit' & 'mixed' for old invoices
      required: true,
      default: "cash",
    },
    dueAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save validation
invoiceSchema.pre("save", function (next) {
  // Validate that total equals subtotal plus tax
  const calculatedTotal = this.subtotal + this.tax;
  if (Math.abs(calculatedTotal - this.total) > 0.01) {
    next(new Error("Invoice total must equal subtotal plus tax"));
    return;
  }

  // Validate that items subtotal matches invoice subtotal
  const itemsSubtotal = this.items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  if (Math.abs(itemsSubtotal - this.subtotal) > 0.01) {
    next(new Error("Invoice subtotal must match sum of item subtotals"));
    return;
  }

  // Update dueAmount based on payment method
  if (this.paymentMethod === "due") {
    this.dueAmount = this.total;
  } else {
    // Cash, online, or card - fully paid
    this.dueAmount = 0;
  }

  next();
});

// Virtual to get readable payment status
invoiceSchema.virtual("paymentStatus").get(function () {
  if (this.status === "draft") return "Draft";
  if (this.dueAmount === 0) return "Paid";
  if (this.dueAmount > 0) return "Due";
  return "Unknown";
});

// Ensure virtuals are included in JSON
invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

// Add index for better query performance
invoiceSchema.index({ createdBy: 1, date: -1 });
invoiceSchema.index({ "customer._id": 1, date: -1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1, paymentMethod: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
