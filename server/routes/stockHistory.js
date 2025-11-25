// routes/stockHistory.js
const express = require("express");
const router = express.Router();
const StockHistory = require("../models/StockHistory");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

router.get("/product/:productId", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "timestamp",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    // Validate product exists and belongs to user
    const product = await Product.findOne({
      _id: req.params.productId,
      createdBy: req.user.userId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const query = {
      product: req.params.productId,
    };

    // Date range filter
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: {
        [sortBy]: sortOrder === "desc" ? -1 : 1,
      },
      populate: {
        path: "user",
        select: "name email",
      },
      lean: true, // For better performance
    };

    const stockHistories = await StockHistory.paginate(query, options);

    // Add product unit to response if not present in history records
    const enhancedHistories = stockHistories.docs.map((history) => {
      if (!history.unit) {
        return {
          ...history,
          unit: product.unit || "piece",
        };
      }
      return history;
    });

    console.log("Stock Histories fetched:", stockHistories);

    res.json({
      stockHistories: enhancedHistories,
      totalPages: stockHistories.totalPages,
      currentPage: stockHistories.page,
      productDetails: {
        name: product.name,
        unit: product.unit || "piece",
        currentStock: product.stock,
        isStockRequired: product.isStockRequired,
      },
    });
  } catch (error) {
    console.error("Stock History Fetch Error:", error);
    res.status(500).json({
      message: "Error fetching stock history",
      error: error.message,
    });
  }
});

// Add a new endpoint to get stock history summary
router.get("/product/:productId/summary", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      createdBy: req.user.userId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get total additions and removals
    const summary = await StockHistory.aggregate([
      { $match: { product: mongoose.Types.ObjectId(req.params.productId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalQuantity: { $sum: { $abs: "$adjustment" } },
        },
      },
    ]);

    // Get recent activity
    const recentActivity = await StockHistory.find({
      product: req.params.productId,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("user", "name")
      .lean();

    res.json({
      summary,
      recentActivity,
      productDetails: {
        name: product.name,
        unit: product.unit || "piece",
        currentStock: product.stock,
        isStockRequired: product.isStockRequired,
      },
    });
  } catch (error) {
    console.error("Stock History Summary Error:", error);
    res.status(500).json({
      message: "Error fetching stock history summary",
      error: error.message,
    });
  }
});

module.exports = router;
