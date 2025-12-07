// models/Settings.js
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR"],
    },
    businessName: {
      type: String,
      default: "",
    },
    businessAddress: {
      type: String,
      default: "",
    },
    businessPhone: {
      type: String,
      default: "",
    },
    alertSettings: {
      lowStockThreshold: {
        type: Number,
        default: 10,
        min: 0
      },
      criticalStockThreshold: {
        type: Number,
        default: 5,
        min: 0
      },
      emailNotifications: {
        type: Boolean,
        default: false
      },
      smsNotifications: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
