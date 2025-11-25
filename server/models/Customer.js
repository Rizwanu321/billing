// models/Customer.js - UPDATED
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  place: { type: String, required: true },
  // amountDue now supports POSITIVE and NEGATIVE values:
  // Positive: Customer owes you money (needs to pay)
  // Negative: Advance payment/overpayment (you owe customer in goods/services)
  // Zero: All settled
  amountDue: { type: Number, required: true, default: 0 },
  totalPurchases: { type: Number, default: 0 }, // Total purchase amount
  totalPayments: { type: Number, default: 0 }, // Total payments made
  lastTransactionDate: { type: Date }, // Last transaction date
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add index for better query performance
customerSchema.index({ createdBy: 1, phoneNumber: 1 });
customerSchema.index({ createdBy: 1, amountDue: -1 });

module.exports = mongoose.model("Customer", customerSchema);
