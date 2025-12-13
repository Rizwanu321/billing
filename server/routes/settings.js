// routes/settings.js
const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const auth = require("../middleware/auth");

// Get current settings
router.get("/", auth, async (req, res) => {
  try {
    const settings = await Settings.findOne({ user: req.user.userId });

    if (!settings) {
      // Create default settings if not exists
      const defaultSettings = new Settings({
        user: req.user.userId,
        taxEnabled: false,
        taxRate: 10,
        currency: "USD",
        businessName: "",
        businessAddress: "",
        businessPhone: "",
      });
      await defaultSettings.save();
      return res.json(defaultSettings);
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings" });
  }
});

// Update settings
router.post("/", auth, async (req, res) => {
  try {
    const { taxEnabled, taxRate, currency, businessName, businessAddress, businessPhone } =
      req.body;

    let settings = await Settings.findOne({ user: req.user.userId });

    if (!settings) {
      settings = new Settings({
        user: req.user.userId,
        taxEnabled,
        taxRate,
        currency,
        businessName,
        businessAddress,
        businessPhone,
      });
    } else {
      settings.taxEnabled = taxEnabled;
      settings.taxRate = taxRate;
      settings.currency = currency;
      settings.businessName = businessName;
      settings.businessAddress = businessAddress;
      settings.businessPhone = businessPhone;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error saving settings" });
  }
});

module.exports = router;
