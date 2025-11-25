// routes/revenue.js
const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");
const User = require("../models/User");
const auth = require("../middleware/auth");
const generateRevenuePDF = require("../utils/generateRevenuePDF");
const mongoose = require("mongoose");
const StockHistory = require("../models/StockHistory");

// Get revenue summary
// routes/revenue.js - FULLY UPDATED revenue summary endpoint
router.get("/summary", auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      period = "month",
      revenueType = "all",
    } = req.query;
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build date filter
    let dateFilter = {};
    let effectiveStart = null;
    let effectiveEnd = null;

    if (period === "all") {
      const user = await User.findById(userId).select("createdAt");
      const start = user?.createdAt ? new Date(user.createdAt) : new Date(0);
      const end = new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      effectiveStart = start;
      effectiveEnd = end;
      dateFilter = {
        date: {
          $gte: start,
          $lte: end,
        },
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      effectiveStart = start;
      effectiveEnd = end;
      dateFilter = {
        date: {
          $gte: start,
          $lte: end,
        },
      };
    } else {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      effectiveStart = firstDay;
      effectiveEnd = lastDay;
      dateFilter = {
        date: {
          $gte: firstDay,
          $lte: lastDay,
        },
      };
    }

    // Build base query
    let baseQuery = {
      createdBy: userObjectId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    };

    // Apply revenue type filter
    if (revenueType === "received") {
      baseQuery.paymentMethod = { $in: ["cash", "online", "card"] };
    } else if (revenueType === "pending") {
      baseQuery.dueAmount = { $gt: 0 };
    }

    const revenueData = await Invoice.aggregate([
      {
        $match: baseQuery,
      },
      {
        $addFields: {
          // Calculate how much was paid at invoice creation
          initiallyPaid: {
            $subtract: ["$total", "$dueAmount"],
          },
          // Calculate total paid (initially + payments after)
          totalPaid: {
            $subtract: ["$total", "$dueAmount"],
          },
          outstanding: { $ifNull: ["$dueAmount", 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          actualReceivedRevenue: { $sum: "$totalPaid" },
          totalDueRevenue: { $sum: "$outstanding" },
          totalTax: { $sum: "$tax" },
          totalSubtotal: { $sum: "$subtotal" },
          invoiceCount: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
          cashRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$totalPaid", 0],
            },
          },
          onlineRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "online"] }, "$totalPaid", 0],
            },
          },
          cardRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "card"] }, "$totalPaid", 0],
            },
          },
        },
      },
    ]);

    // Calculate Customer Returns (Stock Adjustments)
    const stockDateFilter = {};
    if (dateFilter.date) {
      stockDateFilter.timestamp = dateFilter.date;
    }

    const returnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userObjectId,
          type: "return",
          ...stockDateFilter,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ["$adjustment", "$productInfo.price"] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReturns = returnsData[0]?.totalValue || 0;
    const returnsCount = returnsData[0]?.count || 0;

    console.log("\n=== REVENUE SUMMARY ===");
    if (revenueData[0]) {
      console.log(`Total Revenue: ₹${revenueData[0].totalRevenue}`);
      console.log(`Actual Received: ₹${revenueData[0].actualReceivedRevenue}`);
      console.log(`Total Due: ₹${revenueData[0].totalDueRevenue}`);
    }

    // Get payments made during the period for due invoices
    const paymentTransactions = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$paymentMode",
          totalPaid: { $sum: "$amount" },
          duesCleared: {
            $sum: {
              $subtract: ["$balanceBefore", "$balanceAfter"],
            },
          },
        },
      },
    ]);

    // UPDATED: Enhanced payment method breakdown
    const paymentBreakdown = await Invoice.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$total" },
          // Amount received at time of invoice
          // For "due" method: 0 (nothing paid initially, all on credit)
          // For other methods: total - (dueAmount + creditUsed)
          initiallyReceived: {
            $sum: {
              $cond: {
                if: { $eq: ["$paymentMethod", "due"] },
                then: 0, // For "due", nothing paid at invoice time
                else: {
                  $subtract: ["$total", "$dueAmount"],
                },
              },
            },
          },
          // Current amount received (total - current due)
          actualReceived: {
            $sum: {
              $subtract: ["$total", "$dueAmount"],
            },
          },
          currentDue: { $sum: "$dueAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    // Add payment transactions to the breakdown
    const paymentsByMode = {};
    let totalDuePayments = 0;
    paymentTransactions.forEach((payment) => {
      paymentsByMode[payment._id || "cash"] = payment.duesCleared;
      totalDuePayments += payment.duesCleared;
    });

    // Update the breakdown to include payments
    // Update the breakdown to include payments
    paymentBreakdown.forEach((method) => {
      if (method._id === "due") {
        // Calculate payments made before this period (using DB currentDue)
        const allTimePayments = method.total - method.currentDue; // Before period payments applied
        const previousPayments = allTimePayments - totalDuePayments;

        // Add payments received for due invoices
        method.paymentsReceived = totalDuePayments;
        method.previousPayments = previousPayments; // Payments before current period

        // For period-based: actualReceived = initiallyReceived + paymentsReceived (current period)
        method.actualReceived = method.initiallyReceived + totalDuePayments;

        // IMPORTANT: Update currentDue to be PERIOD-BASED as requested by user
        // Formula: total - actualReceived (period) = periodOutstanding
        // This ignores previous payments for the period view math
        method.currentDue = method.total - method.actualReceived;

        // Verification: 168 - 20 = 148
        // This satisfies "total - paymentsReceived is currentDue"
      }
    });

    console.log("\n=== PAYMENT BREAKDOWN ===");
    paymentBreakdown.forEach((method) => {
      console.log(
        `${method._id}: Total=₹${method.total}, Received=₹${method.actualReceived}, Due=₹${method.currentDue}`
      );
    });

    // IMPORTANT: Get ALL outstanding dues (not just from current period invoices)
    const totalOutstandingDues = await Customer.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          amountDue: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: "$amountDue" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Injection of all-time dues into paymentBreakdown REMOVED to ensure strict period-based reporting
    // paymentBreakdown now only contains sales from the current period

    // Get customer credit balance summary (ALL-TIME)
    const creditSummary = await Customer.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          creditBalance: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalCreditBalance: { $sum: "$creditBalance" },
          customersWithCredit: { $sum: 1 },
        },
      },
    ]);

    // Get net receivables (dues - credits) - using Invoice collection for accuracy (ALL-TIME)
    // This avoids issues if Customer.amountDue is out of sync
    const duesSummary = await Invoice.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          status: { $in: ["final", "paid"] },
          dueAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: "$dueAmount" },
          customersWithDue: { $addToSet: "$customer" }, // Count unique customers
        },
      },
      {
        $project: {
          totalDue: 1,
          customersWithDue: { $size: "$customersWithDue" },
        },
      },
    ]);

    // Calculate net position (ALL-TIME)
    const totalDues = duesSummary[0]?.totalDue || 0;
    const totalCredits = creditSummary[0]?.totalCreditBalance || 0;
    const netReceivables = totalDues - totalCredits;

    // COMPREHENSIVE REVENUE BREAKDOWN - All components separated clearly

    // 1. TOTAL SALES (All invoices in the period)
    const totalSales = revenueData[0]?.totalRevenue || 0;
    const invoiceCount = revenueData[0]?.invoiceCount || 0;

    // 2. INSTANT COLLECTION (All money collected immediately at sale time)
    // This includes: Cash + Online + Card + partial payments on "due" invoices
    let instantCollection = 0;
    let instantSalesCount = 0;

    // 3. DUE SALES (Amount ACTUALLY given on credit)
    let dueSalesAmount = 0;
    let dueSalesCount = 0;
    let currentOutstandingFromDueSales = 0;

    paymentBreakdown.forEach((method) => {
      // Handle "Instant" types (Cash, Online, Card, and old Credit/Mixed if fully paid)
      if (["cash", "online", "card", "credit"].includes(method._id)) {
        instantCollection += method.total || 0;
        instantSalesCount += method.count || 0;
      }
      // Handle "Due" type
      else if (method._id === "due") {
        // Money collected upfront
        if (method.initiallyReceived > 0) {
          instantCollection += method.initiallyReceived || 0;
        }

        // Money given on credit
        const initialDue = method.total - method.initiallyReceived;
        dueSalesAmount += initialDue;
        dueSalesCount += method.count || 0;
        currentOutstandingFromDueSales += method.currentDue || 0;
      }
      // Handle "Mixed" type (Old data) - Split into instant and due
      else if (method._id === "mixed") {
        // Add paid portion to instant collection
        if (method.initiallyReceived > 0) {
          instantCollection += method.initiallyReceived || 0;
        }

        // Add due portion to due sales
        if (method.currentDue > 0) {
          dueSalesAmount += method.currentDue;
          dueSalesCount += method.count || 0;
          currentOutstandingFromDueSales += method.currentDue;
        } else {
          // If fully paid, count as instant sale
          instantSalesCount += method.count || 0;
        }
      }
    });

    // Logic moved above to single loop for better accuracy

    // 4. CREDIT USED - REMOVED (Merged into Instant/Due logic below)
    // 5. DUES COLLECTED (Payments received on previously outstanding dues during this period)
    const duesCollectedSeparate = totalDuePayments;
    const duesPaymentCount = paymentTransactions.length;

    // 6. MIXED PAYMENTS - REMOVED (Merged into Instant/Due logic below)

    // 7. CURRENT OUTSTANDING (Total dues that are still unpaid in current period)
    const periodOutstanding = currentOutstandingFromDueSales;

    // 8. DUE SALES COLLECTED (Period-based: ONLY money collected in current period on due sales)
    // CRITICAL: Use actualReceived from paymentBreakdown, NOT all-time calculation!
    const dueMethod = paymentBreakdown.find((m) => m._id === "due");
    const dueSalesCollected = dueMethod ? dueMethod.actualReceived : 0;
    // This is period-based (e.g., 20), not all-time (146)

    // 9. TOTAL DUE PAYMENTS (Period-based)
    const totalDuePaymentsCollected = dueSalesCollected;

    // 10. NET POSITION FOR PERIOD
    const periodNetPosition = periodOutstanding;

    // 11. TOTAL MONEY IN (Actual cash/digital money received during period)
    // Recalculate to be absolutely sure
    const safeInstantCollection = paymentBreakdown.reduce((sum, m) => {
      if (["cash", "online", "card", "credit", "mixed"].includes(m._id))
        return sum + (m.initiallyReceived || m.total || 0);
      if (m._id === "due") return sum + (m.initiallyReceived || 0);
      return sum;
    }, 0);

    // Use totalDuePayments directly as it is the source of truth for period payments
    const safeDueCollection = totalDuePayments;

    // Use the safe values
    const totalMoneyIn = safeInstantCollection + safeDueCollection;

    // console.log("Safe Calc:", { safeInstantCollection, safeDueCollection, totalMoneyIn });

    // COMPREHENSIVE BREAKDOWN SUMMARY
    const comprehensiveBreakdown = {
      // Sales Breakdown
      sales: {
        total: totalSales,
        count: invoiceCount,
        components: {
          instantSales: {
            amount: instantCollection,
            count: instantSalesCount,
            percentage:
              totalSales > 0 ? (instantCollection / totalSales) * 100 : 0,
            description: "Sales with immediate payment (Cash + Online + Card)",
          },
          dueSales: {
            amount: dueSalesAmount,
            count: dueSalesCount,
            percentage:
              totalSales > 0 ? (dueSalesAmount / totalSales) * 100 : 0,
            description: "Sales with outstanding dues",
            currentOutstanding: currentOutstandingFromDueSales,
            collectedSoFar: dueSalesCollected,
          },
        },
      },
      // Collection Breakdown
      collection: {
        totalMoneyIn: totalMoneyIn,
        components: {
          instantCollection: {
            amount: instantCollection,
            percentage:
              totalMoneyIn > 0 ? (instantCollection / totalMoneyIn) * 100 : 0,
            description: "Money collected at time of sale",
          },
          duePayments: {
            amount: duesCollectedSeparate,
            percentage:
              totalMoneyIn > 0
                ? (duesCollectedSeparate / totalMoneyIn) * 100
                : 0,
            description: "Payments received on due sales",
            count: duesPaymentCount,
          },
        },
      },

      // Outstanding Breakdown
      outstanding: {
        fromPeriodSales: periodOutstanding,
        netPosition: periodNetPosition,
        description: `₹${periodNetPosition} to receive from period sales`,
      },

      // Performance Metrics (Period-Based and Consistent)
      performance: {
        // Collection Rate: What % of sales were immediately collected
        collectionRate:
          totalSales > 0 ? (instantCollection / totalSales) * 100 : 0,
        // Instant Collection Rate: Same as collection rate (immediate payment %)
        instantCollectionRate:
          totalSales > 0 ? (instantCollection / totalSales) * 100 : 0,
        // Due Sales Rate: What % of sales were on credit/due
        dueSalesRate: totalSales > 0 ? (dueSalesAmount / totalSales) * 100 : 0,
        // Dues Collection Efficiency: What % of period's due sales have been collected
        duesCollectionEfficiency:
          dueSalesAmount > 0 ? (dueSalesCollected / dueSalesAmount) * 100 : 0,
      },
    };

    // For backward compatibility, keep the simple calculation
    const periodCreditSales = dueSalesAmount;
    const periodDuesCollected = duesCollectedSeparate; // ONLY separate payment transactions (₹20), NOT initial collection
    const periodStillOutstanding = periodOutstanding;
    const periodNetReceivables = periodOutstanding;
    const invoicesWithDueInPeriod = dueSalesCount;

    // Get revenue by date with actual vs due breakdown
    const revenueByDate = await Invoice.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          revenue: { $sum: "$total" },
          actualReceived: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$total",
                0,
              ],
            },
          },
          dueAmount: { $sum: 0 },
          // dueAmount will be calculated in post-processing
          invoices: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Add separate payment transactions to revenueByDate actualReceived
    // And recalculate dueAmount
    if (revenueByDate.length > 0) {
      // Get payment transactions by date
      const paymentsByDate = await mongoose.model("Transaction").aggregate([
        {
          $match: {
            createdBy: userObjectId,
            type: "payment",
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" },
            },
            paymentsAmount: { $sum: "$amount" },
          },
        },
      ]);

      // Create a map of payments by date
      const paymentsMap = {};
      paymentsByDate.forEach((p) => {
        paymentsMap[p._id] = p.paymentsAmount;
      });

      // Add payments to revenueByDate actualReceived and calculate dueAmount
      revenueByDate.forEach((dateEntry) => {
        const paymentsForDate = paymentsMap[dateEntry._id] || 0;
        dateEntry.actualReceived += paymentsForDate;
        // Recalculate dueAmount for period view
        dateEntry.dueAmount = dateEntry.revenue - dateEntry.actualReceived;
      });
    }

    // IMPORTANT: Update the main summary object with period-based values
    if (revenueData.length > 0) {
      const summary = revenueData[0];
      // Calculate directly from summary fields to ensure consistency
      // IMPORTANT: Include ALL forms of payment
      // Formula: Cash + Online + Card + Credit Used + Due Payments = Total Collected
      const calculatedReceived =
        (summary.cashRevenue || 0) +
        (summary.onlineRevenue || 0) +
        (summary.cardRevenue || 0) +
        totalDuePayments;

      summary.actualReceivedRevenue = calculatedReceived;
      summary.totalDueRevenue = periodOutstanding;

      // Verification: totalRevenue should equal actualReceived + outstanding
      const verification =
        summary.actualReceivedRevenue + summary.totalDueRevenue;
      if (Math.abs(verification - summary.totalRevenue) > 0.01) {
        console.error(
          `⚠️ REVENUE CALCULATION MISMATCH: Total Revenue (${summary.totalRevenue}) ≠ Collected (${summary.actualReceivedRevenue}) + Outstanding (${summary.totalDueRevenue}) = ${verification}`
        );
      }
    }

    // Get top products by revenue
    const topProducts = await Invoice.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          revenue: { $sum: "$items.subtotal" },
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
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
    ]);

    // Get previous period for comparison
    const prevPeriodStart = new Date(dateFilter.date.$gte);
    const prevPeriodEnd = new Date(dateFilter.date.$lte);
    const periodDiff = prevPeriodEnd - prevPeriodStart;

    prevPeriodStart.setTime(prevPeriodStart.getTime() - periodDiff);
    prevPeriodEnd.setTime(prevPeriodEnd.getTime() - periodDiff);

    let revenueGrowth = 0;
    let prevRevenue = 0;

    if (effectiveStart && effectiveEnd) {
      const prevPeriodStart = new Date(effectiveStart);
      const prevPeriodEnd = new Date(effectiveEnd);
      const periodDiff = prevPeriodEnd - prevPeriodStart;

      prevPeriodStart.setTime(prevPeriodStart.getTime() - periodDiff);
      prevPeriodEnd.setTime(prevPeriodEnd.getTime() - periodDiff);

      const previousRevenue = await Invoice.aggregate([
        {
          $match: {
            createdBy: userObjectId,
            status: { $in: ["final", "paid"] },
            date: {
              $gte: prevPeriodStart,
              $lte: prevPeriodEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
          },
        },
      ]);
      prevRevenue = previousRevenue[0]?.totalRevenue || 0;
    }

    const currentRevenue = revenueData[0]?.totalRevenue || 0;
    if (prevRevenue > 0) {
      revenueGrowth = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (currentRevenue > 0) {
      revenueGrowth = 100;
    }

    // Calculate total payments received during the period
    const totalPaymentsReceived = paymentTransactions.reduce((sum, payment) => {
      return sum + payment.duesCleared;
    }, 0);

    // Adjust the actual received revenue to include payments
    if (revenueData[0]) {
      // revenueData[0].actualReceivedRevenue += totalPaymentsReceived; // REMOVED: Already included in robust calculation
      revenueData[0].paymentsReceived = totalPaymentsReceived;
    }

    console.log("\n=== FINAL SUMMARY ===");
    console.log(`Payments Received in Period: ₹${totalPaymentsReceived}`);
    console.log(`\n--- ALL-TIME VALUES ---`);
    console.log(`Total Outstanding Dues: ₹${totalDues}`);
    console.log(`Total Customer Credits: ₹${totalCredits}`);
    console.log(`Net Receivables: ₹${netReceivables}`);
    console.log(
      `\n--- PERIOD-BASED VALUES (Credit Sales - Dues Collected) ---`
    );
    console.log(`Credit Sales (Period): ₹${periodCreditSales}`);
    console.log(`Dues Collected (Period): ₹${periodDuesCollected}`);
    console.log(`Still Outstanding (Period): ₹${periodStillOutstanding}`);
    console.log(
      `Net Position (Period): ₹${periodNetReceivables} (same as Still Outstanding)`
    );
    console.log("========================\n");

    // Filter paymentBreakdown to remove credit/mixed from UI response
    const filteredPaymentBreakdown = paymentBreakdown.filter(
      (p) => !["credit", "mixed"].includes(p._id)
    );

    const summaryResponse = revenueData[0] || {
      totalRevenue: 0,
      actualReceivedRevenue: 0,
      totalDueRevenue: 0,
      totalTax: 0,
      invoiceCount: 0,
    };
    summaryResponse.growth = revenueGrowth;
    summaryResponse.returns = totalReturns;
    summaryResponse.returnsCount = returnsCount;
    summaryResponse.netRevenue =
      (summaryResponse.totalRevenue || 0) - totalReturns;

    res.json({
      summary: summaryResponse,
      creditSummary: creditSummary[0] || {
        totalCreditBalance: 0,
        customersWithCredit: 0,
      },
      duesSummary: {
        // Period-based values (default for dashboard)
        periodBased: {
          creditSales: periodCreditSales,
          duesCollected: periodDuesCollected,
          stillOutstanding: periodStillOutstanding,
          invoicesWithDue: invoicesWithDueInPeriod,
          netReceivables: periodNetReceivables,
          isReceivable: periodNetReceivables > 0,
        },
        // Backward compatibility (mapped to period-based values)
        totalDue: duesSummary[0]?.totalDue || 0, // FIXED: Use all-time total due
        customersWithDue: duesSummary[0]?.customersWithDue || 0,
        netReceivables:
          (duesSummary[0]?.totalDue || 0) -
          (creditSummary[0]?.totalCreditBalance || 0),
        isReceivable:
          (duesSummary[0]?.totalDue || 0) >
          (creditSummary[0]?.totalCreditBalance || 0),
      },
      paymentBreakdown: filteredPaymentBreakdown,
      revenueByDate,
      topProducts,
      growth: {
        percentage: revenueGrowth.toFixed(2),
        previousRevenue: prevRevenue,
        currentRevenue,
      },
      // NEW: Comprehensive breakdown with all revenue details separated
      comprehensiveBreakdown,
    });
  } catch (error) {
    console.error("Revenue summary error:", error);
    res.status(500).json({
      message: "Error fetching revenue data",
      error: error.message,
    });
  }
});

// Get payment collections summary (dues cleared through payments)
router.get("/payments-summary", auth, async (req, res) => {
  try {
    const { startDate, endDate, period = "month" } = req.query;
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build date filter
    let dateFilter = {};
    let effectiveStart = null;
    let effectiveEnd = null;

    if (period === "all") {
      const user = await User.findById(userId).select("createdAt");
      const start = user?.createdAt ? new Date(user.createdAt) : new Date(0);
      const end = new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      effectiveStart = start;
      effectiveEnd = end;
      dateFilter = {
        date: {
          $gte: start,
          $lte: end,
        },
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      effectiveStart = start;
      effectiveEnd = end;
      dateFilter = {
        date: {
          $gte: start,
          $lte: end,
        },
      };
    } else {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      effectiveStart = firstDay;
      effectiveEnd = lastDay;
      dateFilter = {
        date: {
          $gte: firstDay,
          $lte: lastDay,
        },
      };
    }

    // Get payment transactions (dues cleared)
    const paymentSummary = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: "$amount" },
          totalDuesCleared: {
            $sum: {
              $max: [0, { $subtract: ["$balanceBefore", "$balanceAfter"] }],
            },
          },
          paymentCount: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
          maxPayment: { $max: "$amount" },
          minPayment: { $min: "$amount" },
        },
      },
    ]);

    // Get payment breakdown by mode
    const paymentByMode = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$paymentMode", "cash"] }, // Default to cash if not specified
          total: { $sum: "$amount" },
          duesCleared: {
            $sum: {
              $max: [0, { $subtract: ["$balanceBefore", "$balanceAfter"] }],
            },
          },
          count: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get daily payment trend
    const dailyPayments = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          totalPayments: { $sum: "$amount" },
          duesCleared: {
            $sum: {
              $max: [0, { $subtract: ["$balanceBefore", "$balanceAfter"] }],
            },
          },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top paying customers with more details
    const topPayingCustomers = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customer.name" },
          customerPhone: { $first: "$customer.phoneNumber" },
          totalPaid: { $sum: "$amount" },
          duesCleared: {
            $sum: {
              $max: [0, { $subtract: ["$balanceBefore", "$balanceAfter"] }],
            },
          },
          paymentCount: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
          lastPaymentDate: { $max: "$date" },
        },
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 10 },
    ]);

    // Calculate percentages for payment modes
    const totalPaymentAmount = paymentSummary[0]?.totalPayments || 0;
    paymentByMode.forEach((mode) => {
      mode.percentage =
        totalPaymentAmount > 0
          ? ((mode.total / totalPaymentAmount) * 100).toFixed(2)
          : 0;
    });

    // Get previous period for comparison
    let prevPayments = 0;
    let prevDuesCleared = 0;

    if (effectiveStart && effectiveEnd) {
      const prevPeriodStart = new Date(effectiveStart);
      const prevPeriodEnd = new Date(effectiveEnd);
      const periodDiff = prevPeriodEnd - prevPeriodStart;

      prevPeriodStart.setTime(prevPeriodStart.getTime() - periodDiff);
      prevPeriodEnd.setTime(prevPeriodEnd.getTime() - periodDiff);

      const previousPayments = await Transaction.aggregate([
        {
          $match: {
            createdBy: userObjectId,
            type: "payment",
            date: {
              $gte: prevPeriodStart,
              $lte: prevPeriodEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: "$amount" },
            totalDuesCleared: {
              $sum: {
                $max: [0, { $subtract: ["$balanceBefore", "$balanceAfter"] }],
              },
            },
          },
        },
      ]);

      prevPayments = previousPayments[0]?.totalPayments || 0;
      prevDuesCleared = previousPayments[0]?.totalDuesCleared || 0;
    }

    const currentPayments = paymentSummary[0]?.totalPayments || 0;
    const currentDuesCleared = paymentSummary[0]?.totalDuesCleared || 0;

    const paymentsGrowth =
      prevPayments > 0
        ? ((currentPayments - prevPayments) / prevPayments) * 100
        : currentPayments > 0
          ? 100
          : 0;

    const duesClearedGrowth =
      prevDuesCleared > 0
        ? ((currentDuesCleared - prevDuesCleared) / prevDuesCleared) * 100
        : currentDuesCleared > 0
          ? 100
          : 0;

    // Get payment efficiency (how much of payments go to clearing dues vs adding credit)
    const efficiency = paymentSummary[0]
      ? {
        duesClearanceRate:
          paymentSummary[0].totalPayments > 0
            ? (
              (paymentSummary[0].totalDuesCleared /
                paymentSummary[0].totalPayments) *
              100
            ).toFixed(2)
            : 0,
        creditAdditionRate: 0,
      }
      : { duesClearanceRate: 0, creditAdditionRate: 0 };

    res.json({
      summary: {
        ...(paymentSummary[0] || {
          totalPayments: 0,
          totalDuesCleared: 0,
          totalCreditAdded: 0,
          paymentCount: 0,
          avgPayment: 0,
          maxPayment: 0,
          minPayment: 0,
        }),
        efficiency,
      },
      paymentByMode,
      dailyPayments,
      topPayingCustomers,
      growth: {
        payments: {
          percentage: paymentsGrowth.toFixed(2),
          previous: prevPayments,
          current: currentPayments,
          isPositive: paymentsGrowth >= 0,
        },
        duesCleared: {
          percentage: duesClearedGrowth.toFixed(2),
          previous: prevDuesCleared,
          current: currentDuesCleared,
          isPositive: duesClearedGrowth >= 0,
        },
      },
      dateRange: {
        from: effectiveStart,
        to: effectiveEnd,
        days:
          effectiveStart && effectiveEnd
            ? Math.ceil(
              (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)
            ) + 1
            : null,
      },
    });
  } catch (error) {
    console.error("Payment summary error:", error);
    res.status(500).json({
      message: "Error fetching payment data",
      error: error.message,
    });
  }
});

// Get revenue by category with due breakdown
router.get("/by-category", auth, async (req, res) => {
  try {
    const { startDate, endDate, includeEmpty = false } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          $gte: start,
          $lte: end,
        },
      };
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      dateFilter = {
        date: {
          $gte: firstDay,
          $lte: lastDay,
        },
      };
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const revenueByCategory = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $addFields: {
          // Calculate proportional amounts for this item
          itemProportion: {
            $divide: ["$items.subtotal", { $max: ["$total", 1] }],
          },
        },
      },
      {
        $group: {
          _id: "$category._id",
          categoryName: { $first: "$category.name" },
          categoryDescription: { $first: "$category.description" },

          // Total revenue metrics
          totalRevenue: { $sum: "$items.subtotal" },
          quantity: { $sum: "$items.quantity" },
          itemCount: { $sum: 1 },

          // Proportional due amount for items in this category (CURRENT due)
          dueAmount: {
            $sum: {
              $multiply: [{ $ifNull: ["$dueAmount", 0] }, "$itemProportion"],
            },
          },

          // Proportional initial payment (amount paid at invoice time)
          initialPayment: {
            $sum: {
              $multiply: [
                {
                  $subtract: ["$total", { $ifNull: ["$dueAmount", 0] }],
                },
                "$itemProportion",
              ],
            },
          },

          // Tax proportional to this category
          tax: {
            $sum: {
              $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"],
            },
          },

          // Unique invoices and products
          invoices: { $addToSet: "$_id" },
          products: { $addToSet: "$product._id" },

          // Payment method breakdown for items
          paymentMethods: { $push: "$paymentMethod" },
        },
      },
      {
        $addFields: {
          // Count payment methods
          paymentMethodCounts: {
            $reduce: {
              input: "$paymentMethods",
              initialValue: {
                cash: 0,
                online: 0,
                card: 0,
                due: 0,
                mixed: 0,
              },
              in: {
                cash: {
                  $cond: [
                    { $eq: ["$$this", "cash"] },
                    { $add: ["$$value.cash", 1] },
                    "$$value.cash",
                  ],
                },
                online: {
                  $cond: [
                    { $eq: ["$$this", "online"] },
                    { $add: ["$$value.online", 1] },
                    "$$value.online",
                  ],
                },
                card: {
                  $cond: [
                    { $eq: ["$$this", "card"] },
                    { $add: ["$$value.card", 1] },
                    "$$value.card",
                  ],
                },
                due: {
                  $cond: [
                    { $eq: ["$$this", "due"] },
                    { $add: ["$$value.due", 1] },
                    "$$value.due",
                  ],
                },
                mixed: {
                  $cond: [
                    { $eq: ["$$this", "mixed"] },
                    { $add: ["$$value.mixed", 1] },
                    "$$value.mixed",
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          categoryName: 1,
          categoryDescription: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          initialPayment: { $round: ["$initialPayment", 2] },
          dueAmount: { $round: ["$dueAmount", 2] },
          tax: { $round: ["$tax", 2] },
          quantity: { $round: ["$quantity", 2] },
          itemCount: 1,
          invoiceCount: { $size: "$invoices" },
          productCount: { $size: "$products" },

          // Payment method counts
          cashTransactions: "$paymentMethodCounts.cash",
          onlineTransactions: "$paymentMethodCounts.online",
          cardTransactions: "$paymentMethodCounts.card",
          dueTransactions: "$paymentMethodCounts.due",
          mixedTransactions: "$paymentMethodCounts.mixed",

          // Average metrics
          avgTransactionValue: {
            $round: [
              {
                $cond: [
                  { $gt: ["$itemCount", 0] },
                  { $divide: ["$totalRevenue", "$itemCount"] },
                  0,
                ],
              },
              2,
            ],
          },
          avgQuantityPerItem: {
            $round: [
              {
                $cond: [
                  { $gt: ["$itemCount", 0] },
                  { $divide: ["$quantity", "$itemCount"] },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Get total payment amount during the period
    const payments = await Transaction.find({
      createdBy: userId,
      type: "payment",
      ...dateFilter,
    }).lean();

    console.log(
      `\n=== CATEGORY PAYMENT PROCESSING (${payments.length} payments) ===`
    );

    // Calculate total payment amount
    const totalPaymentAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    console.log(`Total payment amount in period: ₹${totalPaymentAmount}`);

    // PERIOD-SPECIFIC LOGIC: Only count payments for invoices in this period
    const categoryPaymentsMap = {};

    // Get all invoice IDs from the period (from our aggregation)
    const periodInvoiceIds = new Set();

    // We need to fetch the actual invoice IDs that were included in our period
    const periodInvoices = await Invoice.find({
      createdBy: userId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    }).select('_id').lean();

    periodInvoices.forEach(inv => periodInvoiceIds.add(inv._id.toString()));

    console.log(`Period has ${periodInvoiceIds.size} invoices`);

    // Only process payments that are linked to invoices IN THIS PERIOD
    const periodPayments = payments.filter(p =>
      p.invoiceId && periodInvoiceIds.has(p.invoiceId.toString())
    );

    const excludedPayments = payments.length - periodPayments.length;
    console.log(`Processing ${periodPayments.length} period-specific payments (excluded ${excludedPayments} payments)`);

    // Process period-specific payments
    if (periodPayments.length > 0) {
      const invoiceIds = [...new Set(periodPayments.map(p => p.invoiceId))];

      // Fetch invoices with category details
      const invoices = await Invoice.find({ _id: { $in: invoiceIds } })
        .populate({
          path: 'items.product',
          populate: { path: 'category' }
        })
        .lean();

      const invoiceMap = {};
      invoices.forEach(inv => {
        const catBreakdown = {};
        let total = 0;

        inv.items.forEach(item => {
          if (item.product && item.product.category) {
            const catId = item.product.category._id.toString();
            catBreakdown[catId] = (catBreakdown[catId] || 0) + item.subtotal;
            total += item.subtotal;
          }
        });

        // Normalize to proportions
        if (total > 0) {
          Object.keys(catBreakdown).forEach(catId => {
            catBreakdown[catId] = catBreakdown[catId] / total;
          });
        }

        invoiceMap[inv._id.toString()] = catBreakdown;
      });

      // Distribute payments to categories based on invoice item breakdown
      periodPayments.forEach(p => {
        const breakdown = invoiceMap[p.invoiceId?.toString()];
        if (breakdown) {
          Object.entries(breakdown).forEach(([catId, proportion]) => {
            categoryPaymentsMap[catId] = (categoryPaymentsMap[catId] || 0) + (p.amount * proportion);
          });
        }
      });
    }

    console.log("\n=== CATEGORY PAYMENTS SUMMARY ===");
    Object.entries(categoryPaymentsMap).forEach(([catId, amount]) => {
      console.log(`Category ${catId}: ₹${amount.toFixed(2)}`);
    });
    console.log(`Total distributed: ₹${Object.values(categoryPaymentsMap).reduce((s, a) => s + a, 0).toFixed(2)}`);
    console.log("=================================\n");

    // Add payments to each category and calculate actual received
    const categoriesWithPayments = revenueByCategory.map((cat) => {
      const paymentsForCategory = categoryPaymentsMap[cat._id?.toString()] || 0;
      const actualReceived = cat.initialPayment + paymentsForCategory;
      // Current due is STILL outstanding (not paid yet)
      const currentDue = cat.dueAmount;

      return {
        ...cat,
        actualReceived: Math.round(actualReceived * 100) / 100,
        paymentsReceived: Math.round(paymentsForCategory * 100) / 100,
        dueAmount: Math.round(currentDue * 100) / 100,
        // Recalculate percentages based on total collected
        receivedPercentage:
          cat.totalRevenue > 0
            ? Math.round((actualReceived / cat.totalRevenue) * 10000) / 100
            : 0,
        duePercentage:
          cat.totalRevenue > 0
            ? Math.round((currentDue / cat.totalRevenue) * 10000) / 100
            : 0,
      };
    });

    // Get all categories if includeEmpty is true
    let allCategories = [];
    if (includeEmpty === "true") {
      const categories = await mongoose
        .model("Category")
        .find({
          createdBy: userId,
        })
        .select("_id name description")
        .lean();

      allCategories = categories.map((cat) => {
        const existing = categoriesWithPayments.find(
          (rc) => rc._id.toString() === cat._id.toString()
        );
        if (existing) {
          return existing;
        } else {
          return {
            _id: cat._id,
            categoryName: cat.name,
            categoryDescription: cat.description,
            totalRevenue: 0,
            actualReceived: 0,
            initialPayment: 0,
            paymentsReceived: 0,
            dueAmount: 0,
            tax: 0,
            quantity: 0,
            itemCount: 0,
            invoiceCount: 0,
            productCount: 0,
            cashTransactions: 0,
            onlineTransactions: 0,
            cardTransactions: 0,
            dueTransactions: 0,
            mixedTransactions: 0,
            receivedPercentage: 0,
            duePercentage: 0,
            avgTransactionValue: 0,
            avgQuantityPerItem: 0,
          };
        }
      });
    } else {
      allCategories = categoriesWithPayments;
    }

    // Calculate overall totals
    const totals = allCategories.reduce(
      (acc, cat) => ({
        totalRevenue: acc.totalRevenue + cat.totalRevenue,
        actualReceived: acc.actualReceived + cat.actualReceived,
        initialPayment: acc.initialPayment + cat.initialPayment,
        paymentsReceived: acc.paymentsReceived + cat.paymentsReceived,
        dueAmount: acc.dueAmount + cat.dueAmount,
        tax: acc.tax + cat.tax,
        totalQuantity: acc.totalQuantity + cat.quantity,
        totalItems: acc.totalItems + cat.itemCount,
        totalInvoices: acc.totalInvoices + cat.invoiceCount,
        totalCategories: acc.totalCategories + 1,
      }),
      {
        totalRevenue: 0,
        actualReceived: 0,
        initialPayment: 0,
        paymentsReceived: 0,
        dueAmount: 0,
        tax: 0,
        totalQuantity: 0,
        totalItems: 0,
        totalInvoices: 0,
        totalCategories: 0,
      }
    );

    totals.receivedPercentage =
      totals.totalRevenue > 0
        ? ((totals.actualReceived / totals.totalRevenue) * 100).toFixed(2)
        : 0;
    totals.duePercentage =
      totals.totalRevenue > 0
        ? ((totals.dueAmount / totals.totalRevenue) * 100).toFixed(2)
        : 0;

    // Calculate TOTAL due payments (ALL payment transactions in period)
    // This matches the revenue summary logic which counts all type:"payment" transactions
    const allDuePayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    console.log(`\n=== DUE PAYMENTS CALCULATION ===`);
    console.log(`Total payments in period: ${payments.length}`);
    console.log(`Payments with invoiceId: ${payments.filter(p => p.invoiceId).length}`);
    console.log(`Payments without invoiceId: ${payments.filter(p => !p.invoiceId).length}`);
    console.log(`Total due payments amount: ₹${allDuePayments}`);
    console.log(`Category-level payments (period invoices only): ₹${totals.paymentsReceived}`);
    console.log(`===============================\n`);

    // Calculate returns for the period
    const stockDateFilter = {};
    if (dateFilter.date) {
      stockDateFilter.timestamp = dateFilter.date;
    }

    const returnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userId,
          type: "return",
          ...stockDateFilter,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ["$adjustment", "$productInfo.price"] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const returns = returnsData[0]?.totalValue || 0;
    const returnsCount = returnsData[0]?.count || 0;

    console.log(`\n=== RETURNS CALCULATION ===`);
    console.log(`Returns found: ${returnsCount} items, Total value: ₹${returns}`);
    console.log(`===========================\n`);

    // Enhanced summary matching revenue dashboard
    const summary = {
      // Basic metrics
      totalRevenue: totals.totalRevenue,
      netRevenue: totals.totalRevenue - returns,
      returns,
      returnsCount,

      // Collection breakdown
      totalCollected: totals.actualReceived, // Initial + Due Payments (for categories in period)
      initialPayment: totals.initialPayment,
      paymentsReceived: totals.paymentsReceived, // Category-level (period invoices only)

      // Due sales metrics
      totalDueRevenue: totals.dueAmount, // Current outstanding
      dueSales: totals.initialPayment > 0 ? totals.totalRevenue - totals.initialPayment : totals.totalRevenue, // Amount given on credit
      duePayments: allDuePayments, // ALL due payments made in period (not just for period invoices)
      paymentCount: payments.length, // Number of payment transactions

      // Other metrics
      invoiceCount: totals.totalInvoices,
      tax: totals.tax,
      totalQuantity: totals.totalQuantity,
      totalItems: totals.totalItems,
      totalCategories: totals.totalCategories,
      receivedPercentage: totals.receivedPercentage,
      duePercentage: totals.duePercentage,
    };

    console.log("\n=== CATEGORY REVENUE SUMMARY ===");
    console.log(`Total Revenue (Gross): ₹${totals.totalRevenue}`);
    console.log(`Returns: ₹${returns}`);
    console.log(`Net Revenue: ₹${summary.netRevenue}`);
    console.log(`Total Collected (Initial + Payments): ₹${totals.actualReceived}`);
    console.log(`  - Initial Payment: ₹${totals.initialPayment}`);
    console.log(`  - Due Payments: ₹${totals.paymentsReceived} (${payments.length} payments)`);
    console.log(`Current Outstanding: ₹${totals.dueAmount}`);
    console.log(`Verification: ${totals.totalRevenue} = ${totals.actualReceived} + ${totals.dueAmount} = ${totals.actualReceived + totals.dueAmount}`);
    console.log("================================\n");

    res.json({
      categories: allCategories,
      totals,
      summary, // Enhanced summary for cards
      dateRange: dateFilter.date || null,
    });
  } catch (error) {
    console.error("Revenue by category error:", error);
    res.status(500).json({
      message: "Error fetching category revenue",
      error: error.message,
    });
  }
});

// Generate revenue PDF
router.post("/generate-pdf", auth, async (req, res) => {
  try {
    const { startDate, endDate, includeDetails = false } = req.body;

    // Fetch revenue data
    const dateFilter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const [summary, transactions, categoryData] = await Promise.all([
      Invoice.aggregate([
        {
          $match: {
            createdBy: req.user.userId,
            status: { $in: ["final", "paid"] },
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalTax: { $sum: "$tax" },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
      includeDetails
        ? Invoice.find({
          createdBy: req.user.userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        })
          .populate("customer._id", "name")
          .sort({ date: -1 })
        : Promise.resolve([]),
      Invoice.aggregate([
        {
          $match: {
            createdBy: req.user.userId,
            status: { $in: ["final", "paid"] },
            ...dateFilter,
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            revenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const pdfData = {
      summary: summary[0] || {},
      transactions,
      categoryData,
      dateRange: { startDate, endDate },
      user: req.user,
    };

    const pdfBuffer = await generateRevenuePDF(pdfData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=revenue-report-${startDate}-to-${endDate}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

// Get advanced analytics with due and credit tracking
router.get("/analytics", auth, async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Calculate date ranges
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(startDate);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date();
        prevStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        prevEndDate = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date();
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
    }

    // Get current period data with due and credit tracking
    const currentData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          actualReceived: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          totalDue: { $sum: { $ifNull: ["$dueAmount", 0] } },
          totalCreditUsed: { $sum: { $ifNull: ["$creditUsed", 0] } },
          totalProfit: { $sum: "$subtotal" },
          invoiceCount: { $sum: 1 },
          avgRevenue: { $avg: "$total" },
          totalTax: { $sum: "$tax" },
          totalSubtotal: { $sum: "$subtotal" },
        },
      },
    ]);

    // Get previous period data
    const previousData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: prevStartDate, $lte: prevEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          actualReceived: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
        },
      },
    ]);

    // Calculate actual profit margin
    const currentRevenue = currentData[0]?.totalRevenue || 0;
    const currentProfit = currentData[0]?.totalProfit || 0;
    const actualProfitMargin =
      currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;

    // Calculate collection rate
    const actualReceived = currentData[0]?.actualReceived || 0;
    const collectionRate =
      currentRevenue > 0 ? (actualReceived / currentRevenue) * 100 : 0;

    // Calculate customer retention
    const customerRetentionData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
        },
      },
      {
        $group: {
          _id: "$customer._id",
          customerName: { $first: "$customer.name" },
          firstPurchase: { $min: "$date" },
          lastPurchase: { $max: "$date" },
          purchaseCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
      {
        $match: {
          _id: { $ne: null },
          purchaseCount: { $gt: 1 },
        },
      },
      {
        $count: "returningCustomers",
      },
    ]);

    const totalCustomers = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          "customer._id": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customer._id",
        },
      },
      {
        $count: "totalCustomers",
      },
    ]);

    const returningCustomers =
      customerRetentionData[0]?.returningCustomers || 0;
    const totalCustomerCount = totalCustomers[0]?.totalCustomers || 1;
    const actualCustomerRetention =
      (returningCustomers / totalCustomerCount) * 100;

    // Calculate average order frequency
    const orderFrequencyData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
          "customer._id": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customer._id",
          orderCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          avgOrderFrequency: { $avg: "$orderCount" },
        },
      },
    ]);

    const actualAvgOrderFrequency =
      orderFrequencyData[0]?.avgOrderFrequency || 0;

    // Calculate conversion rate
    const conversionData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const draftCount =
      conversionData.find((d) => d._id === "draft")?.count || 0;
    const finalCount =
      conversionData.find((d) => d._id === "final")?.count || 0;
    const paidCount = conversionData.find((d) => d._id === "paid")?.count || 0;
    const totalInvoices = draftCount + finalCount + paidCount;
    const convertedInvoices = finalCount + paidCount;
    const actualConversionRate =
      totalInvoices > 0 ? (convertedInvoices / totalInvoices) * 100 : 0;

    // Calculate growth rates
    const previousRevenue = previousData[0]?.totalRevenue || 0;
    const growthRate =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const previousReceived = previousData[0]?.actualReceived || 0;
    const collectionGrowth =
      previousReceived > 0
        ? ((actualReceived - previousReceived) / previousReceived) * 100
        : 0;

    // Get revenue by time of day with payment status
    const timeOfDayData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          hour: { $hour: "$date" },
          total: 1,
          actualReceived: {
            $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
          },
          dueAmount: { $ifNull: ["$dueAmount", 0] },
          creditUsed: { $ifNull: ["$creditUsed", 0] },
        },
      },
      {
        $group: {
          _id: "$hour",
          revenue: { $sum: "$total" },
          received: { $sum: "$actualReceived" },
          due: { $sum: "$dueAmount" },
          credit: { $sum: "$creditUsed" },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          hour: "$_id",
          revenue: { $round: ["$revenue", 2] },
          received: { $round: ["$received", 2] },
          due: { $round: ["$due", 2] },
          credit: { $round: ["$credit", 2] },
          orders: 1,
          collectionRate: {
            $cond: [
              { $gt: ["$revenue", 0] },
              { $multiply: [{ $divide: ["$received", "$revenue"] }, 100] },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { hour: 1 } },
    ]);

    // Get revenue by day of week with payment status
    const dayOfWeekData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$date" },
          total: 1,
          actualReceived: {
            $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
          },
          dueAmount: { $ifNull: ["$dueAmount", 0] },
          creditUsed: { $ifNull: ["$creditUsed", 0] },
        },
      },
      {
        $group: {
          _id: "$dayOfWeek",
          revenue: { $sum: "$total" },
          received: { $sum: "$actualReceived" },
          due: { $sum: "$dueAmount" },
          credit: { $sum: "$creditUsed" },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          day: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Sun" },
                { case: { $eq: ["$_id", 2] }, then: "Mon" },
                { case: { $eq: ["$_id", 3] }, then: "Tue" },
                { case: { $eq: ["$_id", 4] }, then: "Wed" },
                { case: { $eq: ["$_id", 5] }, then: "Thu" },
                { case: { $eq: ["$_id", 6] }, then: "Fri" },
                { case: { $eq: ["$_id", 7] }, then: "Sat" },
              ],
              default: "Unknown",
            },
          },
          revenue: { $round: ["$revenue", 2] },
          received: { $round: ["$received", 2] },
          due: { $round: ["$due", 2] },
          credit: { $round: ["$credit", 2] },
          orders: 1,
          collectionRate: {
            $cond: [
              { $gt: ["$revenue", 0] },
              { $multiply: [{ $divide: ["$received", "$revenue"] }, 100] },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get monthly trend with payment tracking
    const monthlyTrend = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          revenue: { $sum: "$total" },
          received: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
          credit: { $sum: { $ifNull: ["$creditUsed", 0] } },
          profit: { $sum: "$subtotal" },
          expenses: { $sum: "$tax" },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $project: {
          month: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
              ],
            },
          },
          revenue: { $round: ["$revenue", 2] },
          received: { $round: ["$received", 2] },
          due: { $round: ["$due", 2] },
          credit: { $round: ["$credit", 2] },
          profit: { $round: ["$profit", 2] },
          expenses: { $round: ["$expenses", 2] },
          collectionRate: {
            $cond: [
              { $gt: ["$revenue", 0] },
              { $multiply: [{ $divide: ["$received", "$revenue"] }, 100] },
              0,
            ],
          },
          year: "$_id.year",
          monthNum: "$_id.month",
        },
      },
      { $sort: { year: 1, monthNum: 1 } },
    ]);

    // Get category performance with payment status
    const productPerformance = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$category.name", "Uncategorized"] },
          revenue: { $sum: "$items.subtotal" },
          quantity: { $sum: "$items.quantity" },
          transactions: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          revenue: { $round: ["$revenue", 2] },
          score: {
            $min: [
              100,
              {
                $multiply: [
                  { $divide: ["$revenue", { $max: ["$revenue", 1] }] },
                  100,
                ],
              },
            ],
          },
          _id: 0,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // Get customer segments with payment behavior
    const customerSegments = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
          "customer._id": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customer._id",
          customerName: { $first: "$customer.name" },
          totalSpent: { $sum: "$total" },
          actualPaid: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          totalDue: { $sum: { $ifNull: ["$dueAmount", 0] } },
          transactions: { $sum: 1 },
        },
      },
      {
        $bucket: {
          groupBy: "$totalSpent",
          boundaries: [0, 10000, 50000, Infinity],
          default: "Other",
          output: {
            customers: { $sum: 1 },
            totalRevenue: { $sum: "$totalSpent" },
            totalPaid: { $sum: "$actualPaid" },
            totalDue: { $sum: "$totalDue" },
          },
        },
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "Occasional" },
                { case: { $eq: ["$_id", 10000] }, then: "Regular" },
                { case: { $eq: ["$_id", 50000] }, then: "Premium" },
              ],
              default: "Other",
            },
          },
          value: "$customers",
          revenue: { $round: ["$totalRevenue", 2] },
          paid: { $round: ["$totalPaid", 2] },
          due: { $round: ["$totalDue", 2] },
          collectionRate: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $multiply: [{ $divide: ["$totalPaid", "$totalRevenue"] }, 100],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Payment method performance
    const paymentMethodPerformance = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
          avgTransactionValue: { $avg: "$total" },
        },
      },
      {
        $project: {
          method: "$_id",
          count: 1,
          revenue: { $round: ["$revenue", 2] },
          avgTransactionValue: { $round: ["$avgTransactionValue", 2] },
          _id: 0,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      // Core metrics
      growthRate: parseFloat(growthRate.toFixed(2)),
      collectionGrowth: parseFloat(collectionGrowth.toFixed(2)),
      revenuePerInvoice: currentData[0]?.avgRevenue || 0,
      profitMargin: parseFloat(actualProfitMargin.toFixed(2)),
      collectionRate: parseFloat(collectionRate.toFixed(2)),
      conversionRate: parseFloat(actualConversionRate.toFixed(2)),
      customerRetention: parseFloat(actualCustomerRetention.toFixed(2)),
      averageOrderFrequency: parseFloat(actualAvgOrderFrequency.toFixed(2)),

      // Payment summary
      paymentSummary: {
        totalRevenue: currentData[0]?.totalRevenue || 0,
        actualReceived: currentData[0]?.actualReceived || 0,
        totalDue: currentData[0]?.totalDue || 0,
        totalCreditUsed: currentData[0]?.totalCreditUsed || 0,
      },

      // Chart data
      timeOfDayData,
      dayOfWeekData,
      monthlyTrend,
      productPerformance,
      customerSegments,
      paymentMethodPerformance,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      message: "Error fetching analytics data",
      error: error.message,
    });
  }
});

// Export revenue data as CSV
router.post("/export-csv", auth, async (req, res) => {
  try {
    const { startDate, endDate, includeDetails = true } = req.body;

    const dateFilter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const transactions = await Invoice.find({
      createdBy: req.user.userId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    })
      .populate("customer._id", "name phoneNumber")
      .populate("items.product", "name")
      .sort({ date: -1 });

    // Create CSV content
    let csv =
      "Date,Invoice Number,Customer,Payment Method,Items,Subtotal,Tax,Total\n";

    transactions.forEach((trans) => {
      const date = new Date(trans.date).toLocaleDateString();
      const customer = trans.customer?.name || "Walk-in Customer";
      const itemsCount = trans.items.length;

      csv += `"${date}","${trans.invoiceNumber}","${customer}","${trans.paymentMethod}",${itemsCount},${trans.subtotal},${trans.tax},${trans.total}\n`;

      // Add detailed items if requested
      if (includeDetails) {
        trans.items.forEach((item) => {
          csv += `,"","","","${item.product?.name || "Unknown"}",${item.quantity
            },${item.price},${item.subtotal}\n`;
        });
      }
    });

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=revenue-data-${startDate}-to-${endDate}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({ message: "Error exporting CSV" });
  }
});

// Get revenue comparison data with payment tracking
router.get("/comparison", auth, async (req, res) => {
  try {
    const { type = "month-over-month" } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    // Calculate date ranges based on comparison type
    switch (type) {
      case "week-over-week":
        currentEnd = new Date();
        currentStart = new Date();
        currentStart.setDate(currentEnd.getDate() - 6);
        previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 6);
        break;
      case "month-over-month":
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date();
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "quarter-over-quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), quarter * 3, 1);
        currentEnd = new Date();
        previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      case "year-over-year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date();
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    // Get current period data with payment tracking
    const currentData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: currentStart, $lte: currentEnd },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          actualReceived: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          totalDue: { $sum: { $ifNull: ["$dueAmount", 0] } },
          totalCreditUsed: { $sum: { $ifNull: ["$creditUsed", 0] } },
          transactionCount: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
          totalTax: { $sum: "$tax" },
          totalSubtotal: { $sum: "$subtotal" },
          totalProfit: { $sum: "$subtotal" },
        },
      },
    ]);

    // Get previous period data with payment tracking
    const previousData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: previousStart, $lte: previousEnd },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          actualReceived: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          totalDue: { $sum: { $ifNull: ["$dueAmount", 0] } },
          totalCreditUsed: { $sum: { $ifNull: ["$creditUsed", 0] } },
          transactionCount: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
          totalTax: { $sum: "$tax" },
          totalSubtotal: { $sum: "$subtotal" },
          totalProfit: { $sum: "$subtotal" },
        },
      },
    ]);

    // Get customer counts
    const currentCustomers = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: currentStart, $lte: currentEnd },
          "customer._id": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customer._id",
        },
      },
      {
        $count: "count",
      },
    ]);

    const previousCustomers = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: previousStart, $lte: previousEnd },
          "customer._id": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customer._id",
        },
      },
      {
        $count: "count",
      },
    ]);

    // Get conversion rates
    const currentConversion = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: currentStart, $lte: currentEnd },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const previousConversion = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: previousStart, $lte: previousEnd },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate conversion rates
    const calculateConversionRate = (data) => {
      const total = data.reduce((sum, item) => sum + item.count, 0);
      const converted = data
        .filter((item) => ["final", "paid"].includes(item._id))
        .reduce((sum, item) => sum + item.count, 0);
      return total > 0 ? (converted / total) * 100 : 0;
    };

    // Get category breakdown with payment status
    const categoryBreakdown = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          $or: [
            { date: { $gte: currentStart, $lte: currentEnd } },
            { date: { $gte: previousStart, $lte: previousEnd } },
          ],
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            category: { $ifNull: ["$category.name", "Uncategorized"] },
            period: {
              $cond: {
                if: {
                  $and: [
                    { $gte: ["$date", currentStart] },
                    { $lte: ["$date", currentEnd] },
                  ],
                },
                then: "current",
                else: "previous",
              },
            },
          },
          revenue: { $sum: "$items.subtotal" },
          received: {
            $sum: {
              $cond: [
                {
                  $in: ["$paymentMethod", ["cash", "online", "card", "credit"]],
                },
                "$items.subtotal",
                {
                  $subtract: [
                    "$items.subtotal",
                    {
                      $multiply: [
                        "$items.subtotal",
                        {
                          $divide: [
                            { $ifNull: ["$dueAmount", 0] },
                            { $max: ["$total", 1] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          due: {
            $sum: {
              $multiply: [
                "$items.subtotal",
                {
                  $divide: [
                    { $ifNull: ["$dueAmount", 0] },
                    { $max: ["$total", 1] },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          current: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$revenue", 0],
            },
          },
          currentReceived: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$received", 0],
            },
          },
          currentDue: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$due", 0],
            },
          },
          previous: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$revenue", 0],
            },
          },
          previousReceived: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$received", 0],
            },
          },
          previousDue: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$due", 0],
            },
          },
        },
      },
      {
        $project: {
          name: "$_id",
          current: { $round: ["$current", 2] },
          currentReceived: { $round: ["$currentReceived", 2] },
          currentDue: { $round: ["$currentDue", 2] },
          currentCollectionRate: {
            $cond: [
              { $gt: ["$current", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$currentReceived", "$current"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          previous: { $round: ["$previous", 2] },
          previousReceived: { $round: ["$previousReceived", 2] },
          previousDue: { $round: ["$previousDue", 2] },
          previousCollectionRate: {
            $cond: [
              { $gt: ["$previous", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$previousReceived", "$previous"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          growth: {
            $cond: {
              if: { $gt: ["$previous", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ["$current", "$previous"] },
                          "$previous",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
          collectionGrowth: {
            $cond: {
              if: { $gt: ["$previousReceived", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$currentReceived",
                              "$previousReceived",
                            ],
                          },
                          "$previousReceived",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
      { $sort: { current: -1 } },
      { $limit: 5 },
    ]);

    // Get payment method breakdown with collection tracking
    const paymentMethods = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          $or: [
            { date: { $gte: currentStart, $lte: currentEnd } },
            { date: { $gte: previousStart, $lte: previousEnd } },
          ],
        },
      },
      {
        $group: {
          _id: {
            method: "$paymentMethod",
            period: {
              $cond: {
                if: {
                  $and: [
                    { $gte: ["$date", currentStart] },
                    { $lte: ["$date", currentEnd] },
                  ],
                },
                then: "current",
                else: "previous",
              },
            },
          },
          revenue: { $sum: "$total" },
          received: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.method",
          current: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$revenue", 0],
            },
          },
          currentReceived: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$received", 0],
            },
          },
          currentDue: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$due", 0],
            },
          },
          currentCount: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "current"] }, "$count", 0],
            },
          },
          previous: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$revenue", 0],
            },
          },
          previousReceived: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$received", 0],
            },
          },
          previousDue: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$due", 0],
            },
          },
          previousCount: {
            $sum: {
              $cond: [{ $eq: ["$_id.period", "previous"] }, "$count", 0],
            },
          },
        },
      },
      {
        $project: {
          type: "$_id",
          current: { $round: ["$current", 2] },
          currentReceived: { $round: ["$currentReceived", 2] },
          currentDue: { $round: ["$currentDue", 2] },
          currentCount: 1,
          currentCollectionRate: {
            $cond: [
              { $gt: ["$current", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$currentReceived", "$current"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          previous: { $round: ["$previous", 2] },
          previousReceived: { $round: ["$previousReceived", 2] },
          previousDue: { $round: ["$previousDue", 2] },
          previousCount: 1,
          previousCollectionRate: {
            $cond: [
              { $gt: ["$previous", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$previousReceived", "$previous"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          growth: {
            $cond: {
              if: { $gt: ["$previous", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ["$current", "$previous"] },
                          "$previous",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
      { $sort: { current: -1 } },
    ]);

    // Get daily trend data with payment status
    const dailyTrend = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: currentStart, $lte: currentEnd },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          revenue: { $sum: "$total" },
          received: {
            $sum: {
              $subtract: ["$finalTotal", { $ifNull: ["$dueAmount", 0] }],
            },
          },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
          credit: { $sum: { $ifNull: ["$creditUsed", 0] } },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          revenue: { $round: ["$revenue", 2] },
          received: { $round: ["$received", 2] },
          due: { $round: ["$due", 2] },
          credit: { $round: ["$credit", 2] },
          transactions: 1,
          collectionRate: {
            $cond: [
              { $gt: ["$revenue", 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ["$received", "$revenue"] }, 100] },
                  2,
                ],
              },
              0,
            ],
          },
          _id: 0,
        },
      },
    ]);

    // Prepare response data
    const current = currentData[0] || {
      revenue: 0,
      actualReceived: 0,
      totalDue: 0,
      totalCreditUsed: 0,
      transactionCount: 0,
      avgOrderValue: 0,
      totalProfit: 0,
    };

    const previous = previousData[0] || {
      revenue: 0,
      actualReceived: 0,
      totalDue: 0,
      totalCreditUsed: 0,
      transactionCount: 0,
      avgOrderValue: 0,
      totalProfit: 0,
    };

    // Calculate growth metrics
    const revenueGrowth =
      previous.revenue > 0
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100
        : 0;

    const collectionGrowth =
      previous.actualReceived > 0
        ? ((current.actualReceived - previous.actualReceived) /
          previous.actualReceived) *
        100
        : 0;

    const profitGrowth =
      previous.totalProfit > 0
        ? ((current.totalProfit - previous.totalProfit) /
          previous.totalProfit) *
        100
        : 0;

    // Calculate collection rates
    current.collectionRate =
      current.revenue > 0
        ? (current.actualReceived / current.revenue) * 100
        : 0;
    previous.collectionRate =
      previous.revenue > 0
        ? (previous.actualReceived / previous.revenue) * 100
        : 0;

    // Calculate profit margins
    current.profitMargin =
      current.revenue > 0 ? (current.totalProfit / current.revenue) * 100 : 0;
    previous.profitMargin =
      previous.revenue > 0
        ? (previous.totalProfit / previous.revenue) * 100
        : 0;

    // Add customer count and conversion rate
    current.customerCount = currentCustomers[0]?.count || 0;
    previous.customerCount = previousCustomers[0]?.count || 0;
    current.conversionRate = calculateConversionRate(currentConversion);
    previous.conversionRate = calculateConversionRate(previousConversion);

    // Prepare enhanced chart data
    const chartData = [
      {
        metric: "Total Revenue",
        current: parseFloat(current.revenue.toFixed(2)),
        previous: parseFloat(previous.revenue.toFixed(2)),
        growth: parseFloat(revenueGrowth.toFixed(2)),
        isPositive: revenueGrowth >= 0,
      },
      {
        metric: "Actual Received",
        current: parseFloat(current.actualReceived.toFixed(2)),
        previous: parseFloat(previous.actualReceived.toFixed(2)),
        growth: parseFloat(collectionGrowth.toFixed(2)),
        isPositive: collectionGrowth >= 0,
      },
      {
        metric: "Pending Dues",
        current: parseFloat(current.totalDue.toFixed(2)),
        previous: parseFloat(previous.totalDue.toFixed(2)),
        growth:
          previous.totalDue > 0
            ? parseFloat(
              (
                ((current.totalDue - previous.totalDue) / previous.totalDue) *
                100
              ).toFixed(2)
            )
            : 0,
        isPositive: current.totalDue < previous.totalDue, // Less due is positive
      },
      {
        metric: "Credit Used",
        current: parseFloat(current.totalCreditUsed.toFixed(2)),
        previous: parseFloat(previous.totalCreditUsed.toFixed(2)),
        growth:
          previous.totalCreditUsed > 0
            ? parseFloat(
              (
                ((current.totalCreditUsed - previous.totalCreditUsed) /
                  previous.totalCreditUsed) *
                100
              ).toFixed(2)
            )
            : 0,
        isPositive: true, // Credit usage is neutral/contextual
      },
      {
        metric: "Transactions",
        current: current.transactionCount,
        previous: previous.transactionCount,
        growth:
          previous.transactionCount > 0
            ? parseFloat(
              (
                ((current.transactionCount - previous.transactionCount) /
                  previous.transactionCount) *
                100
              ).toFixed(2)
            )
            : 0,
        isPositive: current.transactionCount >= previous.transactionCount,
      },
      {
        metric: "Avg Order Value",
        current: parseFloat(current.avgOrderValue.toFixed(2)),
        previous: parseFloat(previous.avgOrderValue.toFixed(2)),
        growth:
          previous.avgOrderValue > 0
            ? parseFloat(
              (
                ((current.avgOrderValue - previous.avgOrderValue) /
                  previous.avgOrderValue) *
                100
              ).toFixed(2)
            )
            : 0,
        isPositive: current.avgOrderValue >= previous.avgOrderValue,
      },
      {
        metric: "Collection Rate",
        current: parseFloat(current.collectionRate.toFixed(2)),
        previous: parseFloat(previous.collectionRate.toFixed(2)),
        growth: parseFloat(
          (current.collectionRate - previous.collectionRate).toFixed(2)
        ),
        isPositive: current.collectionRate >= previous.collectionRate,
        isPercentage: true,
      },
      {
        metric: "Profit Margin",
        current: parseFloat(current.profitMargin.toFixed(2)),
        previous: parseFloat(previous.profitMargin.toFixed(2)),
        growth: parseFloat(
          (current.profitMargin - previous.profitMargin).toFixed(2)
        ),
        isPositive: current.profitMargin >= previous.profitMargin,
        isPercentage: true,
      },
    ];

    // Prepare trend data for growth visualization
    const trendData = [
      {
        period: "Previous",
        revenue: previous.revenue,
        received: previous.actualReceived,
        due: previous.totalDue,
        collectionRate: previous.collectionRate,
      },
      {
        period: "Current",
        revenue: current.revenue,
        received: current.actualReceived,
        due: current.totalDue,
        collectionRate: current.collectionRate,
      },
    ];

    // Calculate key insights
    const insights = [];

    if (Math.abs(revenueGrowth) > 5) {
      insights.push({
        type: revenueGrowth > 0 ? "positive" : "negative",
        message: `Revenue ${revenueGrowth > 0 ? "increased" : "decreased"
          } by ${Math.abs(revenueGrowth).toFixed(
            1
          )}% compared to the previous period.`,
      });
    }

    if (Math.abs(collectionGrowth) > 5) {
      insights.push({
        type: collectionGrowth > 0 ? "positive" : "negative",
        message: `Collection rate ${collectionGrowth > 0 ? "improved" : "declined"
          } by ${Math.abs(collectionGrowth).toFixed(1)}%.`,
      });
    }

    if (current.totalDue > current.revenue * 0.3) {
      insights.push({
        type: "warning",
        message: `High pending dues detected: ${(
          (current.totalDue / current.revenue) *
          100
        ).toFixed(1)}% of current revenue is pending.`,
      });
    }

    if (current.collectionRate < 70) {
      insights.push({
        type: "warning",
        message: `Collection rate is ${current.collectionRate.toFixed(
          1
        )}%. Consider reviewing credit policies.`,
      });
    }

    if (current.totalCreditUsed > previous.totalCreditUsed * 1.5) {
      insights.push({
        type: "info",
        message: `Credit usage increased significantly by ${(
          ((current.totalCreditUsed - previous.totalCreditUsed) /
            previous.totalCreditUsed) *
          100
        ).toFixed(1)}%.`,
      });
    }

    res.json({
      current: {
        ...current,
        collectionRate: parseFloat(current.collectionRate.toFixed(2)),
        profitMargin: parseFloat(current.profitMargin.toFixed(2)),
      },
      previous: {
        ...previous,
        collectionRate: parseFloat(previous.collectionRate.toFixed(2)),
        profitMargin: parseFloat(previous.profitMargin.toFixed(2)),
      },
      growth: {
        revenue: parseFloat(revenueGrowth.toFixed(2)),
        collection: parseFloat(collectionGrowth.toFixed(2)),
        profit: parseFloat(profitGrowth.toFixed(2)),
        transactions:
          previous.transactionCount > 0
            ? parseFloat(
              (
                ((current.transactionCount - previous.transactionCount) /
                  previous.transactionCount) *
                100
              ).toFixed(2)
            )
            : 0,
        customers:
          previous.customerCount > 0
            ? parseFloat(
              (
                ((current.customerCount - previous.customerCount) /
                  previous.customerCount) *
                100
              ).toFixed(2)
            )
            : 0,
      },
      chartData,
      trendData,
      dailyTrend,
      categoryBreakdown,
      paymentMethods,
      insights,
      comparisonType: type,
      dateRanges: {
        current: {
          start: currentStart,
          end: currentEnd,
          label: getDateRangeLabel(currentStart, currentEnd),
        },
        previous: {
          start: previousStart,
          end: previousEnd,
          label: getDateRangeLabel(previousStart, previousEnd),
        },
      },
    });
  } catch (error) {
    console.error("Comparison error:", error);
    res.status(500).json({
      message: "Error fetching comparison data",
      error: error.message,
    });
  }
});

// Helper function to get date range label
function getDateRangeLabel(start, end) {
  const options = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString(
    "en-US",
    options
  )} - ${end.toLocaleDateString("en-US", options)}`;
}

// Get revenue by products with advanced filtering and due/credit tracking
router.get("/by-products", auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      categoryId,
      productId,
      sortBy = "totalRevenue",
      sortOrder = "desc",
      minRevenue,
      maxRevenue,
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          $gte: start,
          $lte: end,
        },
      };
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Build base match for aggregation
    let baseMatch = {
      createdBy: userId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    };

    // Get product-wise revenue with due and credit tracking
    const productRevenue = await Invoice.aggregate([
      {
        $match: baseMatch,
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",

          // Revenue calculations
          totalRevenue: { $sum: "$items.subtotal" },

          // Calculate actual received amount for this product
          actualReceived: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$items.subtotal",
                {
                  $cond: [
                    { $eq: ["$paymentMethod", "credit"] },
                    "$items.subtotal",
                    {
                      // For due/mixed payments, calculate proportional received amount
                      $subtract: [
                        "$items.subtotal",
                        {
                          $multiply: [
                            "$items.subtotal",
                            {
                              $divide: [
                                { $ifNull: ["$dueAmount", 0] },
                                { $max: ["$total", 1] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },

          // Calculate due amount for this product
          dueAmount: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ["$dueAmount", 0] }, 0] },
                {
                  $multiply: [
                    "$items.subtotal",
                    {
                      $divide: [
                        { $ifNull: ["$dueAmount", 0] },
                        { $max: ["$total", 1] },
                      ],
                    },
                  ],
                },
                0,
              ],
            },
          },

          // Calculate credit used for this product
          creditUsed: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ["$creditUsed", 0] }, 0] },
                {
                  $multiply: [
                    "$items.subtotal",
                    {
                      $divide: [
                        { $ifNull: ["$creditUsed", 0] },
                        { $max: ["$total", 1] },
                      ],
                    },
                  ],
                },
                0,
              ],
            },
          },

          // Other metrics
          totalQuantity: { $sum: "$items.quantity" },
          totalTax: {
            $sum: {
              $multiply: [
                "$items.subtotal",
                {
                  $divide: [
                    { $ifNull: ["$tax", 0] },
                    { $max: ["$subtotal", 1] },
                  ],
                },
              ],
            },
          },
          avgPrice: { $avg: "$items.price" },
          transactionCount: { $sum: 1 },
          invoices: { $addToSet: "$_id" },

          // Payment method breakdown
          cashTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0] },
          },
          onlineTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "online"] }, 1, 0] },
          },
          cardTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "card"] }, 1, 0] },
          },
          dueTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "due"] }, 1, 0] },
          },
          creditTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "credit"] }, 1, 0] },
          },
          mixedTransactions: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "mixed"] }, 1, 0] },
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
      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          productName: "$productInfo.name",
          productDescription: "$productInfo.description",
          categoryId: "$categoryInfo._id",
          categoryName: {
            $ifNull: ["$categoryInfo.name", "Uncategorized"],
          },

          // Revenue metrics
          totalRevenue: { $round: ["$totalRevenue", 2] },
          actualReceived: { $round: ["$actualReceived", 2] },
          dueAmount: { $round: ["$dueAmount", 2] },
          creditUsed: { $round: ["$creditUsed", 2] },

          // Other metrics
          totalQuantity: { $round: ["$totalQuantity", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          avgPrice: { $round: ["$avgPrice", 2] },
          transactionCount: 1,
          invoiceCount: { $size: "$invoices" },

          // Payment methods
          cashTransactions: 1,
          onlineTransactions: 1,
          cardTransactions: 1,
          dueTransactions: 1,
          creditTransactions: 1,
          mixedTransactions: 1,

          // Calculate percentages
          receivedPercentage: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$actualReceived", "$totalRevenue"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          duePercentage: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$dueAmount", "$totalRevenue"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          creditPercentage: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$creditUsed", "$totalRevenue"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },

          // Profit margin
          profitMargin: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ["$totalRevenue", "$totalTax"] },
                          "$totalRevenue",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Apply filters
    let filteredProducts = productRevenue;

    // Category filter
    if (categoryId && categoryId !== "all") {
      filteredProducts = filteredProducts.filter(
        (p) => p.categoryId?.toString() === categoryId
      );
    }

    // Product filter
    if (productId && productId !== "all") {
      filteredProducts = filteredProducts.filter(
        (p) => p.productId.toString() === productId
      );
    }

    // Revenue range filter
    if (minRevenue) {
      filteredProducts = filteredProducts.filter(
        (p) => p.totalRevenue >= parseFloat(minRevenue)
      );
    }
    if (maxRevenue) {
      filteredProducts = filteredProducts.filter(
        (p) => p.totalRevenue <= parseFloat(maxRevenue)
      );
    }

    // Sort products
    const sortField = sortBy === "name" ? "productName" : sortBy;
    filteredProducts.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Calculate summary statistics based on filtered data
    const summary = {
      totalProducts: filteredProducts.length,
      totalRevenue: filteredProducts.reduce(
        (sum, p) => sum + p.totalRevenue,
        0
      ),
      actualReceived: filteredProducts.reduce(
        (sum, p) => sum + p.actualReceived,
        0
      ),
      totalDue: filteredProducts.reduce((sum, p) => sum + p.dueAmount, 0),
      totalCreditUsed: filteredProducts.reduce(
        (sum, p) => sum + p.creditUsed,
        0
      ),
      totalQuantitySold: filteredProducts.reduce(
        (sum, p) => sum + p.totalQuantity,
        0
      ),
      totalTransactions: filteredProducts.reduce(
        (sum, p) => sum + p.transactionCount,
        0
      ),
      totalInvoices: filteredProducts.reduce(
        (sum, p) => sum + p.invoiceCount,
        0
      ),
      avgRevenuePerProduct:
        filteredProducts.length > 0
          ? filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0) /
          filteredProducts.length
          : 0,
      totalTax: filteredProducts.reduce((sum, p) => sum + p.totalTax, 0),
      collectionRate: 0,
    };

    // Calculate collection rate
    if (summary.totalRevenue > 0) {
      summary.collectionRate =
        (summary.actualReceived / summary.totalRevenue) * 100;
    }

    // Get performance categories based on filtered data
    const performanceBreakdown = {
      highPerformers: filteredProducts.filter(
        (p) => p.totalRevenue > summary.avgRevenuePerProduct * 1.5
      ).length,
      averagePerformers: filteredProducts.filter(
        (p) =>
          p.totalRevenue >= summary.avgRevenuePerProduct * 0.5 &&
          p.totalRevenue <= summary.avgRevenuePerProduct * 1.5
      ).length,
      lowPerformers: filteredProducts.filter(
        (p) => p.totalRevenue < summary.avgRevenuePerProduct * 0.5
      ).length,
    };

    // Get revenue trend by month for top products (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const topProductIds = filteredProducts.slice(0, 5).map((p) => p.productId);

    const revenueTrend = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: sixMonthsAgo },
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.product": { $in: topProductIds },
        },
      },
      {
        $group: {
          _id: {
            product: "$items.product",
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          revenue: { $sum: "$items.subtotal" },
          actualReceived: {
            $sum: {
              $cond: [
                {
                  $in: ["$paymentMethod", ["cash", "online", "card", "credit"]],
                },
                "$items.subtotal",
                {
                  $subtract: [
                    "$items.subtotal",
                    {
                      $multiply: [
                        "$items.subtotal",
                        {
                          $divide: [
                            { $ifNull: ["$dueAmount", 0] },
                            { $max: ["$total", 1] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          dueAmount: {
            $sum: {
              $multiply: [
                "$items.subtotal",
                {
                  $divide: [
                    { $ifNull: ["$dueAmount", 0] },
                    { $max: ["$total", 1] },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          productName: "$productInfo.name",
          month: "$_id.month",
          year: "$_id.year",
          revenue: { $round: ["$revenue", 2] },
          actualReceived: { $round: ["$actualReceived", 2] },
          dueAmount: { $round: ["$dueAmount", 2] },
          date: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                    { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                    { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                    { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                    { case: { $eq: ["$_id.month", 5] }, then: "May" },
                    { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                    { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                    { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                    { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                    { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                    { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                    { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                  ],
                  default: "Unknown",
                },
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    res.json({
      products: filteredProducts,
      summary,
      performanceBreakdown,
      revenueTrend,
    });
  } catch (error) {
    console.error("Product revenue error:", error);
    res.status(500).json({
      message: "Error fetching product revenue data",
      error: error.message,
    });
  }
});

// Get product revenue comparison
router.get("/products/comparison", auth, async (req, res) => {
  try {
    const { productIds, startDate, endDate } = req.query;

    if (!productIds) {
      return res.status(400).json({ message: "Product IDs are required" });
    }

    const ids = productIds.split(",").map((id) => mongoose.Types.ObjectId(id));

    const dateFilter =
      startDate && endDate
        ? {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }
        : {};

    const comparison = await Invoice.aggregate([
      {
        $match: {
          createdBy: req.user.userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.product": { $in: ids },
        },
      },
      {
        $group: {
          _id: "$items.product",
          revenue: { $sum: "$items.subtotal" },
          quantity: { $sum: "$items.quantity" },
          transactions: { $sum: 1 },
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
      { $unwind: "$productInfo" },
    ]);

    res.json(comparison);
  } catch (error) {
    console.error("Product comparison error:", error);
    res.status(500).json({ message: "Error comparing products" });
  }
});

// Get revenue transactions with pagination and filters
router.get("/transactions", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      paymentMethod,
      transactionType = "all", // all, sales, payments
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dateFilter = { date: { $gte: start, $lte: end } };
    }

    // Build query for invoices
    const invoiceQuery = {
      createdBy: userObjectId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    };

    // Add payment method filter for invoices
    if (paymentMethod && paymentMethod !== "all") {
      invoiceQuery.paymentMethod = paymentMethod;
    }

    // Build query for payment transactions
    const paymentQuery = {
      createdBy: userObjectId,
      type: "payment",
      ...dateFilter,
    };

    // Add payment method filter for payments (using paymentMode field)
    if (paymentMethod && paymentMethod !== "all") {
      paymentQuery.paymentMode = paymentMethod;
    }

    // Fetch data based on transaction type
    let invoices = [];
    let paymentTransactions = [];
    let allTransactions = [];

    if (transactionType === "all" || transactionType === "sales") {
      invoices = await Invoice.find(invoiceQuery)
        .populate("customer", "name phone email")
        .populate("items.product", "name")
        .lean();
    }

    if (transactionType === "all" || transactionType === "payments") {
      paymentTransactions = await Transaction.find(paymentQuery)
        .populate("customerId", "name phone")
        .lean();
    }

    // Format invoices as transactions
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      type: "sale",
      date: invoice.date,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || "Walk-in Customer",
      paymentMethod: invoice.paymentMethod,
      amount: invoice.total,
      received: invoice.total - (invoice.dueAmount || 0),
      due: invoice.dueAmount || 0,
      creditUsed: invoice.creditUsed || 0,
      items: invoice.items?.map(item => ({
        product: item.product?.name || "Unknown",
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        subtotal: item.quantity * item.price,
      })) || [],
      tax: invoice.tax || 0,
      status: invoice.status,
    }));

    // Format payment transactions
    const formattedPayments = paymentTransactions.map(payment => ({
      _id: payment._id,
      type: "payment",
      date: payment.date,
      customerName: payment.customerId?.name || "Unknown",
      customerPhone: payment.customerId?.phone,
      paymentMethod: payment.paymentMode || "cash",
      amount: payment.amount,
      received: payment.amount,
      duesCleared: payment.balanceBefore - payment.balanceAfter > 0
        ? payment.balanceBefore - payment.balanceAfter
        : 0,
      creditAdded: payment.balanceAfter < 0 ? Math.abs(payment.balanceAfter) : 0,
      balanceBefore: payment.balanceBefore,
      balanceAfter: payment.balanceAfter,
      description: payment.description,
    }));

    // Combine all transactions
    allTransactions = [...formattedInvoices, ...formattedPayments];

    // Sort transactions
    allTransactions.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date);
      } else if (sortBy === "amount") {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
      return 0;
    });

    // Pagination
    const totalItems = allTransactions.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = allTransactions.slice(skip, skip + parseInt(limit));

    // Get summary stats for the filtered results
    const summaryData = await Invoice.aggregate([
      { $match: invoiceQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          actualReceivedRevenue: {
            $sum: { $subtract: ["$total", { $ifNull: ["$dueAmount", 0] }] }
          },
          totalDueRevenue: {
            $sum: { $ifNull: ["$dueAmount", 0] }
          },
          totalTax: { $sum: "$tax" },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    // Get customer returns
    const stockDateFilter = {};
    if (dateFilter.date) {
      stockDateFilter.timestamp = dateFilter.date;
    }

    const returnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userObjectId,
          type: "return",
          ...stockDateFilter,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ["$adjustment", "$productInfo.price"] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReturns = returnsData[0]?.totalValue || 0;

    // Get due payments from Transaction model (using paymentQuery)
    const duePaymentsData = await Transaction.aggregate([
      { $match: paymentQuery },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDuePayments = duePaymentsData[0]?.totalPaid || 0;
    const duesPaymentCount = duePaymentsData[0]?.count || 0;

    // Get payment method breakdown
    const paymentBreakdown = await Invoice.aggregate([
      { $match: invoiceQuery },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$total" },
          actualReceived: {
            $sum: { $subtract: ["$total", { $ifNull: ["$dueAmount", 0] }] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const summary = summaryData[0] || {
      totalRevenue: 0,
      actualReceivedRevenue: 0,
      totalDueRevenue: 0,
      transactionCount: 0,
    };

    const instantCollection = summary.actualReceivedRevenue || 0;

    // Total collected = actual received (from invoices) + due payments (from transactions)
    const totalCollected = instantCollection + totalDuePayments;

    // Net revenue = total revenue - returns
    const netRevenue = (summary.totalRevenue || 0) - totalReturns;

    // Get top customers
    const topCustomers = await Invoice.aggregate([
      { $match: invoiceQuery },
      {
        $group: {
          _id: "$customer",
          totalSpent: { $sum: "$total" },
          actualPaid: {
            $sum: { $subtract: ["$total", { $ifNull: ["$dueAmount", 0] }] },
          },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $ifNull: ["$customerInfo.name", "Walk-in Customer"] },
          totalSpent: 1,
          actualPaid: 1,
          transactionCount: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const currentPage = parseInt(page);

    // Calculate derived values
    console.log('\n=== TRANSACTIONS DEBUG ===');
    console.log('Transaction Type:', transactionType);
    console.log('Summary from DB:', summary);
    console.log('Total Returns:', totalReturns);
    console.log('Total Due Payments:', totalDuePayments);
    console.log('Instant Collection:', instantCollection);
    console.log('Calculated Total Collected:', totalCollected);
    console.log('Calculated Net Revenue:', netRevenue);
    console.log('=========================\n');

    res.json({
      transactions,
      summary: {
        totalRevenue: summary.totalRevenue || 0,
        actualReceivedRevenue: summary.actualReceivedRevenue || 0,
        totalDueRevenue: summary.totalDueRevenue || 0,
        transactionCount: summary.transactionCount || 0,
        returns: totalReturns || 0,
        duePayments: totalDuePayments || 0,
        paymentCount: duesPaymentCount || 0,
        netRevenue: netRevenue || 0,
        totalCollected: totalCollected || 0,
      },
      paymentBreakdown,
      topCustomers,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Transactions error:", error);
    res
      .status(500)
      .json({ message: "Error fetching transactions", error: error.message });
  }
});

module.exports = router;
