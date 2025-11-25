// models/StockHistory.js
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const stockHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  adjustment: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ["piece", "kg", "gram", "liter", "ml", "packet", "box", "dozen"],
    default: "piece",
  },
  previousStock: {
    type: Number,
    required: true,
  },
  newStock: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["initial", "addition", "removal", "sale", "return", "adjustment"],
    required: true,
  },
  adjustmentType: {
    type: String,
    enum: [
      // Additions
      "purchase",
      "return_from_customer",
      "production",
      "found",
      "adjustment_positive",
      // Removals
      "damaged",
      "expired",
      "lost",
      "theft",
      "return_to_supplier",
      "quality_issue",
      "adjustment_negative",
      // System
      "sale",
      "initial",
    ],
    default: null,
  },
  reason: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    required: true,
  },
  reference: {
    type: String, // Can be invoice number, PO number, etc.
    default: null,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Add compound indexes for better query performance
stockHistorySchema.index({ product: 1, timestamp: -1 });
stockHistorySchema.index({ user: 1, timestamp: -1 });
stockHistorySchema.index({ type: 1, timestamp: -1 });
stockHistorySchema.index({ adjustmentType: 1, timestamp: -1 });

// Apply the pagination plugin
stockHistorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("StockHistory", stockHistorySchema);

// Index for better query performance
stockHistorySchema.index({ product: 1, timestamp: -1 });
stockHistorySchema.index({ user: 1, timestamp: -1 });
stockHistorySchema.index({ type: 1, timestamp: -1 });

// Apply the pagination plugin
stockHistorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("StockHistory", stockHistorySchema);
