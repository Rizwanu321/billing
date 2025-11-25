// routes/stock.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

// Helper function to generate PDF
const generateStockPDF = async (type, products, reportData, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=stock-report-${type}-${Date.now()}.pdf`
  );

  // Pipe the PDF directly to the response
  doc.pipe(res);

  // Add header
  doc.fontSize(20).text("Stock Report", { align: "center" });
  doc
    .fontSize(12)
    .text(`Report Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`, {
      align: "center",
    });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(2);

  switch (type) {
    case "summary":
      // Summary statistics
      doc.fontSize(16).text("Summary Statistics", { underline: true });
      doc.fontSize(12);
      doc.text(`Total Products: ${reportData.totalProducts}`);
      doc.text(`Total Stock Value: ₹${reportData.totalValue.toFixed(2)}`);
      doc.text(`Low Stock Items: ${reportData.lowStockCount}`);
      doc.text(`Out of Stock Items: ${reportData.outOfStockCount}`);
      doc.moveDown(2);

      // Product details table
      doc.fontSize(16).text("Product Details", { underline: true });
      doc.moveDown();

      // Table headers
      const tableTop = doc.y;
      const tableHeaders = [
        "Product Name",
        "Category",
        "Stock",
        "Unit",
        "Price",
        "Total Value",
      ];
      const columnWidths = [150, 100, 60, 50, 70, 80];
      let xPosition = 50;

      doc.fontSize(10).font("Helvetica-Bold");
      tableHeaders.forEach((header, index) => {
        doc.text(header, xPosition, tableTop, {
          width: columnWidths[index],
          align: "left",
        });
        xPosition += columnWidths[index];
      });

      // Draw line under headers
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(50 + columnWidths.reduce((a, b) => a + b, 0), tableTop + 15)
        .stroke();

      // Table rows
      let yPosition = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      products.forEach((product, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        xPosition = 50;
        const rowData = [
          product.name,
          product.category?.name || "Uncategorized",
          product.stock.toString(),
          product.unit,
          `₹${product.price.toFixed(2)}`,
          `₹${(product.stock * product.price).toFixed(2)}`,
        ];

        rowData.forEach((data, colIndex) => {
          doc.text(data, xPosition, yPosition, {
            width: columnWidths[colIndex],
            align: "left",
          });
          xPosition += columnWidths[colIndex];
        });

        yPosition += 20;
      });
      break;

    case "lowstock":
      doc.fontSize(16).text("Low Stock Alert Report", { underline: true });
      doc.moveDown();

      const lowStockProducts = products.filter(
        (p) => p.isStockRequired && p.stock <= 10
      );

      if (lowStockProducts.length === 0) {
        doc
          .fontSize(12)
          .text("No products are currently low on stock.", { align: "center" });
      } else {
        // Group by status
        const outOfStock = lowStockProducts.filter((p) => p.stock === 0);
        const criticalStock = lowStockProducts.filter(
          (p) => p.stock > 0 && p.stock <= 5
        );
        const lowStock = lowStockProducts.filter(
          (p) => p.stock > 5 && p.stock <= 10
        );

        // Out of Stock Section
        if (outOfStock.length > 0) {
          doc
            .fontSize(14)
            .fillColor("red")
            .text("OUT OF STOCK", { underline: true });
          doc.fillColor("black").fontSize(10);
          doc.moveDown(0.5);

          outOfStock.forEach((product) => {
            doc.text(
              `• ${product.name} (${
                product.category?.name || "Uncategorized"
              })`,
              { indent: 20 }
            );
          });
          doc.moveDown();
        }

        // Critical Stock Section
        if (criticalStock.length > 0) {
          doc
            .fontSize(14)
            .fillColor("orange")
            .text("CRITICAL STOCK LEVEL", { underline: true });
          doc.fillColor("black").fontSize(10);
          doc.moveDown(0.5);

          criticalStock.forEach((product) => {
            doc.text(
              `• ${product.name}: ${product.stock} ${product.unit} remaining`,
              { indent: 20 }
            );
          });
          doc.moveDown();
        }

        // Low Stock Section
        if (lowStock.length > 0) {
          doc
            .fontSize(14)
            .fillColor("orange")
            .text("LOW STOCK WARNING", { underline: true });
          doc.fillColor("black").fontSize(10);
          doc.moveDown(0.5);

          lowStock.forEach((product) => {
            doc.text(
              `• ${product.name}: ${product.stock} ${product.unit} remaining`,
              { indent: 20 }
            );
          });
        }
      }
      break;

    case "movement":
      doc.fontSize(16).text("Stock Movement Report", { underline: true });
      doc.moveDown();

      if (reportData.movements && reportData.movements.length > 0) {
        doc
          .fontSize(12)
          .text("Movement Summary by Product", { underline: true });
        doc.moveDown();

        reportData.movements.forEach((movement) => {
          if (movement.productName) {
            doc.fontSize(11).font("Helvetica-Bold").text(movement.productName);
            doc.fontSize(10).font("Helvetica");
            doc.text(`  Total Added: ${movement.totalIn || 0} units`, {
              indent: 20,
            });
            doc.text(`  Total Removed: ${movement.totalOut || 0} units`, {
              indent: 20,
            });
            doc.text(
              `  Net Change: ${movement.netChange >= 0 ? "+" : ""}${
                movement.netChange
              } units`,
              { indent: 20 }
            );
            doc.moveDown(0.5);
          }
        });
      } else {
        doc
          .fontSize(12)
          .text("No stock movements found for the selected period.", {
            align: "center",
          });
      }
      break;

    case "valuation":
      doc.fontSize(16).text("Stock Valuation Report", { underline: true });
      doc.moveDown();

      // Group by category
      const categoryTotals = {};
      let grandTotal = 0;

      products.forEach((product) => {
        const categoryName = product.category?.name || "Uncategorized";
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = {
            count: 0,
            value: 0,
            products: [],
          };
        }

        const value = product.stock * product.price;
        categoryTotals[categoryName].count += 1;
        categoryTotals[categoryName].value += value;
        categoryTotals[categoryName].products.push({
          name: product.name,
          stock: product.stock,
          unit: product.unit,
          price: product.price,
          value: value,
        });
        grandTotal += value;
      });

      // Summary
      doc.fontSize(14).text("Summary by Category", { underline: true });
      doc.moveDown();

      Object.entries(categoryTotals).forEach(([category, data]) => {
        const percentage =
          grandTotal > 0 ? ((data.value / grandTotal) * 100).toFixed(2) : 0;
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text(`${category}: ₹${data.value.toFixed(2)} (${percentage}%)`);
        doc.fontSize(10).font("Helvetica");
        doc.text(`  ${data.count} products`, { indent: 20 });
        doc.moveDown(0.5);
      });

      doc.moveDown();
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text(`Grand Total: ₹${grandTotal.toFixed(2)}`);
      break;
  }

  // Add footer
  doc
    .fontSize(8)
    .text("This is a computer-generated report", 50, doc.page.height - 50, {
      align: "center",
    });

  // Finalize the PDF
  doc.end();
};

// Get stock analytics
router.get("/analytics", auth, async (req, res) => {
  try {
    // Get all products for the user
    const products = await Product.find({
      createdBy: req.user.userId,
    }).populate("category", "name");

    // Calculate basic metrics
    const totalProducts = products.length;

    // Calculate total stock value
    const totalValue = products.reduce((sum, product) => {
      return sum + product.stock * product.price;
    }, 0);

    // Count low stock items (stock <= 10)
    const lowStockCount = products.filter(
      (product) =>
        product.isStockRequired && product.stock > 0 && product.stock <= 10
    ).length;

    // Count out of stock items
    const outOfStockCount = products.filter(
      (product) => product.isStockRequired && product.stock === 0
    ).length;

    // Get stock value by category
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

    // Get recent stock movements (last 10)
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

    // Get movement trends for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const movementData = await StockHistory.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.userId), // Fixed: Added 'new'
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

    // Format movement trends for chart
    const movementTrends = movementData.map((item) => ({
      date: new Date(item._id).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      additions: item.additions,
      removals: item.removals,
    }));

    // Fill in missing dates with zero values
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

    // Handle type filtering properly
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

    // If search term is provided, get products that match and filter by them
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
          `${new Date(m.timestamp).toLocaleString()},${m.product?.name || ""},${
            m.type
          },${m.adjustment},${m.unit},${m.previousStock},${m.newStock},"${
            m.description || ""
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
      } else if (product.stock <= 5) {
        alerts.push({
          _id: `critical-${product._id}`,
          severity: "critical",
          title: "Critical Stock Level",
          message: `${product.name} has only ${product.stock} ${product.unit} remaining`,
          product: product,
          createdAt: new Date(),
        });
      } else if (product.stock <= 10) {
        alerts.push({
          _id: `low-${product._id}`,
          severity: "warning",
          title: "Low Stock Warning",
          message: `${product.name} stock is running low (${product.stock} ${product.unit})`,
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
                `"${p.name}","${p.category?.name || "Uncategorized"}",${
                  p.stock
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
              return `"${p.name}","${p.category?.name || "Uncategorized"}",${
                p.stock
              },"${p.unit}","${status}",${p.stock * p.price}`;
            })
            .join("\n");
          break;

        case "valuation":
          csv = "Product Name,Category,Stock,Unit,Unit Price,Total Value\n";
          csv += products
            .map(
              (p) =>
                `"${p.name}","${p.category?.name || "Uncategorized"}",${
                  p.stock
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
                  `"${m.productName || "Unknown"}",${m.totalIn || 0},${
                    m.totalOut || 0
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
                `"${p.name}","${p.category?.name || "Uncategorized"}",${
                  p.stock
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

// Update alert settings
router.put("/alerts/settings", auth, async (req, res) => {
  try {
    const {
      lowStockThreshold,
      criticalStockThreshold,
      emailNotifications,
      smsNotifications,
    } = req.body;

    // You might want to save these settings to a user preferences model
    // For now, just return success
    res.json({
      message: "Settings updated successfully",
      settings: req.body,
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
    const { adjustments, reason, type: adjustmentType, reference } = req.body;

    if (
      !adjustments ||
      !Array.isArray(adjustments) ||
      adjustments.length === 0
    ) {
      return res.status(400).json({ message: "No adjustments provided" });
    }

    const results = [];

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

    await session.commitTransaction();

    res.json({
      message: "Stock adjustments completed successfully",
      results,
      summary: {
        totalProducts: results.length,
        adjustmentType: adjustmentType,
        reference: reference,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Batch adjustment error:", error);
    res.status(500).json({
      message: "Error processing adjustments",
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
