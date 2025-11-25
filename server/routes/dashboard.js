// server/routes/dashboard.js - COMPLETE REWRITE OF MAIN ROUTE
const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Category = require("../models/Category");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

// Helper function to calculate date ranges
// server/routes/dashboard.js - VERIFY THIS DATE CALCULATION

// Helper function to calculate date ranges
function getDateRange(period, customStart, customEnd) {
  const now = new Date();
  let start,
    end = new Date();

  if (period === "custom" && customStart && customEnd) {
    return {
      start: new Date(customStart),
      end: new Date(customEnd),
    };
  }

  switch (period) {
    case "today":
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
      break;
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start, end };
}

// Helper function to get previous period
function getPreviousDateRange(start, end) {
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1),
  };
}

// Main dashboard route
router.get("/", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { period = "month", startDate, endDate } = req.query;

    console.log("Dashboard request:", { period, startDate, endDate, userId });

    // Calculate date ranges
    const currentRange = getDateRange(period, startDate, endDate);
    const previousRange = getPreviousDateRange(
      currentRange.start,
      currentRange.end
    );

    console.log("Date ranges:", { currentRange, previousRange });

    // ==========================================
    // 1. GET REVENUE DATA FOR CHART
    // ==========================================
    const revenueData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: {
            $gte: currentRange.start,
            $lte: currentRange.end,
          },
          status: { $in: ["final", "paid"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          count: 1,
        },
      },
    ]);

    console.log("Revenue data:", revenueData.length, "records");

    // ==========================================
    // 2. GET TOP PRODUCTS
    // ==========================================
    const topProducts = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: {
            $gte: currentRange.start,
            $lte: currentRange.end,
          },
          status: { $in: ["final", "paid"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          sales: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: 0,
          name: "$productInfo.name",
          sales: 1,
          revenue: 1,
        },
      },
    ]);

    console.log("Top products:", topProducts.length, "products");

    // ==========================================
    // 3. GET SALES BY CATEGORY
    // ==========================================
    const salesByCategory = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: {
            $gte: currentRange.start,
            $lte: currentRange.end,
          },
          status: { $in: ["final", "paid"] },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: {
          path: "$productInfo",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          name: {
            $first: {
              $ifNull: ["$categoryInfo.name", "Uncategorized"],
            },
          },
          totalValue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    // Calculate percentages
    const totalCategoryValue = salesByCategory.reduce(
      (sum, cat) => sum + cat.totalValue,
      0
    );

    const formattedCategories = salesByCategory.map((cat) => ({
      name: cat.name,
      value:
        totalCategoryValue > 0
          ? parseFloat(((cat.totalValue / totalCategoryValue) * 100).toFixed(1))
          : 0,
      totalValue: cat.totalValue,
    }));

    console.log("Sales by category:", formattedCategories.length, "categories");

    // ==========================================
    // 4. GET RECENT TRANSACTIONS
    // ==========================================
    const recentTransactions = await Invoice.find({
      createdBy: userId,
      createdAt: {
        $gte: currentRange.start,
        $lte: currentRange.end,
      },
      status: { $in: ["final", "paid"] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("createdAt customer items total status invoiceNumber")
      .lean();

    const formattedTransactions = recentTransactions.map((t) => ({
      date: t.createdAt,
      customer: t.customer?.name || "Walk-in Customer",
      items: Array.isArray(t.items) ? t.items.length : 0,
      total: t.total || 0,
      status: t.status,
      invoiceNumber: t.invoiceNumber,
    }));

    console.log(
      "Recent transactions:",
      formattedTransactions.length,
      "transactions"
    );

    // ==========================================
    // 5. GET STOCK ALERTS
    // ==========================================
    const stockAlerts = await Product.find({
      createdBy: userId,
      isStockRequired: true,
      stock: { $lte: 10 },
    })
      .select("_id name stock")
      .lean();

    console.log("Stock alerts:", stockAlerts.length, "alerts");

    // ==========================================
    // 6. CALCULATE STATISTICS
    // ==========================================

    // Current period stats
    const currentStats = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: {
            $gte: currentRange.start,
            $lte: currentRange.end,
          },
          status: { $in: ["final", "paid"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Previous period stats
    const previousStats = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: {
            $gte: previousRange.start,
            $lte: previousRange.end,
          },
          status: { $in: ["final", "paid"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Customer stats
    const totalCustomers = await Customer.countDocuments({
      createdBy: userId,
    });

    const currentPeriodCustomers = await Customer.countDocuments({
      createdBy: userId,
      createdAt: {
        $gte: currentRange.start,
        $lte: currentRange.end,
      },
    });

    const previousPeriodCustomers = await Customer.countDocuments({
      createdBy: userId,
      createdAt: {
        $gte: previousRange.start,
        $lte: previousRange.end,
      },
    });

    // Extract values
    const currentRevenue = currentStats[0]?.totalRevenue || 0;
    const previousRevenue = previousStats[0]?.totalRevenue || 0;
    const currentOrders = currentStats[0]?.totalOrders || 0;
    const previousOrders = previousStats[0]?.totalOrders || 0;

    // Calculate percentage changes
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
        ? 100
        : 0;

    const ordersChange =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : currentOrders > 0
        ? 100
        : 0;

    const customersChange =
      previousPeriodCustomers > 0
        ? ((currentPeriodCustomers - previousPeriodCustomers) /
            previousPeriodCustomers) *
          100
        : currentPeriodCustomers > 0
        ? 100
        : 0;

    const statistics = {
      revenue: {
        value: currentRevenue,
        change: Math.abs(parseFloat(revenueChange.toFixed(1))),
        isPositive: revenueChange >= 0,
      },
      customers: {
        value: totalCustomers,
        change: Math.abs(parseFloat(customersChange.toFixed(1))),
        isPositive: customersChange >= 0,
      },
      orders: {
        value: currentOrders,
        change: Math.abs(parseFloat(ordersChange.toFixed(1))),
        isPositive: ordersChange >= 0,
      },
      alerts: {
        value: stockAlerts.length,
        change: 0,
        isPositive: stockAlerts.length <= 5,
      },
    };

    console.log("Statistics:", statistics);

    // ==========================================
    // 7. SEND RESPONSE
    // ==========================================
    const response = {
      revenueData,
      topProducts,
      salesByCategory: formattedCategories,
      recentTransactions: formattedTransactions,
      stockAlerts,
      statistics,
      period: {
        selected: period,
        start: currentRange.start,
        end: currentRange.end,
      },
      debug: {
        currentRevenue,
        previousRevenue,
        currentOrders,
        previousOrders,
        revenueDataCount: revenueData.length,
        topProductsCount: topProducts.length,
        categoriesCount: formattedCategories.length,
      },
    };

    console.log("Sending response with stats:", {
      revenue: currentRevenue,
      orders: currentOrders,
      customers: totalCustomers,
      categories: formattedCategories.length,
    });

    res.json(response);
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Helper functions
function calculateDateRange(period, startDate, endDate) {
  const now = new Date();
  let start,
    end = now;

  if (period === "custom" && startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  }

  switch (period) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "week":
      start = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      start = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "quarter":
      start = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case "year":
      start = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      start = new Date(now.setMonth(now.getMonth() - 1));
  }

  return { start, end: new Date() };
}

function calculatePreviousDateRange(period, currentRange) {
  const diff = currentRange.end - currentRange.start;
  return {
    start: new Date(currentRange.start - diff),
    end: new Date(currentRange.start),
  };
}

function getGroupByFormat(period) {
  switch (period) {
    case "today":
      return {
        hour: { $hour: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      };
    case "week":
    case "month":
      return {
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      };
    case "quarter":
    case "year":
      return {
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      };
    default:
      return {
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      };
  }
}

function getDateFormat(period) {
  const groupId = "$_id";
  switch (period) {
    case "today":
      return {
        $dateToString: {
          format: "%Y-%m-%d %H:00",
          date: {
            $dateFromParts: {
              year: `${groupId}.year`,
              month: `${groupId}.month`,
              day: `${groupId}.day`,
              hour: `${groupId}.hour`,
            },
          },
        },
      };
    default:
      return {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateFromParts: {
              year: `${groupId}.year`,
              month: `${groupId}.month`,
              day: { $ifNull: [`${groupId}.day`, 1] },
            },
          },
        },
      };
  }
}

async function calculatePeriodStats(userId, dateRange) {
  const stats = await Invoice.aggregate([
    {
      $match: {
        createdBy: userId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        status: { $in: ["final", "paid"] },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
  ]);

  const customers = await Customer.countDocuments({
    createdBy: userId,
    createdAt: { $gte: dateRange.start, $lte: dateRange.end },
  });

  return {
    revenue: stats[0]?.revenue || 0,
    orders: stats[0]?.orders || 0,
    customers,
  };
}

function calculateChange(current, previous) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  return {
    value: current,
    change: Math.abs(parseFloat(change.toFixed(1))),
    isPositive: change >= 0,
  };
}

// Export endpoint
router.get("/export", auth, async (req, res) => {
  try {
    const { format = "pdf", period = "month" } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Fetch dashboard data
    const dateRange = calculateDateRange(period);

    // Get all necessary data
    const data = await fetchAllDashboardData(userId, dateRange);

    // Generate file based on format
    if (format === "pdf") {
      const pdfBuffer = await generateDashboardPDF(data, period);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=dashboard-${period}-${Date.now()}.pdf`,
      });
      res.send(pdfBuffer);
    } else if (format === "csv") {
      const csv = generateDashboardCSV(data);
      res.set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=dashboard-${period}-${Date.now()}.csv`,
      });
      res.send(csv);
    } else {
      res.status(400).json({ message: "Invalid format" });
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Error exporting data" });
  }
});

async function fetchAllDashboardData(userId, dateRange) {
  const [revenue, products, transactions, customers] = await Promise.all([
    Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $in: ["final", "paid"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]),
    Product.find({ createdBy: userId }).select("name stock price"),
    Invoice.find({
      createdBy: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $in: ["final", "paid"] },
    })
      .sort({ createdAt: -1 })
      .limit(50),
    Customer.countDocuments({ createdBy: userId }),
  ]);

  return {
    revenue: revenue[0] || { total: 0, count: 0 },
    products,
    transactions,
    customers,
    period: dateRange,
  };
}

function generateDashboardCSV(data) {
  let csv = "Dashboard Report\n\n";
  csv += `Period: ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}\n\n`;

  // Summary
  csv += "Summary\n";
  csv += `Total Revenue,${data.revenue.total}\n`;
  csv += `Total Orders,${data.revenue.count}\n`;
  csv += `Total Customers,${data.customers}\n`;
  csv += `Total Products,${data.products.length}\n\n`;

  // Transactions
  csv += "Recent Transactions\n";
  csv += "Date,Invoice Number,Customer,Total,Status\n";
  data.transactions.forEach((t) => {
    csv += `${new Date(t.createdAt).toLocaleDateString()},${t.invoiceNumber},"${
      t.customer?.name || "Walk-in"
    }",${t.total},${t.status}\n`;
  });

  csv += "\n\nProducts\n";
  csv += "Name,Stock,Price,Value\n";
  data.products.forEach((p) => {
    csv += `"${p.name}",${p.stock},${p.price},${p.stock * p.price}\n`;
  });

  return csv;
}

// Get sales analytics data
router.get("/sales-analytics", auth, async (req, res) => {
  try {
    const { period = "monthly" } = req.query;
    const currentDate = new Date();
    let startDate = new Date();
    let groupBy = {};
    let dateFormat = "";
    let previousPeriodStart = new Date();
    let previousPeriodEnd = new Date();

    // Set the date range and grouping based on the period
    switch (period) {
      case "daily":
        // Last 30 days
        startDate.setDate(currentDate.getDate() - 30);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        dateFormat = "%Y-%m-%d";
        previousPeriodStart.setDate(currentDate.getDate() - 60);
        previousPeriodEnd.setDate(currentDate.getDate() - 31);
        break;

      case "weekly":
        // Last 12 weeks
        startDate.setDate(currentDate.getDate() - 84); // 12 weeks
        groupBy = {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        };
        dateFormat = "W%V-%Y";
        previousPeriodStart.setDate(currentDate.getDate() - 168); // 24 weeks
        previousPeriodEnd.setDate(currentDate.getDate() - 85);
        break;

      case "monthly":
        // Last 12 months
        startDate.setMonth(currentDate.getMonth() - 12);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        dateFormat = "%Y-%m";
        previousPeriodStart.setMonth(currentDate.getMonth() - 24);
        previousPeriodEnd.setMonth(currentDate.getMonth() - 13);
        break;

      case "yearly":
        // Last 5 years
        startDate.setFullYear(currentDate.getFullYear() - 5);
        groupBy = {
          year: { $year: "$createdAt" },
        };
        dateFormat = "%Y";
        previousPeriodStart.setFullYear(currentDate.getFullYear() - 10);
        previousPeriodEnd.setFullYear(currentDate.getFullYear() - 6);
        break;
    }

    // Get period sales data
    // Get period sales data
    const periodSales = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: startDate, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: "$total" },
          count: { $sum: 1 }, // Add count for your dashboard component
        },
      },
      {
        $project: {
          _id: 0,
          // For weekly period, just use a string format instead of $dateFromParts
          period:
            period === "weekly"
              ? {
                  $concat: [
                    "W",
                    { $toString: "$_id.week" },
                    "-",
                    { $toString: "$_id.year" },
                  ],
                }
              : {
                  $dateToString: {
                    format: dateFormat,
                    date: {
                      $dateFromParts: {
                        year: "$_id.year", // Always include year
                        month: { $ifNull: ["$_id.month", 1] },
                        day: { $ifNull: ["$_id.day", 1] },
                      },
                    },
                  },
                },
          sales: 1,
          count: 1,
        },
      },
      {
        $sort: { period: 1 },
      },
    ]);
    // Get sales by category
    const salesByCategory = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          name: { $first: "$categoryInfo.name" },
          sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          value: {
            $round: [
              { $multiply: [{ $divide: ["$sales", { $sum: "$sales" }] }, 100] },
              1,
            ],
          },
        },
      },
    ]);

    // Get quarterly sales trend (current vs previous year)
    const salesTrend = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: previousPeriodStart },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } },
          },
          sales: { $sum: "$total" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.quarter": 1 },
      },
    ]).then((results) => {
      // Transform into current vs previous year format
      const currentYear = new Date().getFullYear();
      const currentQuarterData = results.filter(
        (item) => item._id.year === currentYear
      );
      const previousYearData = results.filter(
        (item) => item._id.year === currentYear - 1
      );

      const quarterlyData = [];
      for (let quarter = 1; quarter <= 4; quarter++) {
        const current = currentQuarterData.find(
          (item) => item._id.quarter === quarter
        );
        const previous = previousYearData.find(
          (item) => item._id.quarter === quarter
        );

        quarterlyData.push({
          date: `${currentYear} Q${quarter}`,
          current: current ? current.sales : 0,
          previous: previous ? previous.sales : 0,
        });
      }

      return quarterlyData;
    });

    // Get top sales periods
    const topSalesPeriods = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id:
            period === "monthly"
              ? { $month: "$createdAt" }
              : period === "weekly"
              ? { $week: "$createdAt" }
              : period === "daily"
              ? {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                }
              : { $year: "$createdAt" },
          sales: { $sum: "$total" },
        },
      },
      {
        $sort: { sales: -1 },
      },
      {
        $limit: 3,
      },
      {
        $project: {
          _id: 0,
          period:
            period === "monthly"
              ? {
                  $let: {
                    vars: {
                      monthsInString: [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ],
                    },
                    in: {
                      $arrayElemAt: [
                        "$$monthsInString",
                        { $subtract: ["$_id", 1] },
                      ],
                    },
                  },
                }
              : "$_id",
          sales: 1,
        },
      },
    ]);

    // Calculate total sales and comparison data
    const totalSalesData = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
        },
      },
      {
        $group: {
          _id: {
            current: { $gte: ["$createdAt", startDate] },
            previous: {
              $and: [
                { $gte: ["$createdAt", previousPeriodStart] },
                { $lte: ["$createdAt", previousPeriodEnd] },
              ],
            },
          },
          total: { $sum: "$total" },
        },
      },
    ]);

    const currentPeriodSales =
      totalSalesData.find((item) => item._id.current)?.total || 0;
    const previousPeriodSales =
      totalSalesData.find((item) => item._id.previous)?.total || 0;

    let percentChange = 0;
    let isPositive = true;

    if (previousPeriodSales > 0) {
      percentChange =
        ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) *
        100;
      isPositive = percentChange >= 0;
      percentChange = Math.abs(percentChange).toFixed(1);
    }

    // Calculate total sales percentage for top periods
    const totalSales = topSalesPeriods.reduce(
      (sum, item) => sum + item.sales,
      0
    );
    const topSalesPeriodsWithPercent = topSalesPeriods.map((item) => ({
      ...item,
      percentOfTotal: Math.round((item.sales / totalSales) * 100),
    }));

    res.json({
      periodSales,
      salesByCategory,
      salesTrend,
      topSalesPeriods: topSalesPeriodsWithPercent,
      comparisonData: {
        totalSales: currentPeriodSales,
        percentChange: parseFloat(percentChange),
        isPositive,
      },
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get earnings data
router.get("/earnings", auth, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    const previousYearStart = new Date(year - 1, 0, 1);
    const previousYearEnd = new Date(year - 1, 11, 31, 23, 59, 59);

    // Get monthly earnings
    const monthlyEarnings = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" },
          // Assuming expenses are 60% of revenue for demonstration
          // You should replace this with actual expense data from your system
          expenses: { $sum: { $multiply: ["$total", 0.6] } },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInString: [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: {
                $arrayElemAt: [
                  "$$monthsInString",
                  { $subtract: ["$_id.month", 1] },
                ],
              },
            },
          },
          revenue: 1,
          expenses: 1,
          profit: { $subtract: ["$revenue", "$expenses"] },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // Get quarterly comparison data
    const quarterlyComparison = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: previousYearStart, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } },
          },
          revenue: { $sum: "$total" },
          expenses: { $sum: { $multiply: ["$total", 0.6] } },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          quarter: "$_id.quarter",
          profit: { $subtract: ["$revenue", "$expenses"] },
        },
      },
      {
        $sort: { year: 1, quarter: 1 },
      },
    ]).then((results) => {
      // Transform into current vs previous year format
      const currentYearData = results.filter(
        (item) => item.year === parseInt(year)
      );
      const previousYearData = results.filter(
        (item) => item.year === parseInt(year) - 1
      );

      const quarterlyData = [];
      for (let quarter = 1; quarter <= 4; quarter++) {
        const current = currentYearData.find(
          (item) => item.quarter === quarter
        );
        const previous = previousYearData.find(
          (item) => item.quarter === quarter
        );

        if (current || previous) {
          const currentProfit = current ? current.profit : 0;
          const previousProfit = previous ? previous.profit : 0;
          let percentChange = 0;

          if (previousProfit > 0) {
            percentChange =
              ((currentProfit - previousProfit) / previousProfit) * 100;
          }

          quarterlyData.push({
            quarter: `Q${quarter}`,
            currentYearProfit: currentProfit,
            previousYearProfit: previousProfit,
            percentChange: parseFloat(percentChange.toFixed(1)),
          });
        }
      }

      return quarterlyData;
    });

    // Get expense breakdown
    // Simulating expense categories - replace with actual expense categories from your system
    const expenseCategories = [
      "Operations",
      "Marketing",
      "Inventory",
      "Salaries",
      "Rent",
      "Other",
    ];
    const expenseBreakdown = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: { $multiply: ["$total", 0.6] } },
        },
      },
    ]).then((result) => {
      const totalExpenses = result[0]?.totalExpenses || 0;
      // Randomly distribute total expenses among categories
      // Replace with actual expense distribution logic
      return expenseCategories
        .map((category) => {
          const randomFactor = Math.random() * 0.5 + 0.5; // Between 0.5 and 1
          const categoryPercentage = randomFactor / expenseCategories.length;
          return {
            category,
            amount: Math.round(totalExpenses * categoryPercentage),
          };
        })
        .sort((a, b) => b.amount - a.amount);
    });

    // Get profit margins by month
    const profitMargins = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" },
          expenses: { $sum: { $multiply: ["$total", 0.6] } },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInString: [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: {
                $arrayElemAt: [
                  "$$monthsInString",
                  { $subtract: ["$_id.month", 1] },
                ],
              },
            },
          },
          margin: {
            $multiply: [
              {
                $divide: [{ $subtract: ["$revenue", "$expenses"] }, "$revenue"],
              },
              100,
            ],
          },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // Get yearly summary data
    const yearlyData = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalExpenses: { $sum: { $multiply: ["$total", 0.6] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalExpenses: 1,
          netProfit: { $subtract: ["$totalRevenue", "$totalExpenses"] },
          profitMargin: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$totalRevenue", "$totalExpenses"] },
                  {
                    $cond: [{ $eq: ["$totalRevenue", 0] }, 1, "$totalRevenue"],
                  },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    // Get previous year data for year-over-year comparison
    const previousYearData = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
          createdAt: {
            $gte: previousYearStart,
            $lte: previousYearEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalExpenses: { $sum: { $multiply: ["$total", 0.6] } },
        },
      },
      {
        $project: {
          _id: 0,
          netProfit: { $subtract: ["$totalRevenue", "$totalExpenses"] },
        },
      },
    ]);

    const currentYearNetProfit = yearlyData[0]?.netProfit || 0;
    const previousYearNetProfit = previousYearData[0]?.netProfit || 0;

    let yearOverYearGrowth = 0;
    let isGrowthPositive = true;

    if (previousYearNetProfit > 0) {
      yearOverYearGrowth =
        ((currentYearNetProfit - previousYearNetProfit) /
          previousYearNetProfit) *
        100;
      isGrowthPositive = yearOverYearGrowth >= 0;
      yearOverYearGrowth = parseFloat(Math.abs(yearOverYearGrowth).toFixed(1));
    }

    res.json({
      monthlyEarnings,
      quarterlyComparison,
      expenseBreakdown,
      profitMargins,
      yearlyData: {
        ...(yearlyData[0] || {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
        }),
        yearOverYearGrowth,
        isGrowthPositive,
      },
    });
  } catch (error) {
    console.error("Error fetching earnings data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get stock overview data
router.get("/stock-overview", auth, async (req, res) => {
  try {
    // Get overall stock statistics
    const totalProducts = await Product.countDocuments({
      createdBy: req.user.userId,
    });

    const stockStats = await Product.aggregate([
      {
        $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) },
      },
      {
        $group: {
          _id: null,
          productsInStock: {
            $sum: {
              $cond: [{ $gt: ["$stock", 0] }, 1, 0],
            },
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] },
                1,
                0,
              ],
            },
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ["$stock", 0] }, 1, 0],
            },
          },
          totalStock: { $sum: "$stock" },
          averageStockLevel: { $avg: "$stock" },
        },
      },
    ]);

    // Get stock distribution
    const stockDistribution = await Product.aggregate([
      {
        $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ["$stock", 0] }, then: "0" },
                {
                  case: {
                    $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }],
                  },
                  then: "1-10",
                },
                {
                  case: {
                    $and: [{ $gt: ["$stock", 10] }, { $lte: ["$stock", 20] }],
                  },
                  then: "11-20",
                },
                {
                  case: {
                    $and: [{ $gt: ["$stock", 20] }, { $lte: ["$stock", 50] }],
                  },
                  then: "21-50",
                },
                {
                  case: {
                    $and: [{ $gt: ["$stock", 50] }, { $lte: ["$stock", 100] }],
                  },
                  then: "51-100",
                },
              ],
              default: ">100",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          range: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          range: 1,
        },
      },
    ]);

    // Get stock movement (simulated with recent stock history)
    // Note: You would need a StockHistory collection to track daily stock movements
    // This is a simplified example using weekday-based simulation
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const stockMovement = weekdays.map((day) => ({
      day,
      incoming: Math.floor(Math.random() * 50) + 20, // Simulated data - replace with actual queries
      outgoing: Math.floor(Math.random() * 40) + 20, // Simulated data - replace with actual queries
    }));

    // Get category breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          name: { $first: "$categoryInfo.name" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          value: {
            $round: [
              { $multiply: [{ $divide: ["$count", totalProducts] }, 100] },
              1,
            ],
          },
        },
      },
    ]);

    // Get top selling products
    // Calculate turnover rate based on sales data
    // This requires data on how quickly products are selling
    // We'll use a simplified calculation based on recent invoice history
    const topSellingProducts = await Invoice.aggregate([
      {
        $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
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
        $unwind: "$productInfo",
      },
      {
        $project: {
          _id: 0,
          name: "$productInfo.name",
          stock: "$productInfo.stock",
          // Simplified turnover rate calculation
          turnover: {
            $cond: [
              { $eq: ["$productInfo.stock", 0] },
              0,
              { $divide: ["$totalSold", { $add: ["$productInfo.stock", 1] }] },
            ],
          },
        },
      },
      {
        $sort: { turnover: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.json({
      overview: {
        totalProducts,
        productsInStock: stockStats[0]?.productsInStock || 0,
        lowStockProducts: stockStats[0]?.lowStockProducts || 0,
        outOfStockProducts: stockStats[0]?.outOfStockProducts || 0,
        averageStockLevel: Math.round(stockStats[0]?.averageStockLevel || 0),
        stockTurnoverRate: 4.2, // This would need to be calculated from actual sales data
      },
      stockDistribution,
      stockMovement,
      categoryBreakdown,
      topSellingProducts,
    });
  } catch (error) {
    console.error("Error fetching stock overview:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get stock alerts - already implemented in your code
router.get("/stock-alerts", auth, async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const stockAlerts = await Product.find({
      createdBy: req.user.userId,
      stock: { $lte: parseInt(threshold) },
    }).select("_id name stock");

    res.json(stockAlerts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get alerts summary
router.get("/alerts-summary", auth, async (req, res) => {
  try {
    // Get stock alerts
    const stockAlerts = await Product.find({
      createdBy: req.user.userId,
      stock: { $lte: 10 },
    })
      .select("_id name stock")
      .limit(10)
      .lean();

    // Transform stock alerts to add severity
    const formattedStockAlerts = stockAlerts.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      stock: item.stock,
      threshold: 10,
      severity: item.stock <= 5 ? "critical" : "warning",
      date: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toISOString(), // Random date in the last week
    }));

    // Get invoices with potential revenue alerts
    // Revenue alerts are based on invoice totals that are significantly below average
    const revenueAlerts = await Invoice.aggregate([
      {
        $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) },
      },
      {
        $group: {
          _id: null,
          avgTotal: { $avg: "$total" },
          invoices: {
            $push: { id: "$_id", total: "$total", date: "$createdAt" },
          },
        },
      },
      {
        $unwind: "$invoices",
      },
      {
        $project: {
          _id: 0,
          id: "$invoices.id",
          total: "$invoices.total",
          date: "$invoices.date",
          percentBelow: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$avgTotal", "$invoices.total"] },
                  "$avgTotal",
                ],
              },
              100,
            ],
          },
        },
      },
      {
        $match: {
          percentBelow: { $gt: 15 }, // Invoices at least 15% below average
        },
      },
      {
        $sort: { percentBelow: -1 },
      },
      {
        $limit: 3,
      },
    ]);

    // Transform revenue alerts into a consistent format
    const formattedRevenueAlerts = revenueAlerts.map((item) => ({
      id: item.id.toString(),
      title: "Revenue Alert",
      message: `Invoice total is ${Math.round(
        item.percentBelow
      )}% below average`,
      severity: item.percentBelow > 25 ? "critical" : "warning",
      date: item.date.toISOString(),
      category: "revenue",
    }));

    // Generate system alerts (typically these would come from system logs or monitoring)
    // For demonstration, we'll create some placeholder system alerts
    const systemAlerts = [
      {
        id: "sys1",
        title: "System Maintenance",
        message: "Scheduled maintenance coming up",
        severity: "info",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: "maintenance",
      },
      {
        id: "sys2",
        title: "Database Backup",
        message: "Weekly database backup completed successfully",
        severity: "info",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: "backup",
        isResolved: true,
      },
    ];

    // Count alerts by severity
    const allAlerts = [
      ...formattedStockAlerts,
      ...formattedRevenueAlerts,
      ...systemAlerts,
    ];
    const summary = {
      critical: allAlerts.filter((a) => a.severity === "critical").length,
      warning: allAlerts.filter((a) => a.severity === "warning").length,
      info: allAlerts.filter((a) => a.severity === "info").length,
      resolved: allAlerts.filter((a) => a.isResolved).length,
    };

    // Get recent alerts
    const recentAlerts = allAlerts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((alert) => ({
        id: alert.id,
        title:
          alert.title ||
          `${alert.name} Stock ${alert.stock <= 5 ? "Critical" : "Low"}`,
        type:
          alert.category || (alert.stock !== undefined ? "stock" : "system"),
        severity: alert.severity,
        date: alert.date,
        isResolved: alert.isResolved || false,
      }));

    res.json({
      stockAlerts: formattedStockAlerts,
      revenueAlerts: formattedRevenueAlerts,
      systemAlerts,
      summary,
      recentAlerts,
    });
  } catch (error) {
    console.error("Error fetching alerts summary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get revenue data with date range
router.get("/revenue", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      status: "paid",
      createdBy: mongoose.Types.ObjectId(req.user.userId),
      createdAt: {},
    };

    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }

    const revenueData = await Invoice.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          _id: 0,
        },
      },
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get top products
router.get("/top-products", auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topProducts = await Invoice.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.userId),
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.product",
          sales: { $sum: "$items.quantity" },
        },
      },
      {
        $sort: { sales: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $lookup: {
          from: "products",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$productId"] },
                    {
                      $eq: [
                        "$createdBy",
                        new mongoose.Types.ObjectId(req.user.userId),
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "productInfo",
        },
      },
      {
        $project: {
          name: { $arrayElemAt: ["$productInfo.name", 0] },
          sales: 1,
          _id: 0,
        },
      },
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
