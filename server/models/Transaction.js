// models/Transaction.js - UPDATED
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: ["purchase", "payment"], // Simplified: only purchase and payment
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    invoiceNumber: String,
    reference: String,
    description: String,
    // balanceBefore/After now represent amountDue (can be positive or negative)
    balanceBefore: Number,
    balanceAfter: Number,
    paymentMode: {
      type: String,
      enum: ["cash", "online", "card", "return", "other"],
      default: "cash",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ customerId: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
