// routes/stock.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const Settings = require("../models/Settings");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

// Helper function to generate PDF
const generateStockPDF = async (type, products, reportData, res) => {
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=stock-report-${type}-${Date.now()}.pdf`
  );

  doc.pipe(res);

  // Modern Professional Design Constants
  const colors = {
    primary: "#4f46e5", // Indigo 600
    dark: "#1e293b",    // Slate 800
    light: "#f8fafc",   // Slate 50
    text: "#334155",    // Slate 700
    muted: "#64748b",   // Slate 500
    border: "#cbd5e1",  // Slate 300
    success: "#059669",
    danger: "#dc2626",
    warning: "#d97706",
  };

  const formatMoney = (amount) => "Rs. " + Number(amount).toFixed(2);
  const formatStock = (qty, unit) => Number(qty).toFixed(2).replace(/\.00$/, '') + (unit ? ` ${unit}` : '');

  // Helper: Draw Header
  const drawHeader = (title) => {
    // Top colored bar
    doc.save()
      .fillColor(colors.primary)
      .rect(0, 0, doc.page.width, 10)
      .fill()
      .restore();

    // Title Section
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(24).fillColor(colors.dark).text(title, 50, 50, { align: 'left' });

    // Metadata Section (Right Aligned)
    doc.fontSize(10).font("Helvetica").fillColor(colors.muted);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${date}`, 400, 55, { align: 'right', width: 140 });
    doc.text(`Type: ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 400, 70, { align: 'right', width: 140 });

    // Divider
    doc.moveTo(50, 90).lineTo(545, 90).strokeColor(colors.border).lineWidth(1).stroke();
    doc.y = 100;
  };

  // Helper: Draw Footer with Page Numbers
  const drawFooter = () => {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(colors.muted)
        .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, { align: 'center' });
    }
  };

  // Helper: Check Page Break and Draw Header if needed
  const checkPageBreak = (y) => {
    if (y > 720) {
      doc.addPage();
      return 50;
    }
    return y;
  };

  // HELPER: Draw Table Row with Borders
  const drawTableRow = (y, columns, isHeader = false) => {
    const height = 24;

    // Background
    if (isHeader) {
      doc.rect(50, y, 495, height).fill(colors.dark);
      doc.fillColor(colors.light).font("Helvetica-Bold").fontSize(9);
    } else {
      doc.fillColor(colors.text).font("Helvetica").fontSize(9);
    }

    // Border Rect
    if (!isHeader) {
      doc.rect(50, y, 495, height).strokeColor(colors.border).lineWidth(0.5).stroke();
    }

    // Render Text & Vertical Lines
    let x = 50;
    columns.forEach((col, i) => {
      // Text
      const textX = x + 5; // Left padding
      const textWidth = col.width - 10; // Right padding

      doc.text(col.text, textX, y + 7, { width: textWidth, align: col.align || 'left' });

      // Vertical Line (Separators)
      if (!isHeader && i < columns.length - 1) {
        doc.moveTo(x + col.width, y).lineTo(x + col.width, y + height).strokeColor(colors.border).lineWidth(0.5).stroke();
      }
      // Vertical Line White for Header
      if (isHeader && i < columns.length - 1) {
        doc.moveTo(x + col.width, y + 4).lineTo(x + col.width, y + height - 4).strokeColor(colors.muted).lineWidth(0.5).stroke();
      }

      x += col.width;
    });
  };

  // 1. Draw Title
  let title = "Stock Report";
  if (type === 'summary') title = "Stock Summary";
  if (type === 'movement') title = "Movement Analysis";
  if (type === 'valuation') title = "Inventory Valuation";
  if (type === 'lowstock') title = "Low Stock Alerts";

  drawHeader(title);

  // 2. Summary Cards (Top of first page)
  let y = doc.y + 10;
  if (type !== 'movement') {
    const drawStatBox = (x, label, value, color) => {
      doc.roundedRect(x, y, 110, 50, 4).lineWidth(1).strokeColor(colors.border).stroke();
      doc.fillColor(colors.muted).fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), x + 10, y + 10);
      doc.fillColor(color).font("Helvetica-Bold").fontSize(13).text(value, x + 10, y + 25);
    };

    drawStatBox(50, "Total Products", reportData.totalProducts, colors.primary);
    drawStatBox(175, "Total Value", formatMoney(reportData.totalValue), colors.success);
    drawStatBox(300, "Low Stock", reportData.lowStockCount, colors.warning);
    drawStatBox(425, "Out of Stock", reportData.outOfStockCount, colors.danger);
    y += 70;
  }

  // 3. Render Table based on type
  if (type === 'summary' || type === 'valuation') {
    const headers = [
      { text: "Product Name", width: 140 },
      { text: "Category", width: 90 },
      { text: "Stock", width: 65, align: 'center' },
      { text: "Price", width: 80, align: 'right' },
      { text: "Total Value", width: 120, align: 'right' }
    ];

    y = checkPageBreak(y);
    drawTableRow(y, headers, true);
    y += 24;

    let zebra = false;
    products.forEach((p) => {
      y = checkPageBreak(y);
      if (y === 50) { drawTableRow(y, headers, true); y += 24; }

      if (zebra) doc.rect(50, y, 495, 24).fill(colors.light);
      zebra = !zebra;

      const cols = [
        { text: p.name, width: 140 },
        { text: p.category?.name || "-", width: 90 },
        { text: formatStock(p.stock, p.unit), width: 65, align: 'center' },
        { text: formatMoney(p.price), width: 80, align: 'right' },
        { text: formatMoney(p.stock * p.price), width: 120, align: 'right' }
      ];
      drawTableRow(y, cols, false);
      y += 24;
    });

  } else if (type === 'lowstock') {
    const headers = [
      { text: "Product Name", width: 150 },
      { text: "Category", width: 90 },
      { text: "Status", width: 80, align: 'center' },
      { text: "Stock", width: 75, align: 'center' },
      { text: "Value", width: 100, align: 'right' }
    ];

    y = checkPageBreak(y);
    drawTableRow(y, headers, true);
    y += 24;

    const lowStockProducts = products.filter(p => p.isStockRequired && p.stock <= 10)
      .sort((a, b) => a.stock - b.stock);

    if (lowStockProducts.length === 0) {
      doc.moveDown().text("No low stock alerts found.", { align: 'center' });
    }

    let zebra = false;
    lowStockProducts.forEach((p) => {
      y = checkPageBreak(y);
      if (y === 50) { drawTableRow(y, headers, true); y += 24; }

      if (zebra) doc.rect(50, y, 495, 24).fill(colors.light);
      zebra = !zebra;

      const status = p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Critical" : "Low";

      doc.fillColor(colors.text).font("Helvetica").fontSize(9);

      if (!zebra) doc.rect(50, y, 495, 24).strokeColor(colors.border).lineWidth(0.5).stroke();
      else doc.rect(50, y, 495, 24).strokeColor(colors.border).lineWidth(0.5).stroke();

      doc.fillColor(colors.text).text(p.name, 55, y + 7, { width: 140 });
      doc.text(p.category?.name || "-", 205, y + 7, { width: 80 });

      if (status === "Out of Stock") doc.fillColor(colors.danger).font("Helvetica-Bold");
      else if (status === "Critical") doc.fillColor(colors.danger).font("Helvetica-Bold");
      else doc.fillColor(colors.warning).font("Helvetica-Bold");
      doc.text(status, 290, y + 7, { width: 80, align: 'center' });

      doc.fillColor(colors.text).font("Helvetica-Bold");
      doc.text(formatStock(p.stock, p.unit), 370, y + 7, { width: 75, align: 'center' });

      doc.fillColor(colors.text).font("Helvetica");
      doc.text(formatMoney(p.stock * p.price), 445, y + 7, { width: 90, align: 'right' });

      [200, 290, 370, 445].forEach(lx => {
        doc.moveTo(50 + (lx - 50), y).lineTo(50 + (lx - 50), y + 24).strokeColor(colors.border).stroke();
      });

      y += 24;
    });
  } else if (type === 'movement') {
    const headers = [
      { text: "Product", width: 155 },
      { text: "Added", width: 80, align: 'center' },
      { text: "Removed", width: 80, align: 'center' },
      { text: "Net Change", width: 90, align: 'center' },
      { text: "Trend", width: 90, align: 'center' }
    ];

    y = checkPageBreak(y);
    drawTableRow(y, headers, true);
    y += 24;

    const movements = reportData.movements || [];
    if (movements.length === 0) doc.moveDown().text("No data.", { align: 'center' });

    let zebra = false;
    movements.forEach(m => {
      y = checkPageBreak(y);
      if (y === 50) { drawTableRow(y, headers, true); y += 24; }

      if (zebra) doc.rect(50, y, 495, 24).fill(colors.light);
      zebra = !zebra;
      doc.rect(50, y, 495, 24).strokeColor(colors.border).lineWidth(0.5).stroke();

      doc.fillColor(colors.text).font("Helvetica").fontSize(9);
      doc.text(m.productName || "Unknown", 55, y + 7, { width: 145 });

      doc.fillColor(colors.success).text("+" + Number(m.totalIn || 0).toFixed(2).replace(/\.00$/, ''), 205, y + 7, { width: 80, align: 'center' });
      doc.fillColor(colors.danger).text("-" + Number(m.totalOut || 0).toFixed(2).replace(/\.00$/, ''), 285, y + 7, { width: 80, align: 'center' });

      const net = m.netChange || 0;
      const netColor = net > 0 ? colors.success : net < 0 ? colors.danger : colors.muted;
      doc.fillColor(netColor).font("Helvetica-Bold").text((net > 0 ? "+" : "") + Number(net).toFixed(2).replace(/\.00$/, ''), 365, y + 7, { width: 90, align: 'center' });

      const trend = net > 0 ? "Rising" : net < 0 ? "Falling" : "-";
      doc.fillColor(colors.muted).font("Helvetica").text(trend, 455, y + 7, { width: 90, align: 'center' });

      [205, 285, 365, 455].forEach(lx => {
        doc.moveTo(lx, y).lineTo(lx, y + 24).strokeColor(colors.border).stroke();
      });

      y += 24;
    });
  }

  drawFooter();
  doc.end();
};

// Get stock analytics
router.get("/analytics", auth, async (req, res) => {
  try {
    const products = await Product.find({
      createdBy: req.user.userId,
    }).populate("category", "name");

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      return sum + product.stock * product.price;
    }, 0);

    const lowStockCount = products.filter(
      (product) =>
        product.isStockRequired && product.stock > 0 && product.stock <= 10
    ).length;

    const outOfStockCount = products.filter(
      (product) => product.isStockRequired && product.stock === 0
    ).length;

    const categoryMap = {};
    products.forEach((product) => {
      const categoryName = product.category?.name || "Uncategorized";
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          name: categoryName,
          value: 0,
          count: 0,
        };
      }
      categoryMap[categoryName].value += product.stock * product.price;
      categoryMap[categoryName].count += 1;
    });

    const stockByCategory = Object.values(categoryMap).map((cat) => ({
      ...cat,
      percentage:
        totalValue > 0 ? ((cat.value / totalValue) * 100).toFixed(2) : 0,
    }));

    const recentMovements = await StockHistory.find({
      user: req.user.userId,
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate({
        path: "product",
        select: "name unit category",
        populate: {
          path: "category",
          select: "name",
        },
      });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const movementData = await StockHistory.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.userId),
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: {
              $cond: [{ $gt: ["$adjustment", 0] }, "additions", "removals"],
            },
          },
          total: { $sum: { $abs: "$adjustment" } },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          additions: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "additions"] }, "$total", 0],
            },
          },
          removals: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "removals"] }, "$total", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const movementTrends = movementData.map((item) => ({
      date: new Date(item._id).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      additions: item.additions,
      removals: item.removals,
    }));

    const allDates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      allDates.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    }

    const filledTrends = allDates.map((date) => {
      const existing = movementTrends.find((item) => item.date === date);
      return existing || { date, additions: 0, removals: 0 };
    });

    res.json({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      recentMovements,
      stockByCategory,
      movementTrends: filledTrends,
    });
  } catch (error) {
    console.error("Error fetching stock analytics:", error);
    res.status(500).json({
      message: "Error fetching stock analytics",
      error: error.message,
    });
  }
});

// Get stock movements
router.get("/movements", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      product,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {
      user: req.user.userId,
    };

    if (type && type !== "all") {
      if (type === "additions") {
        query.type = { $in: ["initial", "addition", "return"] };
      } else if (type === "removals") {
        query.type = { $in: ["removal", "sale"] };
      } else if (type === "adjustments") {
        query.type = { $in: ["addition", "removal"] };
      } else {
        query.type = type;
      }
    }

    if (product) {
      query.product = product;
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      const products = await Product.find({
        name: { $regex: search, $options: "i" },
        createdBy: req.user.userId,
      }).select("_id");

      query.product = { $in: products.map((p) => p._id) };
    }

    const totalCount = await StockHistory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const movements = await StockHistory.find(query)
      .populate({
        path: "product",
        select: "name unit category",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      movements,
      total: totalCount,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching movements:", error);
    res.status(500).json({ message: "Error fetching movements" });
  }
});

// Export movements to CSV
router.get("/movements/export", auth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = { user: req.user.userId };

    if (type && type !== "all") {
      query.type = type;
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const movements = await StockHistory.find(query)
      .populate("product", "name unit")
      .populate("user", "name");

    // Simple CSV generation without external dependencies
    const csvHeader =
      "Date,Product,Type,Adjustment,Unit,Previous Stock,New Stock,Description,User\n";
    const csvRows = movements
      .map(
        (m) =>
          `${new Date(m.timestamp).toLocaleString()},${m.product?.name || ""},${m.type
          },${m.adjustment},${m.unit},${m.previousStock},${m.newStock},"${m.description || ""
          }",${m.user?.name || ""}`
      )
      .join("\n");

    const csv = csvHeader + csvRows;

    res.header("Content-Type", "text/csv");
    res.attachment("stock-movements.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting movements:", error);
    res.status(500).json({ message: "Error exporting movements" });
  }
});

// Get stock alerts
router.get("/alerts", auth, async (req, res) => {
  try {
    const products = await Product.find({
      createdBy: req.user.userId,
      isStockRequired: true,
    }).populate("category", "name");

    // Fetch user settings for dynamic thresholds
    const settings = await Settings.findOne({ user: req.user.userId });
    const lowThreshold = settings?.alertSettings?.lowStockThreshold ?? 10;
    const criticalThreshold = settings?.alertSettings?.criticalStockThreshold ?? 5;

    const alerts = [];

    products.forEach((product) => {
      if (product.stock === 0) {
        alerts.push({
          _id: `out-${product._id}`,
          severity: "critical",
          title: "Out of Stock",
          message: `${product.name} is out of stock`,
          product: product,
          createdAt: new Date(),
        });
      } else if (product.stock <= criticalThreshold) {
        alerts.push({
          _id: `critical-${product._id}`,
          severity: "critical",
          title: "Critical Stock Level",
          message: `${product.name} has only ${Number(product.stock).toFixed(2).replace(/\.00$/, '')} ${product.unit} remaining (Below ${criticalThreshold})`,
          product: product,
          createdAt: new Date(),
        });
      } else if (product.stock <= lowThreshold) {
        alerts.push({
          _id: `low-${product._id}`,
          severity: "warning",
          title: "Low Stock Warning",
          message: `${product.name} stock is low (${Number(product.stock).toFixed(2).replace(/\.00$/, '')} ${product.unit}). Threshold: ${lowThreshold}`,
          product: product,
          createdAt: new Date(),
        });
      }
    });

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Error fetching alerts" });
  }
});

// Get stock report data
router.get("/reports/data", auth, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const products = await Product.find({
      createdBy: req.user.userId,
    }).populate("category", "name");

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const lowStockCount = products.filter(
      (p) => p.isStockRequired && p.stock > 0 && p.stock <= 10
    ).length;
    const outOfStockCount = products.filter(
      (p) => p.isStockRequired && p.stock === 0
    ).length;

    let reportData = {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };

    // Add type-specific data
    switch (type) {
      case "summary":
        // Add products array for summary report
        reportData.products = products.map((p) => ({
          name: p.name,
          category: p.category?.name || "Uncategorized",
          stock: p.stock,
          unit: p.unit,
          price: p.price,
          totalValue: p.stock * p.price,
        }));
        break;

      case "movement":
        // Get movement summary
        const dateFilter = {};
        if (startDate && endDate) {
          dateFilter.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }

        const movementSummary = await StockHistory.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(req.user.userId),
              ...dateFilter,
            },
          },
          {
            $group: {
              _id: "$product",
              totalIn: {
                $sum: {
                  $cond: [{ $gt: ["$adjustment", 0] }, "$adjustment", 0],
                },
              },
              totalOut: {
                $sum: {
                  $cond: [
                    { $lt: ["$adjustment", 0] },
                    { $abs: "$adjustment" },
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "productInfo",
            },
          },
          {
            $project: {
              productName: { $arrayElemAt: ["$productInfo.name", 0] },
              totalIn: 1,
              totalOut: 1,
              netChange: { $subtract: ["$totalIn", "$totalOut"] },
            },
          },
        ]);

        reportData.movements = movementSummary;
        break;

      case "lowstock":
        reportData.lowStockProducts = products
          .filter((p) => p.isStockRequired && p.stock <= 10)
          .map((p) => ({
            name: p.name,
            category: p.category?.name || "Uncategorized",
            currentStock: p.stock,
            unit: p.unit,
            value: p.stock * p.price,
          }))
          .sort((a, b) => a.currentStock - b.currentStock);
        break;

      case "valuation":
        // Group by category for valuation report
        const categoryMap = {};
        products.forEach((product) => {
          const categoryName = product.category?.name || "Uncategorized";
          if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = {
              name: categoryName,
              products: [],
              totalValue: 0,
              totalItems: 0,
            };
          }
          const value = product.stock * product.price;
          categoryMap[categoryName].products.push({
            name: product.name,
            stock: product.stock,
            unit: product.unit,
            price: product.price,
            value: value,
          });
          categoryMap[categoryName].totalValue += value;
          categoryMap[categoryName].totalItems += 1;
        });

        reportData.categoryValuation = Object.values(categoryMap);
        break;
    }

    res.json(reportData);
  } catch (error) {
    console.error("Error generating report data:", error);
    res.status(500).json({ message: "Error generating report data" });
  }
});

// Generate stock report (PDF/CSV) - COMPLETE ROUTE
router.get("/reports/generate", auth, async (req, res) => {
  try {
    const { type, format, startDate, endDate } = req.query;

    // Validate format
    if (!["pdf", "csv", "excel"].includes(format)) {
      return res.status(400).json({ message: "Invalid format specified" });
    }

    // Fetch products
    const products = await Product.find({
      createdBy: req.user.userId,
    }).populate("category", "name");

    // Prepare report data
    const reportData = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + p.stock * p.price, 0),
      lowStockCount: products.filter(
        (p) => p.isStockRequired && p.stock > 0 && p.stock <= 10
      ).length,
      outOfStockCount: products.filter(
        (p) => p.isStockRequired && p.stock === 0
      ).length,
    };

    // Add movement data if needed
    if (type === "movement") {
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const movementSummary = await StockHistory.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user.userId),
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: "$product",
            totalIn: {
              $sum: {
                $cond: [{ $gt: ["$adjustment", 0] }, "$adjustment", 0],
              },
            },
            totalOut: {
              $sum: {
                $cond: [
                  { $lt: ["$adjustment", 0] },
                  { $abs: "$adjustment" },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $project: {
            productName: { $arrayElemAt: ["$productInfo.name", 0] },
            totalIn: 1,
            totalOut: 1,
            netChange: { $subtract: ["$totalIn", "$totalOut"] },
          },
        },
      ]);

      reportData.movements = movementSummary;
    }

    // Generate report based on format
    if (format === "pdf") {
      // Call PDF generation function
      await generateStockPDF(type, products, reportData, res);
      // Note: generateStockPDF handles the response, so we don't send another response
    } else if (format === "csv") {
      // CSV generation
      let csv = "";

      switch (type) {
        case "summary":
          csv = "Product Name,Category,Stock,Unit,Price,Total Value\n";
          csv += products
            .map(
              (p) =>
                `"${p.name}","${p.category?.name || "Uncategorized"}",${p.stock
                },"${p.unit}",${p.price},${p.stock * p.price}`
            )
            .join("\n");
          break;

        case "lowstock":
          const lowStockProducts = products.filter(
            (p) => p.isStockRequired && p.stock <= 10
          );
          csv = "Product Name,Category,Current Stock,Unit,Status,Value\n";
          csv += lowStockProducts
            .map((p) => {
              const status = p.stock === 0 ? "Out of Stock" : "Low Stock";
              return `"${p.name}","${p.category?.name || "Uncategorized"}",${p.stock
                },"${p.unit}","${status}",${p.stock * p.price}`;
            })
            .join("\n");
          break;

        case "valuation":
          csv = "Product Name,Category,Stock,Unit,Unit Price,Total Value\n";
          csv += products
            .map(
              (p) =>
                `"${p.name}","${p.category?.name || "Uncategorized"}",${p.stock
                },"${p.unit}",${p.price},${p.stock * p.price}`
            )
            .join("\n");
          break;

        case "movement":
          csv = "Product Name,Total In,Total Out,Net Change\n";
          if (reportData.movements) {
            csv += reportData.movements
              .map(
                (m) =>
                  `"${m.productName || "Unknown"}",${m.totalIn || 0},${m.totalOut || 0
                  },${m.netChange || 0}`
              )
              .join("\n");
          }
          break;

        default:
          csv = "Product Name,Category,Stock,Unit,Price,Total Value\n";
          csv += products
            .map(
              (p) =>
                `"${p.name}","${p.category?.name || "Uncategorized"}",${p.stock
                },"${p.unit}",${p.price},${p.stock * p.price}`
            )
            .join("\n");
      }

      res.header("Content-Type", "text/csv");
      res.attachment(`stock-report-${type}-${Date.now()}.csv`);
      res.send(csv);
    } else if (format === "excel") {
      // Excel format not implemented yet
      res.status(400).json({
        message: "Excel format not yet implemented. Please use PDF or CSV.",
      });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      message: "Error generating report",
      error: error.message,
    });
  }
});

// Get alert settings
router.get("/alerts/settings", auth, async (req, res) => {
  try {
    const settings = await Settings.findOne({ user: req.user.userId });
    res.json(settings?.alertSettings || {
      lowStockThreshold: 10,
      criticalStockThreshold: 5,
      emailNotifications: false,
      smsNotifications: false
    });
  } catch (error) {
    console.error("Error fetching alert settings:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
});

// Update alert settings
router.put("/alerts/settings", auth, async (req, res) => {
  try {
    const {
      lowStockThreshold,
      criticalStockThreshold,
      emailNotifications,
      smsNotifications,
    } = req.body;

    let settings = await Settings.findOne({ user: req.user.userId });

    if (!settings) {
      // Create new settings if not exist
      settings = new Settings({ user: req.user.userId });
    }

    settings.alertSettings = {
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      criticalStockThreshold: parseInt(criticalStockThreshold) || 5,
      emailNotifications: !!emailNotifications,
      smsNotifications: !!smsNotifications
    };

    await settings.save();

    res.json({
      message: "Settings updated successfully",
      settings: settings.alertSettings,
    });
  } catch (error) {
    console.error("Error updating alert settings:", error);
    res.status(500).json({ message: "Error updating settings" });
  }
});

// Batch stock adjustment
router.post("/batch-adjustment", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      adjustments,
      reason,
      type: adjustmentType,
      reference,
      // Customer return specific fields
      customer,
      invoice,
      returnTotal,
      returnTax,
      returnSubtotal,
      refundMethod // NEW: How the refund was given (cash, card, online, other)
    } = req.body;

    if (
      !adjustments ||
      !Array.isArray(adjustments) ||
      adjustments.length === 0
    ) {
      return res.status(400).json({ message: "No adjustments provided" });
    }

    // ======= WALK-IN CUSTOMER RETURN VALIDATION =======
    // If it's a customer return WITHOUT customer link but WITH invoice reference,
    // validate products against the invoice (walk-in customer scenario)
    if (adjustmentType === "return_from_customer" && !customer && reference) {
      const Invoice = require("../models/Invoice");

      // Find invoice by reference number
      const invoiceDoc = await Invoice.findOne({
        invoiceNumber: reference,
        createdBy: req.user.userId
      }).populate('items.product');

      if (!invoiceDoc) {
        return res.status(404).json({
          message: `Invoice ${reference} not found`
        });
      }

      // CRITICAL: Prevent using a registered customer's invoice in walk-in flow
      // If invoice has a customer ID, it means it belongs to a registered customer
      if (invoiceDoc.customer && invoiceDoc.customer._id) {
        return res.status(400).json({
          message: `Invoice ${reference} belongs to registered customer "${invoiceDoc.customer.name}". Please use the "Link to Customer" option to ensure their account is credited correctly.`
        });
      }

      // Validate each product against the invoice
      for (const adjustment of adjustments) {
        const { productId, quantity } = adjustment;

        // Find the product in the invoice items
        const invoiceItem = invoiceDoc.items.find(
          item => item.product._id.toString() === productId.toString()
        );

        if (!invoiceItem) {
          // Get product name for better error message
          const product = await Product.findById(productId);
          return res.status(400).json({
            message: `Product "${product?.name || 'Unknown'}" was not found in invoice ${reference}`
          });
        }

        // Check if return quantity exceeds invoice quantity
        if (quantity > invoiceItem.quantity) {
          const product = await Product.findById(productId);
          return res.status(400).json({
            message: `Cannot return ${quantity} ${invoiceItem.unit} of "${product?.name || 'Unknown'}". Invoice ${reference} only had ${invoiceItem.quantity} ${invoiceItem.unit}.`
          });
        }
      }

      // Validation passed - invoice reference is valid for walk-in return
      console.log(`Walk-in customer return validated against invoice ${reference}`);
    }

    // ======= CUSTOMER RETURN VALIDATION =======
    // If it's a linked customer return, ensure the invoice (if provided) belongs to them
    if (adjustmentType === "return_from_customer" && customer && invoice) {
      // We need to verify this invoice belongs to the selected customer
      // The invoice ID is passed in req.body.invoice._id
      if (invoice._id) {
        const Invoice = require("../models/Invoice");
        const linkedInvoice = await Invoice.findById(invoice._id);

        if (linkedInvoice) {
          // Case 1: Invoice belongs to a DIFFERENT registered customer
          if (linkedInvoice.customer && linkedInvoice.customer._id && linkedInvoice.customer._id.toString() !== customer._id.toString()) {
            return res.status(400).json({
              message: `Invoice ${linkedInvoice.invoiceNumber} belongs to customer "${linkedInvoice.customer.name}", not "${customer.name}". Please select an invoice belonging to the selected customer.`
            });
          }

          // Case 2: Invoice is a Walk-in invoice (no customer ID) but user is trying to link it to a Registered Customer
          // This is the "normal customer invoice input on due customer" scenario
          if ((!linkedInvoice.customer || !linkedInvoice.customer._id)) {
            return res.status(400).json({
              message: `Invoice ${linkedInvoice.invoiceNumber} is a walk-in invoice and cannot be linked to customer "${customer.name}". Please select a valid invoice for this customer.`
            });
          }
        }
      }
    }

    const results = [];

    // Pre-validate customer returns against invoice
    let targetInvoice = null;
    if (adjustmentType === "return_from_customer" && reference) {
      const Invoice = require("../models/Invoice");
      targetInvoice = await Invoice.findOne({
        invoiceNumber: reference,
        createdBy: req.user.userId,
      }).session(session);

      if (!targetInvoice) {
        throw new Error(`Invoice ${reference} not found`);
      }

      // Validate each item in the return
      for (const adjustment of adjustments) {
        const invoiceItem = targetInvoice.items.find(
          (item) => item.product.toString() === adjustment.productId
        );

        if (!invoiceItem) {
          throw new Error(
            `Product not found in invoice ${reference}. Cannot return item that was not purchased.`
          );
        }

        const currentReturnQty = Number(adjustment.quantity);
        const alreadyReturned = invoiceItem.returnedQuantity || 0;
        const originalQty = invoiceItem.quantity;

        if (currentReturnQty + alreadyReturned > originalQty) {
          throw new Error(
            `Cannot return ${currentReturnQty} of ${invoiceItem.product.name || 'item'}. ` +
            `Purchased: ${originalQty}, Already Returned: ${alreadyReturned}. ` +
            `Max returnable: ${originalQty - alreadyReturned}`
          );
        }
      }
    }

    // Resolve invoice ID for linking returns to original invoices (crucial for tax calculation)
    let resolvedInvoiceId = null;
    if (invoice && invoice._id) {
      resolvedInvoiceId = invoice._id;
    } else if (reference && adjustmentType === "return_from_customer") {
      // Try to find invoice by reference number for walk-in returns
      const Invoice = require("../models/Invoice");
      const invoiceDoc = await Invoice.findOne({
        invoiceNumber: reference,
        createdBy: req.user.userId
      });
      if (invoiceDoc) {
        resolvedInvoiceId = invoiceDoc._id;
      }
    }

    for (const adjustment of adjustments) {
      const {
        productId,
        type,
        quantity,
        adjustmentType: itemType,
      } = adjustment;

      // Find product
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Calculate adjustment value
      const adjustmentValue =
        type === "remove" ? -Math.abs(quantity) : Math.abs(quantity);

      // Check if removing more than available
      if (type === "remove" && Math.abs(adjustmentValue) > product.stock) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock} ${product.unit}`
        );
      }

      const previousStock = product.stock;
      const newStock = product.stock + adjustmentValue;

      // Update product stock
      product.stock = newStock;
      await product.save({ session });

      // Map adjustment types to stock history types
      const stockHistoryType = mapAdjustmentTypeToHistoryType(
        itemType || adjustmentType
      );

      // Create stock history record with proper categorization
      const stockHistory = new StockHistory({
        product: product._id,
        adjustment: adjustmentValue,
        unit: product.unit,
        previousStock: previousStock,
        newStock: newStock,
        user: req.user.userId,
        type: stockHistoryType,
        adjustmentType: itemType || adjustmentType,
        reason: reason,
        reference: reference,
        invoiceId: resolvedInvoiceId, // Link to invoice for tax calculation
        refundMethod: (adjustmentType === "return_from_customer" && refundMethod) ? refundMethod : null, // Track refund method
        description: generateDescription(
          itemType || adjustmentType,
          Math.abs(adjustmentValue),
          product.unit,
          reason
        ),
        timestamp: new Date(),
      });

      await stockHistory.save({ session });

      results.push({
        product: product.name,
        previousStock: previousStock,
        adjustment: adjustmentValue,
        newStock: newStock,
        unit: product.unit,
      });
    }

    // Handle customer return transaction if customer is provided
    let customerReturnData = null;
    if (adjustmentType === "return_from_customer" && customer) {
      const Customer = require("../models/Customer");
      const Transaction = require("../models/Transaction");

      // Find customer
      const customerDoc = await Customer.findOne({
        _id: customer._id,
        createdBy: req.user.userId,
      }).session(session);

      if (!customerDoc) {
        throw new Error("Customer not found");
      }

      const returnAmount = returnTotal || 0;
      const currentDue = customerDoc.amountDue || 0;

      // Calculate new due (return reduces the due amount)
      const newDue = currentDue - returnAmount;

      // Create return transaction
      const returnTransaction = new Transaction({
        customerId: customer._id,
        type: "payment", // Return is treated as a payment/credit
        amount: returnAmount,
        date: new Date(),
        invoiceId: invoice?._id || null,
        invoiceNumber: invoice?.invoiceNumber || null,
        balanceBefore: currentDue,
        balanceAfter: newDue,
        paymentMode: "return",
        reference: reference,
        description: `Product return - ${reason}${invoice ? ` (Invoice: ${invoice.invoiceNumber})` : ""}${returnTax > 0 ? ` [Tax: ₹${returnTax.toFixed(2)}]` : ""}`,
        createdBy: req.user.userId,
      });
      await returnTransaction.save({ session });

      // Update customer
      customerDoc.amountDue = newDue;
      customerDoc.totalPayments = (customerDoc.totalPayments || 0) + returnAmount;
      customerDoc.lastTransactionDate = new Date();
      await customerDoc.save({ session });

      // Update invoice if linked
      if (invoice && invoice._id) {
        const Invoice = require("../models/Invoice");
        const invoiceDoc = await Invoice.findById(invoice._id).session(session);

        if (invoiceDoc && invoiceDoc.dueAmount > 0) {
          const paymentForInvoice = Math.min(returnAmount, invoiceDoc.dueAmount);
          invoiceDoc.dueAmount = Math.max(0, invoiceDoc.dueAmount - paymentForInvoice);

          if (invoiceDoc.dueAmount === 0) {
            invoiceDoc.status = "paid";
          }

          // Update returnedQuantity for items
          if (adjustmentType === "return_from_customer") {
            for (const adjustment of adjustments) {
              const itemIndex = invoiceDoc.items.findIndex(
                item => item.product.toString() === adjustment.productId
              );
              if (itemIndex !== -1) {
                invoiceDoc.items[itemIndex].returnedQuantity =
                  (invoiceDoc.items[itemIndex].returnedQuantity || 0) + Number(adjustment.quantity);
              }
            }
          }

          await invoiceDoc.save({ session });
        } else if (invoiceDoc) {
          // Even if dueAmount is 0 (fully paid), we still need to update returnedQuantity
          if (adjustmentType === "return_from_customer") {
            for (const adjustment of adjustments) {
              const itemIndex = invoiceDoc.items.findIndex(
                item => item.product.toString() === adjustment.productId
              );
              if (itemIndex !== -1) {
                invoiceDoc.items[itemIndex].returnedQuantity =
                  (invoiceDoc.items[itemIndex].returnedQuantity || 0) + Number(adjustment.quantity);
              }
            }
            await invoiceDoc.save({ session });
          }
        }
      } else {
        // Case: Return linked to customer but NOT to a specific invoice
        // Auto-apply return amount to oldest open invoices (FIFO)
        const Invoice = require("../models/Invoice");
        const openInvoices = await Invoice.find({
          customer: customer._id,
          dueAmount: { $gt: 0 },
          status: { $ne: "cancelled" }
        }).sort({ date: 1 }).session(session);

        let remainingReturn = returnAmount;
        for (const openInv of openInvoices) {
          if (remainingReturn <= 0) break;

          const paymentForInvoice = Math.min(remainingReturn, openInv.dueAmount);
          openInv.dueAmount = Math.max(0, openInv.dueAmount - paymentForInvoice);
          remainingReturn -= paymentForInvoice;

          if (openInv.dueAmount === 0) {
            openInv.status = "paid";
          }
          await openInv.save({ session });
        }
      }

      customerReturnData = {
        customer: {
          _id: customerDoc._id,
          name: customerDoc.name,
          previousDue: currentDue,
          newDue: newDue,
        },
        transaction: returnTransaction,
        invoice: invoice ? {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
        } : null,
        returnAmount: returnAmount,
        returnTax: returnTax || 0,
        returnSubtotal: returnSubtotal || 0,
      };
    }

    // Handle walk-in customer returns (no customer link) - Update returnedQuantity
    if (adjustmentType === "return_from_customer" && !customer && reference) {
      const Invoice = require("../models/Invoice");
      const walkInInvoice = await Invoice.findOne({
        invoiceNumber: reference,
        createdBy: req.user.userId,
      }).session(session);

      if (walkInInvoice) {
        // Update returnedQuantity for each returned item
        for (const adjustment of adjustments) {
          const itemIndex = walkInInvoice.items.findIndex(
            item => item.product.toString() === adjustment.productId
          );
          if (itemIndex !== -1) {
            walkInInvoice.items[itemIndex].returnedQuantity =
              (walkInInvoice.items[itemIndex].returnedQuantity || 0) + Number(adjustment.quantity);
          }
        }
        await walkInInvoice.save({ session });
      }
    }

    await session.commitTransaction();

    res.json({
      message: "Stock adjustments completed successfully",
      results,
      summary: {
        totalProducts: results.length,
        adjustmentType: adjustmentType,
        reference: reference,
      },
      customerReturn: customerReturnData,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Batch adjustment error:", error);
    res.status(400).json({
      message: error.message || "Error processing adjustments",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Helper function to map adjustment types to stock history types
function mapAdjustmentTypeToHistoryType(adjustmentType) {
  const typeMapping = {
    // Additions
    purchase: "addition",
    return_from_customer: "return",
    production: "addition",
    found: "addition",
    adjustment_positive: "adjustment",

    // Removals
    damaged: "removal",
    expired: "removal",
    lost: "removal",
    theft: "removal",
    return_to_supplier: "removal",
    quality_issue: "removal",
    adjustment_negative: "adjustment",
  };

  return typeMapping[adjustmentType] || "adjustment";
}

// Helper function to generate descriptive text
function generateDescription(type, quantity, unit, reason) {
  const descriptions = {
    purchase: `Purchased ${quantity} ${unit} - ${reason}`,
    return_from_customer: `Customer returned ${quantity} ${unit} - ${reason}`,
    production: `Produced ${quantity} ${unit} - ${reason}`,
    found: `Found ${quantity} ${unit} - ${reason}`,
    adjustment_positive: `Adjusted +${quantity} ${unit} - ${reason}`,
    damaged: `Removed ${quantity} ${unit} (damaged) - ${reason}`,
    expired: `Removed ${quantity} ${unit} (expired) - ${reason}`,
    lost: `Lost ${quantity} ${unit} - ${reason}`,
    theft: `Theft reported: ${quantity} ${unit} - ${reason}`,
    return_to_supplier: `Returned ${quantity} ${unit} to supplier - ${reason}`,
    quality_issue: `Removed ${quantity} ${unit} (quality issue) - ${reason}`,
    adjustment_negative: `Adjusted -${quantity} ${unit} - ${reason}`,
  };

  return (
    descriptions[type] ||
    `Stock ${quantity > 0 ? "added" : "removed"}: ${Math.abs(
      quantity
    )} ${unit} - ${reason}`
  );
}
router.get("/summary/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      createdBy: req.user.userId,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get movement summary
    const movementSummary = await StockHistory.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(req.params.productId),
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalQuantity: { $sum: { $abs: "$adjustment" } },
        },
      },
    ]);

    // Get recent movements
    const recentMovements = await StockHistory.find({
      product: req.params.productId,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("user", "name");

    // Calculate statistics
    const stats = {
      currentStock: product.stock,
      totalAdded: movementSummary
        .filter((m) => ["initial", "addition", "return"].includes(m._id))
        .reduce((sum, m) => sum + m.totalQuantity, 0),
      totalRemoved: movementSummary
        .filter((m) => ["removal", "sale"].includes(m._id))
        .reduce((sum, m) => sum + m.totalQuantity, 0),
      totalSales:
        movementSummary.find((m) => m._id === "sale")?.totalQuantity || 0,
      totalReturns:
        movementSummary.find((m) => m._id === "return")?.totalQuantity || 0,
      movementsByType: movementSummary,
    };

    res.json({
      product: {
        id: product._id,
        name: product.name,
        category: product.category?.name || "Uncategorized",
        unit: product.unit,
        currentStock: product.stock,
        value: product.stock * product.price,
        isStockRequired: product.isStockRequired,
      },
      stats,
      recentMovements,
    });
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    res.status(500).json({ message: "Error fetching stock summary" });
  }
});

module.exports = router;
