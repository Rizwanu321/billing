// routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const auth = require("../middleware/auth");
const { default: mongoose } = require("mongoose");

router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.user.userId })
      .populate("category", "name description")
      .exec();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = new Product({
      ...req.body,
      createdBy: req.user.userId,
    });
    await product.save({ session });

    // Create stock history entry for initial stock
    if (product.stock > 0) {
      const stockHistory = new StockHistory({
        product: product._id,
        adjustment: product.stock,
        unit: product.unit || "piece",
        previousStock: 0,
        newStock: product.stock,
        user: req.user.userId,
        type: "initial",
        description: `Initial stock entry for ${product.name}`,
        timestamp: new Date(),
      });
      await stockHistory.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(product);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
});

// Update stock adjustment route with better tracking
router.post("/:id/stock", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { adjustment, reason } = req.body;

    // Validate adjustment
    if (adjustment === undefined || adjustment === null) {
      return res.status(400).json({
        message: "Adjustment is required",
        error: "No adjustment value provided",
      });
    }

    const numericAdjustment = Number(adjustment);

    if (isNaN(numericAdjustment)) {
      return res.status(400).json({
        message: "Invalid adjustment",
        error: "Adjustment must be a valid number",
      });
    }

    // Find the product
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const currentStock = Number(product.stock) || 0;
    const newStock = currentStock + numericAdjustment;

    if (newStock < 0) {
      return res.status(400).json({
        message: "Insufficient stock",
        currentStock,
        requestedAdjustment: numericAdjustment,
      });
    }

    // Validate that adjustment is a multiple of minQuantity
    const minQuantity = product.minQuantity || 0.01;
    const epsilon = 0.00001;
    const remainder = Math.abs(numericAdjustment) % minQuantity;
    const isValidMultiple =
      remainder < epsilon || Math.abs(remainder - minQuantity) < epsilon;

    if (!isValidMultiple) {
      return res.status(400).json({
        message: `Adjustment must be a multiple of ${minQuantity}`,
      });
    }

    // Update product
    product.stock = newStock;
    product.updatedAt = Date.now();
    await product.save({ session });

    // Determine type based on context
    let adjustmentType = "adjustment";
    if (numericAdjustment > 0) {
      adjustmentType = "addition";
    } else if (numericAdjustment < 0) {
      adjustmentType = "removal";
    }

    // Create stock history with better description
    const stockHistory = new StockHistory({
      product: product._id,
      adjustment: numericAdjustment,
      unit: product.unit || "piece",
      previousStock: currentStock,
      newStock: newStock,
      user: req.user.userId,
      type: adjustmentType,
      reason: reason || "Manual adjustment",
      description:
        reason ||
        `${adjustmentType === "addition" ? "Added" : "Removed"} ${Math.abs(
          numericAdjustment
        )} ${product.unit || "piece"}${
          Math.abs(numericAdjustment) !== 1 ? "s" : ""
        }`,
      timestamp: new Date(),
    });

    await stockHistory.save({ session });
    await session.commitTransaction();

    res.json({
      message: "Stock updated successfully",
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock,
        unit: product.unit || "piece",
      },
      stockHistory: {
        type: adjustmentType,
        adjustment: numericAdjustment,
        newStock: newStock,
        previousStock: currentStock,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Stock Adjustment Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
