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



    // PROFESSIONAL RETURNS HANDLING:
    // Returns should ONLY be actual customer returns (type: "return")
    // Invoice edits use type: "adjustment" and should NOT count as returns
    const stockDateFilter = {};
    if (dateFilter.date) {
      stockDateFilter.timestamp = dateFilter.date;
    }

    const returnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userObjectId,
          type: "return", // ONLY real customer returns, NOT adjustments
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          productName: "$productInfo.name",
          quantity: "$adjustment",
          price: "$productInfo.price",
          // Calculate value including tax if invoice had tax
          value: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                // Include proportional tax: (quantity × price) × (1 + tax/subtotal)
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  {
                    $add: [
                      1,
                      { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                    ]
                  }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] } // No tax
            }
          },
          taxAmount: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                // Tax part = (quantity * price) * (tax / subtotal)
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                ]
              },
              else: 0
            }
          },
          date: "$timestamp",
          reason: "$reason",
          hasTax: { $gt: ["$invoiceInfo.tax", 0] },
          invoiceId: "$invoiceId",
          reference: "$reference",
          paymentMethod: "$invoiceInfo.paymentMethod", // Original payment method (fallback)
          refundMethod: "$refundMethod" // Explicit refund method (preferred)
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);

    const totalReturns = returnsData.reduce((sum, item) => sum + item.value, 0);
    const returnsCount = returnsData.length;
    const totalTaxRefunded = returnsData.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

    // ENHANCED RETURNS BREAKDOWN: Categorize by customer type
    const returnsBreakdown = {
      total: totalReturns,
      count: returnsCount,
      fromDueCustomers: {
        total: 0,
        count: 0,
        items: []
      },
      fromWalkInCustomers: {
        total: 0,
        count: 0,
        items: []
      }
    };

    // Categorize returns by checking if return invoice had a customer (due) or not (walk-in)
    for (const returnItem of returnsData) {
      let invoice = null;

      // Try to get invoice by invoiceId first
      if (returnItem.invoiceId) {
        invoice = await Invoice.findById(returnItem.invoiceId)
          .select('customer paymentMethod total dueAmount')
          .lean();
      }

      // Fallback: If no invoiceId or invoice not found, try to find by reference (invoice number)
      if (!invoice && returnItem.reference) {
        invoice = await Invoice.findOne({
          invoiceNumber: returnItem.reference,
          createdBy: userId
        })
          .select('customer paymentMethod total dueAmount')
          .lean();
      }

      // Categorize based on invoice customer
      if (invoice && invoice.customer && invoice.customer._id) {
        // Return from a due customer (registered customer)
        returnsBreakdown.fromDueCustomers.total += returnItem.value;
        returnsBreakdown.fromDueCustomers.count++;
        returnsBreakdown.fromDueCustomers.items.push({
          ...returnItem,
          customerName: invoice.customer.name,
          invoiceTotal: invoice.total
        });
      } else {
        // Return from walk-in customer (no customer link or no invoice found)
        returnsBreakdown.fromWalkInCustomers.total += returnItem.value;
        returnsBreakdown.fromWalkInCustomers.count++;
        returnsBreakdown.fromWalkInCustomers.items.push(returnItem);
      }
    }

    // Calculate ACTUAL CASH REFUNDS by mode (ONLY walk-in customer returns)
    // Due customer returns are NOT cash refunds - they just reduce the customer's outstanding balance
    const refundsByMode = {};
    returnsBreakdown.fromWalkInCustomers.items.forEach(item => {
      const mode = item.refundMethod || item.paymentMethod || 'cash';
      refundsByMode[mode] = (refundsByMode[mode] || 0) + item.value;
    });

    // Calculate DUE REDUCTIONS by mode (due customer returns - not cash flow)
    const dueReductionsByMode = {};
    returnsBreakdown.fromDueCustomers.items.forEach(item => {
      const mode = item.refundMethod || item.paymentMethod || 'cash';
      dueReductionsByMode[mode] = (dueReductionsByMode[mode] || 0) + item.value;
    });

    // Calculate Tax Breakdown
    const taxBreakdown = await Invoice.aggregate([
      {
        $match: baseQuery,
      },
      {
        $group: {
          _id: null,
          totalTax: { $sum: "$tax" },
          taxCollected: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$tax",
                0
              ]
            }
          },
          taxPending: {
            $sum: {
              $cond: [
                { $eq: ["$paymentMethod", "due"] },
                "$tax",
                0
              ]
            }
          }
        }
      }
    ]);

    const taxInfo = {
      totalTaxCollected: taxBreakdown[0]?.totalTax || 0,
      totalTaxRefunded: totalTaxRefunded || 0,
      taxCollectedInstant: taxBreakdown[0]?.taxCollected || 0,
      taxPending: taxBreakdown[0]?.taxPending || 0
    };

    console.log("\n=== REVENUE SUMMARY ===");
    if (revenueData[0]) {
      console.log(`Total Revenue: ₹${revenueData[0].totalRevenue}`);
      console.log(`Actual Received: ₹${revenueData[0].actualReceivedRevenue}`);
      console.log(`Total Due: ₹${revenueData[0].totalDueRevenue}`);
    }

    // PROFESSIONAL DUE PAYMENTS CALCULATION:
    // Get payments made during the period, but CAP them at actual invoice amounts
    // This prevents counting payments for invoices that were later reduced/cancelled
    // CRITICAL: Exclude return transactions (they are refunds, not payments!)
    const paymentTransactions = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          paymentMode: { $ne: "return" }, // EXCLUDE returns - they're refunds, not payments!
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo"
        }
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$paymentMode",
          totalPaid: { $sum: "$amount" },
          // Calculate dues cleared, but cap at invoice total if invoice exists
          duesCleared: {
            $sum: {
              $cond: {
                if: { $gt: ["$invoiceInfo.total", 0] },
                then: {
                  // Cap the cleared amount at invoice total
                  $min: [
                    { $subtract: ["$balanceBefore", "$balanceAfter"] },
                    "$invoiceInfo.total"
                  ]
                },
                else: {
                  // No invoice reference, use the balance change
                  $subtract: ["$balanceBefore", "$balanceAfter"]
                }
              }
            }
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

      // Get refunds by date from StockHistory
      const refundsByDate = await StockHistory.aggregate([
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
          $lookup: {
            from: "invoices",
            localField: "invoiceId",
            foreignField: "_id",
            as: "invoiceInfo",
          },
        },
        {
          $unwind: {
            path: "$invoiceInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            totalRefunds: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: ["$invoiceInfo.tax", 0] },
                      { $gt: ["$invoiceInfo.subtotal", 0] }
                    ]
                  },
                  then: {
                    // Include proportional tax
                    $multiply: [
                      { $multiply: ["$adjustment", "$productInfo.price"] },
                      {
                        $add: [
                          1,
                          { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                        ]
                      }
                    ]
                  },
                  else: { $multiply: ["$adjustment", "$productInfo.price"] }
                }
              }
            }
          }
        }
      ]);

      // Create a map of refunds by date
      const refundsMap = {};
      refundsByDate.forEach((r) => {
        refundsMap[r._id] = r.totalRefunds;
      });

      // Add payments and refunds to revenueByDate actualReceived and calculate dueAmount
      revenueByDate.forEach((dateEntry) => {
        const paymentsForDate = paymentsMap[dateEntry._id] || 0;
        const refundsForDate = refundsMap[dateEntry._id] || 0;

        dateEntry.actualReceived += paymentsForDate;
        dateEntry.refunds = refundsForDate; // NEW: Add refunds field
        dateEntry.netCollected = dateEntry.actualReceived - refundsForDate; // NEW: Net after refunds

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
      // NEW: Detailed Tax and Returns Data
      taxDetails: taxInfo,
      returnsDetails: returnsData,
      returnsBreakdown: returnsBreakdown, // NEW: Returns categorized by customer type
      paymentsByMode, // NEW: Breakdown of payments received by mode
      refundsByMode, // NEW: Breakdown of ACTUAL CASH refunds by mode (walk-in only)
      dueReductionsByMode, // NEW: Breakdown of due reductions by mode (credit adjustments, not cash flow)
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

    // Get payment transactions (dues cleared) - EXCLUDE returns
    const paymentSummary = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          paymentMode: { $ne: "return" }, // EXCLUDE returns - they're refunds!
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

    // Get payment breakdown by mode (EXCLUDE returns - they're not payments!)
    const paymentByMode = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          paymentMode: { $ne: "return" }, // CRITICAL: Exclude returns
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

    // Get daily payment trend (EXCLUDE returns)
    const dailyPayments = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          paymentMode: { $ne: "return" }, // CRITICAL: Exclude returns
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

    // Get top paying customers with more details (EXCLUDE returns)
    const topPayingCustomers = await Transaction.aggregate([
      {
        $match: {
          createdBy: userObjectId,
          type: "payment",
          paymentMode: { $ne: "return" }, // CRITICAL: Exclude returns
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
          // Calculate proportional amounts for this item based on SUBTOTAL (not total)
          itemProportion: {
            $divide: ["$items.subtotal", { $max: ["$subtotal", 1] }],
          },
        },
      },
      {
        $group: {
          _id: "$category._id",
          categoryName: { $first: "$category.name" },
          categoryDescription: { $first: "$category.description" },

          // Total revenue metrics (including proportional tax)
          totalRevenue: {
            $sum: {
              $add: [
                "$items.subtotal",
                { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
              ]
            }
          },
          quantity: { $sum: "$items.quantity" },
          itemCount: { $sum: 1 },

          // Proportional due amount for items in this category (CURRENT due)
          dueAmount: {
            $sum: {
              $multiply: [{ $ifNull: ["$dueAmount", 0] }, "$itemProportion"],
            },
          },

          // Proportional initial payment (ONLY cash/online/card - instant sales)
          initialPayment: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                {
                  $multiply: [
                    {
                      $subtract: ["$total", { $ifNull: ["$dueAmount", 0] }],
                    },
                    "$itemProportion",
                  ],
                },
                0
              ]
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

    // Get total payment amount during the period (EXCLUDE returns!)
    const payments = await Transaction.find({
      createdBy: userId,
      type: "payment",
      paymentMode: { $ne: "return" },  // CRITICAL: Exclude returns
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

    console.log(`\\n=== CATEGORY PAYMENTS SUMMARY ===`);
    Object.entries(categoryPaymentsMap).forEach(([catId, amount]) => {
      console.log(`Category ${catId}: ₹${amount.toFixed(2)}`);
    });
    console.log(`Total distributed: ₹${Object.values(categoryPaymentsMap).reduce((s, a) => s + a, 0).toFixed(2)}`);
    console.log(`=================================\\n`);

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

    // Calculate returns per category
    const stockDateFilter = {};
    if (dateFilter.date) {
      stockDateFilter.timestamp = dateFilter.date;
    }

    const categoryReturns = await StockHistory.aggregate([
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          categoryInfo: 1,
          adjustment: 1,
          productInfo: 1,
          isWalkIn: {
            $cond: [
              {
                $or: [
                  { $eq: ["$invoiceInfo.customer._id", null] },
                  { $not: ["$invoiceInfo.customer._id"] }
                ]
              },
              true,
              false
            ]
          },
          value: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                // Include proportional tax
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  {
                    $add: [
                      1,
                      { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                    ]
                  }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          }
        }
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          returnQuantity: { $sum: "$adjustment" },
          returnValue: { $sum: "$value" },
          cashRefunds: {
            $sum: {
              $cond: [{ $eq: ["$isWalkIn", true] }, "$value", 0]
            }
          },
          returnCount: { $sum: 1 },
        },
      },
    ]);

    // Create a map for easy lookup
    const categoryReturnsMap = {};
    categoryReturns.forEach((r) => {
      categoryReturnsMap[r._id.toString()] = r;
    });

    // Merge returns into categories and adjust actualReceived
    categoriesWithPayments.forEach((cat) => {
      const r = categoryReturnsMap[cat._id.toString()];
      cat.returnQuantity = r ? r.returnQuantity : 0;
      cat.returnValue = r ? r.returnValue : 0;
      cat.cashRefunds = r ? r.cashRefunds : 0; // Store cash refunds
      cat.returnCount = r ? r.returnCount : 0;
      cat.netRevenue = cat.totalRevenue - cat.returnValue;

      // Adjust actualReceived to exclude cash refunds (matching Total Collected logic)
      // actualReceived currently = initialPayment + paymentsReceived
      // New actualReceived = initialPayment + paymentsReceived - cashRefunds
      cat.actualReceived = Math.round((cat.actualReceived - cat.cashRefunds) * 100) / 100;
    });

    console.log(`\n=== CATEGORY RETURNS SUMMARY ===`);
    categoryReturns.forEach((r) => {
      const cat = categoriesWithPayments.find(c => c._id.toString() === r._id.toString());
      if (cat) {
        console.log(`${cat.categoryName}: ${r.returnCount} returns, ₹${r.returnValue.toFixed(2)}`);
      }
    });
    console.log(`=================================\n`);

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
            returnQuantity: 0,
            returnValue: 0,
            returnCount: 0,
            netRevenue: 0,
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
    const allDuePayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    console.log(`\n=== DUE PAYMENTS CALCULATION ===`);
    console.log(`Total payments in period: ${payments.length}`);
    console.log(`Payments with invoiceId: ${payments.filter(p => p.invoiceId).length}`);
    console.log(`Payments without invoiceId: ${payments.filter(p => !p.invoiceId).length}`);
    console.log(`Total due payments amount: ₹${allDuePayments}`);
    console.log(`Category-level payments (period invoices only): ₹${totals.paymentsReceived}`);
    console.log(`===============================\n`);

    // Calculate returns for the period (total with tax)
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          isWalkIn: {
            $cond: [
              {
                $or: [
                  { $eq: ["$invoiceInfo.customer._id", null] },
                  { $not: ["$invoiceInfo.customer._id"] }
                ]
              },
              true,
              false
            ]
          },
          value: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                // Include proportional tax
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  {
                    $add: [
                      1,
                      { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                    ]
                  }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          }
        }
      },
      {
        $group: {
          _id: "$isWalkIn",
          totalValue: { $sum: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReturns = returnsData.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    const returns = totalReturns;
    const returnsCount = returnsData.reduce((sum, r) => sum + (r.count || 0), 0);
    const cashRefunds = returnsData.find(r => r._id === true)?.totalValue || 0;

    console.log(`\n=== RETURNS CALCULATION ===`);
    console.log(`Returns found: ${returnsCount} items, Total value: ₹${returns}`);
    console.log(`Cash Refunds (Walk-in): ₹${cashRefunds}`);
    console.log(`===========================\n`);

    // FIXED: Count unique invoices to avoid double-counting
    const uniqueInvoiceCount = await Invoice.countDocuments({
      createdBy: userId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    });

    // Override the summed totalInvoices with actual unique count
    totals.totalInvoices = uniqueInvoiceCount;

    // Calculate period-based outstanding (matching dashboard's "Net Position")
    // Get gross due sales (invoices with paymentMethod = 'due')
    const dueSalesTotal = revenueByCategory
      .filter(cat => cat.dueTransactions > 0)
      .reduce((sum, cat) => {
        // For due invoices, we need to calculate the proportional amount
        return sum + (cat.totalRevenue * (cat.dueTransactions / cat.invoiceCount));
      }, 0);

    // Simplified: Calculate from totals
    const grossDueSales = totals.totalRevenue - totals.initialPayment;
    const dueReturns = returnsData.find(r => r._id === false)?.totalValue || 0;
    const netDueSales = grossDueSales - dueReturns;
    const periodBasedOutstanding = netDueSales - allDuePayments;

    // Enhanced summary matching revenue dashboard
    const summary = {
      // Basic metrics
      totalRevenue: totals.totalRevenue,
      netRevenue: totals.totalRevenue - returns,
      returns,
      returnsCount,

      // Collection breakdown (matching dashboard logic)
      totalCollected: totals.initialPayment - cashRefunds + allDuePayments,
      initialPayment: totals.initialPayment,
      paymentsReceived: totals.paymentsReceived,

      // Due sales metrics (period-based)
      totalDueRevenue: Math.round(periodBasedOutstanding * 100) / 100, // Net Position
      dueSales: Math.round(grossDueSales * 100) / 100,
      duePayments: allDuePayments,
      paymentCount: payments.length,

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
      summary,
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
      case "day-over-day":
        // Today vs Yesterday
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case "week-over-week":
        // Current week (Monday to Today) vs Previous week (Monday to Sunday)
        // Match Revenue Dashboard's week calculation
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; else go back (dayOfWeek - 1) days

        // Current week: Monday of this week to Today
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Previous week: Monday to Sunday of last week
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1); // Sunday of previous week
        break;
      case "month-over-month":
        // Current month (1st to Today) vs Previous complete month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
        break;
      case "quarter-over-quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), quarter * 3, 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), quarter * 3, 0); // Last day of previous quarter
        break;
      case "year-over-year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        // Default to month-over-month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Set time boundaries
    currentStart.setHours(0, 0, 0, 0);
    currentEnd.setHours(23, 59, 59, 999);
    previousStart.setHours(0, 0, 0, 0);
    previousEnd.setHours(23, 59, 59, 999);

    // Helper function to get period data with returns
    const getPeriodData = async (start, end) => {
      // Get invoice data
      const invoiceData = await Invoice.aggregate([
        {
          $match: {
            createdBy: userId,
            status: { $in: ["final", "paid"] },
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            grossRevenue: { $sum: "$total" },
            // Gross Walk-in Sales: Only cash/online/card invoices (before any returns)
            grossWalkInSales: {
              $sum: {
                $cond: [
                  { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                  "$total",
                  0
                ]
              }
            },
            // Gross Credit Sales: Only due invoices
            grossCreditSales: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentMethod", "due"] },
                  "$total",
                  0
                ]
              }
            },
            // Total Due from invoices (current outstanding)
            totalDue: { $sum: { $ifNull: ["$dueAmount", 0] } },
            totalCreditUsed: { $sum: { $ifNull: ["$creditUsed", 0] } },
            transactionCount: { $sum: 1 },
            avgOrderValue: { $avg: "$total" },
            totalTax: { $sum: "$tax" },
            totalSubtotal: { $sum: "$subtotal" },
          },
        },
      ]);

      // Get returns for the period (ONLY type: "return", not adjustments)
      const returnsData = await StockHistory.aggregate([
        {
          $match: {
            user: userId,
            type: "return",
            timestamp: { $gte: start, $lte: end },
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
          $lookup: {
            from: "invoices",
            localField: "invoiceId",
            foreignField: "_id",
            as: "invoiceInfo",
          },
        },
        {
          $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true }
        },
        {
          $project: {
            value: {
              $cond: {
                if: { $and: [{ $gt: ["$invoiceInfo.tax", 0] }, { $gt: ["$invoiceInfo.subtotal", 0] }] },
                then: {
                  $multiply: [
                    { $multiply: ["$adjustment", "$productInfo.price"] },
                    { $add: [1, { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }] }
                  ]
                },
                else: { $multiply: ["$adjustment", "$productInfo.price"] }
              }
            },
            isWalkIn: {
              $cond: [
                { $or: [{ $eq: ["$invoiceInfo.customer._id", null] }, { $not: ["$invoiceInfo.customer._id"] }] },
                true,
                false
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalReturns: { $sum: "$value" },
            cashRefunds: { $sum: { $cond: [{ $eq: ["$isWalkIn", true] }, "$value", 0] } },
            creditReturns: { $sum: { $cond: [{ $eq: ["$isWalkIn", false] }, "$value", 0] } },
            returnsCount: { $sum: 1 }
          }
        }
      ]);

      // Get credit payments (dues collected during the period)
      const creditPayments = await Transaction.aggregate([
        {
          $match: {
            createdBy: userId,
            type: "payment",
            paymentMode: { $ne: "return" },
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: "$amount" },
            paymentCount: { $sum: 1 },
          },
        },
      ]);

      const invoice = invoiceData[0] || {
        grossRevenue: 0, grossWalkInSales: 0, grossCreditSales: 0, totalDue: 0,
        totalCreditUsed: 0, transactionCount: 0, avgOrderValue: 0,
        totalTax: 0, totalSubtotal: 0
      };
      const returns = returnsData[0] || { totalReturns: 0, cashRefunds: 0, creditReturns: 0, returnsCount: 0 };
      const payments = creditPayments[0] || { totalPayments: 0, paymentCount: 0 };

      // Calculate metrics matching Revenue Dashboard logic
      const grossRevenue = invoice.grossRevenue || 0;
      const totalReturns = returns.totalReturns || 0;
      const cashRefunds = returns.cashRefunds || 0;
      const creditReturns = returns.creditReturns || 0;
      const netRevenue = grossRevenue - totalReturns;

      // Walk-in sales calculations
      const grossWalkInSales = invoice.grossWalkInSales || 0;
      const netWalkInSales = grossWalkInSales - cashRefunds;

      // Credit sales calculations
      const grossCreditSales = invoice.grossCreditSales || 0;
      const netCreditSales = grossCreditSales - creditReturns;

      // Credit payments received during this period
      const creditPaymentsReceived = payments.totalPayments || 0;

      // Total Collected = Net Walk-in Sales + Credit Payments (matches Dashboard)
      const totalCollected = netWalkInSales + creditPaymentsReceived;

      // Collection Rate = Total Collected / Gross Revenue
      const collectionRate = grossRevenue > 0 ? (totalCollected / grossRevenue) * 100 : 0;

      // Net Position = Gross Credit Sales - Credit Returns - Credit Payments
      const netPosition = Math.max(0, grossCreditSales - creditReturns - creditPaymentsReceived);

      return {
        grossRevenue,
        netRevenue,
        totalReturns,
        cashRefunds,
        creditReturns,
        grossWalkInSales,
        netWalkInSales,
        grossCreditSales,
        netCreditSales,
        creditPayments: creditPaymentsReceived,
        totalCollected,
        totalDue: invoice.totalDue,
        netPosition,
        totalCreditUsed: invoice.totalCreditUsed,
        transactionCount: invoice.transactionCount,
        avgOrderValue: invoice.avgOrderValue || 0,
        totalTax: invoice.totalTax,
        totalSubtotal: invoice.totalSubtotal,
        collectionRate,
        profitMargin: grossRevenue > 0 ? (invoice.totalSubtotal / grossRevenue) * 100 : 0,
        returnsCount: returns.returnsCount,
      };
    };

    // Get data for both periods
    const currentPeriod = await getPeriodData(currentStart, currentEnd);
    const previousPeriod = await getPeriodData(previousStart, previousEnd);

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

    // Prepare response data using the new period data structure
    const current = {
      revenue: currentPeriod.grossRevenue,
      netRevenue: currentPeriod.netRevenue,
      totalReturns: currentPeriod.totalReturns,
      actualReceived: currentPeriod.totalCollected,
      totalDue: currentPeriod.netPosition,
      totalCreditUsed: currentPeriod.totalCreditUsed,
      creditPayments: currentPeriod.creditPayments,
      transactionCount: currentPeriod.transactionCount,
      avgOrderValue: currentPeriod.avgOrderValue,
      totalTax: currentPeriod.totalTax,
      totalSubtotal: currentPeriod.totalSubtotal,
      totalProfit: currentPeriod.netRevenue,
      collectionRate: currentPeriod.collectionRate,
      profitMargin: currentPeriod.profitMargin,
      customerCount: currentCustomers[0]?.count || 0,
      conversionRate: calculateConversionRate(currentConversion),
    };

    const previous = {
      revenue: previousPeriod.grossRevenue,
      netRevenue: previousPeriod.netRevenue,
      totalReturns: previousPeriod.totalReturns,
      actualReceived: previousPeriod.totalCollected,
      totalDue: previousPeriod.netPosition,
      totalCreditUsed: previousPeriod.totalCreditUsed,
      creditPayments: previousPeriod.creditPayments,
      transactionCount: previousPeriod.transactionCount,
      avgOrderValue: previousPeriod.avgOrderValue,
      totalTax: previousPeriod.totalTax,
      totalSubtotal: previousPeriod.totalSubtotal,
      totalProfit: previousPeriod.netRevenue,
      collectionRate: previousPeriod.collectionRate,
      profitMargin: previousPeriod.profitMargin,
      customerCount: previousCustomers[0]?.count || 0,
      conversionRate: calculateConversionRate(previousConversion),
    };

    // Calculate growth metrics
    const revenueGrowth = previous.revenue > 0
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
    const netRevenueGrowth = previous.netRevenue > 0
      ? ((current.netRevenue - previous.netRevenue) / previous.netRevenue) * 100 : 0;
    const collectionGrowth = previous.actualReceived > 0
      ? ((current.actualReceived - previous.actualReceived) / previous.actualReceived) * 100 : 0;
    const profitGrowth = previous.totalProfit > 0
      ? ((current.totalProfit - previous.totalProfit) / previous.totalProfit) * 100 : 0;

    // Prepare enhanced chart data with returns
    const chartData = [
      {
        metric: "Gross Revenue",
        current: parseFloat(current.revenue.toFixed(2)),
        previous: parseFloat(previous.revenue.toFixed(2)),
        growth: parseFloat(revenueGrowth.toFixed(2)),
        isPositive: revenueGrowth >= 0,
      },
      {
        metric: "Returns",
        current: parseFloat(current.totalReturns.toFixed(2)),
        previous: parseFloat(previous.totalReturns.toFixed(2)),
        growth: previous.totalReturns > 0
          ? parseFloat(((current.totalReturns - previous.totalReturns) / previous.totalReturns * 100).toFixed(2)) : 0,
        isPositive: current.totalReturns <= previous.totalReturns,
      },
      {
        metric: "Net Revenue",
        current: parseFloat(current.netRevenue.toFixed(2)),
        previous: parseFloat(previous.netRevenue.toFixed(2)),
        growth: parseFloat(netRevenueGrowth.toFixed(2)),
        isPositive: netRevenueGrowth >= 0,
      },
      {
        metric: "Total Collected",
        current: parseFloat(current.actualReceived.toFixed(2)),
        previous: parseFloat(previous.actualReceived.toFixed(2)),
        growth: parseFloat(collectionGrowth.toFixed(2)),
        isPositive: collectionGrowth >= 0,
      },
      {
        metric: "Credit Payments",
        current: parseFloat(current.creditPayments.toFixed(2)),
        previous: parseFloat(previous.creditPayments.toFixed(2)),
        growth: previous.creditPayments > 0
          ? parseFloat(((current.creditPayments - previous.creditPayments) / previous.creditPayments * 100).toFixed(2)) : 0,
        isPositive: current.creditPayments >= previous.creditPayments,
      },
      {
        metric: "Net Position",
        current: parseFloat(current.totalDue.toFixed(2)),
        previous: parseFloat(previous.totalDue.toFixed(2)),
        growth: previous.totalDue > 0
          ? parseFloat(((current.totalDue - previous.totalDue) / previous.totalDue * 100).toFixed(2)) : 0,
        isPositive: current.totalDue <= previous.totalDue,
      },
      {
        metric: "Transactions",
        current: current.transactionCount,
        previous: previous.transactionCount,
        growth: previous.transactionCount > 0
          ? parseFloat(((current.transactionCount - previous.transactionCount) / previous.transactionCount * 100).toFixed(2)) : 0,
        isPositive: current.transactionCount >= previous.transactionCount,
      },
      {
        metric: "Avg Order Value",
        current: parseFloat(current.avgOrderValue.toFixed(2)),
        previous: parseFloat(previous.avgOrderValue.toFixed(2)),
        growth: previous.avgOrderValue > 0
          ? parseFloat(((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue * 100).toFixed(2)) : 0,
        isPositive: current.avgOrderValue >= previous.avgOrderValue,
      },
      {
        metric: "Collection Rate",
        current: parseFloat(current.collectionRate.toFixed(2)),
        previous: parseFloat(previous.collectionRate.toFixed(2)),
        growth: parseFloat((current.collectionRate - previous.collectionRate).toFixed(2)),
        isPositive: current.collectionRate >= previous.collectionRate,
        isPercentage: true,
      },
    ];

    // Prepare trend data for growth visualization
    const trendData = [
      {
        period: "Previous",
        revenue: previous.revenue,
        netRevenue: previous.netRevenue,
        received: previous.actualReceived,
        due: previous.totalDue,
        collectionRate: previous.collectionRate,
      },
      {
        period: "Current",
        revenue: current.revenue,
        netRevenue: current.netRevenue,
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
        netRevenue: parseFloat(netRevenueGrowth.toFixed(2)),
        collection: parseFloat(collectionGrowth.toFixed(2)),
        profit: parseFloat(profitGrowth.toFixed(2)),
        transactions: previous.transactionCount > 0
          ? parseFloat(((current.transactionCount - previous.transactionCount) / previous.transactionCount * 100).toFixed(2)) : 0,
        customers: previous.customerCount > 0
          ? parseFloat(((current.customerCount - previous.customerCount) / previous.customerCount * 100).toFixed(2)) : 0,
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
      returnsFilter = "all", // Add returns filter parameter
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
        $addFields: {
          // Calculate proportional amounts for this item based on SUBTOTAL
          itemProportion: {
            $divide: ["$items.subtotal", { $max: ["$subtotal", 1] }],
          },
        },
      },
      {
        $group: {
          _id: "$items.product",

          // Revenue calculations (including proportional tax)
          totalRevenue: {
            $sum: {
              $add: [
                "$items.subtotal",
                { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
              ]
            }
          },

          // Calculate actual received amount for this product (Instant Sales)
          actualReceived: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                {
                  $add: [
                    "$items.subtotal",
                    { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
                  ]
                },
                0
              ]
            }
          },

          // Calculate due amount for this product
          dueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentMethod", "due"] },
                {
                  $add: [
                    "$items.subtotal",
                    { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
                  ]
                },
                0
              ]
            }
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

    // Get product-wise returns
    const stockDateFilter = {};
    if (dateFilter.date) {
      stockDateFilter.timestamp = dateFilter.date;
    }

    const productReturns = await StockHistory.aggregate([
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          product: 1,
          adjustment: 1,
          productInfo: 1,
          isWalkIn: {
            $cond: [
              {
                $or: [
                  { $eq: ["$invoiceInfo.customer._id", null] },
                  { $not: ["$invoiceInfo.customer._id"] }
                ]
              },
              true,
              false
            ]
          },
          value: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                // Include proportional tax
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  {
                    $add: [
                      1,
                      { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                    ]
                  }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          }
        }
      },
      {
        $group: {
          _id: "$product",
          returnQuantity: { $sum: "$adjustment" },
          returnValue: { $sum: "$value" },
          cashRefunds: {
            $sum: {
              $cond: [{ $eq: ["$isWalkIn", true] }, "$value", 0]
            }
          },
          returnCount: { $sum: 1 },
        },
      },
    ]);

    // Create a map for easy lookup
    const returnsMap = {};
    productReturns.forEach((r) => {
      returnsMap[r._id.toString()] = r;
    });

    // Merge returns into productRevenue
    productRevenue.forEach((p) => {
      const r = returnsMap[p.productId.toString()];
      p.returnQuantity = r ? r.returnQuantity : 0;
      p.returnValue = r ? r.returnValue : 0;
      p.cashRefunds = r ? r.cashRefunds : 0;
      p.returnCount = r ? r.returnCount : 0;
      p.netRevenue = p.totalRevenue - p.returnValue;

      // Adjust actualReceived to exclude cash refunds (matching Total Collected logic)
      p.actualReceived = Math.round((p.actualReceived - p.cashRefunds) * 100) / 100;
    });

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

    // Returns filter - IMPORTANT: Filter before calculating summary
    if (returnsFilter === "withReturns") {
      filteredProducts = filteredProducts.filter((p) => p.returnValue > 0);
    } else if (returnsFilter === "withoutReturns") {
      filteredProducts = filteredProducts.filter(
        (p) => p.returnValue === 0 || !p.returnValue
      );
    }
    // If "all", don't filter

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
      totalReturns: filteredProducts.reduce((sum, p) => sum + p.returnValue, 0),
      netRevenue: filteredProducts.reduce((sum, p) => sum + p.netRevenue, 0),
      collectionRate: 0,
    };

    // FIXED: Count unique invoices to avoid double-counting
    const uniqueInvoiceCount = await Invoice.countDocuments({
      createdBy: userId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    });

    // Override the summed totalInvoices with actual unique count
    summary.totalInvoices = uniqueInvoiceCount;

    // Calculate collection rate
    if (summary.totalRevenue > 0) {
      summary.collectionRate =
        (summary.actualReceived / summary.totalRevenue) * 100;
    }

    // Get due payments (type: "payment" transactions) for the period
    const paymentQuery = {
      createdBy: userId,
      type: "payment",
      paymentMode: { $ne: "return" }, // Exclude returns
      ...dateFilter,
    };

    const payments = await mongoose.model("Transaction").find(paymentQuery).lean();
    const totalDuePayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCashRefunds = filteredProducts.reduce((sum, p) => sum + (p.cashRefunds || 0), 0);

    // Add enhanced fields to summary
    summary.duePayments = totalDuePayments;
    summary.paymentCount = payments.length;
    summary.totalCollected = summary.actualReceived + totalDuePayments;
    // Gross Due Sales = Total Revenue - Instant Sales
    // Instant Sales = Actual Received + Cash Refunds
    summary.dueSales = Math.round((summary.totalRevenue - (summary.actualReceived + totalCashRefunds)) * 100) / 100;

    // Calculate Net Position (Period Based Outstanding)
    // Net Position = Gross Due Sales - Due Returns - Due Payments
    const dueReturns = summary.totalReturns - totalCashRefunds;
    const periodBasedOutstanding = summary.dueSales - dueReturns - summary.duePayments;
    summary.totalDueRevenue = Math.round(periodBasedOutstanding * 100) / 100;
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

    // DYNAMIC REVENUE TREND - Adapt to selected period
    // Determine trend date range and grouping based on selected filter period
    let trendStartDate, trendEndDate, trendGroupBy;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      // Determine granularity based on period length
      if (daysDiff <= 1) {
        // Today: Hourly grouping
        trendGroupBy = "hour";
        trendStartDate = start;
        trendEndDate = end;
      } else if (daysDiff <= 7) {
        // Week: Daily grouping
        trendGroupBy = "day";
        trendStartDate = start;
        trendEndDate = end;
      } else if (daysDiff <= 31) {
        // Month: Daily grouping
        trendGroupBy = "day";
        trendStartDate = start;
        trendEndDate = end;
      } else if (daysDiff <= 92) {
        // Quarter: Weekly grouping (approximate)
        trendGroupBy = "week";
        trendStartDate = start;
        trendEndDate = end;
      } else {
        // Longer periods: Monthly grouping
        trendGroupBy = "month";
        trendStartDate = start;
        trendEndDate = end;
      }
    } else {
      // No date filter: Default to last 6 months, monthly grouping
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      trendStartDate = sixMonthsAgo;
      trendEndDate = new Date();
      trendEndDate.setHours(23, 59, 59, 999);
      trendGroupBy = "month";
    }

    const topProductIds = filteredProducts.slice(0, 5).map((p) => p.productId);

    // Build dynamic grouping based on trendGroupBy
    let groupByExpression;
    let sortExpression;
    let dateFormatExpression;

    if (trendGroupBy === "hour") {
      groupByExpression = {
        product: "$items.product",
        hour: { $hour: "$date" },
        day: { $dayOfMonth: "$date" },
        month: { $month: "$date" },
        year: { $year: "$date" },
      };
      sortExpression = { year: 1, month: 1, day: 1, hour: 1 };
      dateFormatExpression = {
        $concat: [
          { $toString: "$_id.day" },
          "/",
          { $toString: "$_id.month" },
          " ",
          {
            $cond: [
              { $lt: ["$_id.hour", 10] },
              { $concat: ["0", { $toString: "$_id.hour" }] },
              { $toString: "$_id.hour" },
            ],
          },
          ":00",
        ],
      };
    } else if (trendGroupBy === "day") {
      groupByExpression = {
        product: "$items.product",
        day: { $dayOfMonth: "$date" },
        month: { $month: "$date" },
        year: { $year: "$date" },
      };
      sortExpression = { year: 1, month: 1, day: 1 };
      dateFormatExpression = {
        $concat: [
          { $toString: "$_id.day" },
          " ",
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
        ],
      };
    } else if (trendGroupBy === "week") {
      groupByExpression = {
        product: "$items.product",
        week: { $week: "$date" },
        year: { $year: "$date" },
      };
      sortExpression = { year: 1, week: 1 };
      dateFormatExpression = {
        $concat: ["Week ", { $toString: "$_id.week" }, " ", { $toString: "$_id.year" }],
      };
    } else {
      // month
      groupByExpression = {
        product: "$items.product",
        month: { $month: "$date" },
        year: { $year: "$date" },
      };
      sortExpression = { year: 1, month: 1 };
      dateFormatExpression = {
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
      };
    }

    const revenueTrend = topProductIds.length > 0 ? await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: trendStartDate, $lte: trendEndDate },
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.product": { $in: topProductIds },
        },
      },
      {
        $addFields: {
          // Calculate proportional tax for this item
          itemProportion: {
            $divide: ["$items.subtotal", { $max: ["$subtotal", 1] }],
          },
        },
      },
      {
        $group: {
          _id: groupByExpression,
          // Revenue including proportional tax
          revenue: {
            $sum: {
              $add: [
                "$items.subtotal",
                { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
              ]
            }
          },
          // Actual received including proportional tax
          actualReceived: {
            $sum: {
              $cond: [
                {
                  $in: ["$paymentMethod", ["cash", "online", "card", "credit"]],
                },
                {
                  $add: [
                    "$items.subtotal",
                    { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
                  ]
                },
                {
                  $subtract: [
                    {
                      $add: [
                        "$items.subtotal",
                        { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
                      ]
                    },
                    {
                      $multiply: [
                        {
                          $add: [
                            "$items.subtotal",
                            { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
                          ]
                        },
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
          // Due amount including proportional tax
          dueAmount: {
            $sum: {
              $multiply: [
                {
                  $add: [
                    "$items.subtotal",
                    { $multiply: [{ $ifNull: ["$tax", 0] }, "$itemProportion"] }
                  ]
                },
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
          productId: "$_id.product",
          productName: "$productInfo.name",
          ...(trendGroupBy === "hour" && { hour: "$_id.hour", day: "$_id.day" }),
          ...(trendGroupBy === "day" && { day: "$_id.day" }),
          ...(trendGroupBy === "week" && { week: "$_id.week" }),
          ...(trendGroupBy !== "hour" && { month: "$_id.month" }),
          year: "$_id.year",
          revenue: { $round: ["$revenue", 2] },
          actualReceived: { $round: ["$actualReceived", 2] },
          dueAmount: { $round: ["$dueAmount", 2] },
          date: dateFormatExpression,
        },
      },
      { $sort: sortExpression },
    ]) : [];

    // Get returns trend for top products (matching the same period and grouping)
    let returnsGroupByExpression;
    if (trendGroupBy === "hour") {
      returnsGroupByExpression = {
        product: "$product",
        hour: { $hour: "$timestamp" },
        day: { $dayOfMonth: "$timestamp" },
        month: { $month: "$timestamp" },
        year: { $year: "$timestamp" },
      };
    } else if (trendGroupBy === "day") {
      returnsGroupByExpression = {
        product: "$product",
        day: { $dayOfMonth: "$timestamp" },
        month: { $month: "$timestamp" },
        year: { $year: "$timestamp" },
      };
    } else if (trendGroupBy === "week") {
      returnsGroupByExpression = {
        product: "$product",
        week: { $week: "$timestamp" },
        year: { $year: "$timestamp" },
      };
    } else {
      returnsGroupByExpression = {
        product: "$product",
        month: { $month: "$timestamp" },
        year: { $year: "$timestamp" },
      };
    }

    const returnsTrend = topProductIds.length > 0 ? await StockHistory.aggregate([
      {
        $match: {
          user: userId,
          type: "return",
          product: { $in: topProductIds },
          timestamp: { $gte: trendStartDate, $lte: trendEndDate },
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          groupKey: returnsGroupByExpression,
          // Calculate value including proportional tax from invoice
          value: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                // Include proportional tax: (quantity × price) × (1 + tax/subtotal)
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  {
                    $add: [
                      1,
                      { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                    ]
                  }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] } // No tax
            }
          }
        }
      },
      {
        $group: {
          _id: "$groupKey",
          returnValue: {
            $sum: "$value",
          },
        },
      },
    ]) : [];

    // Merge returns into revenueTrend
    const returnsTrendMap = {};
    returnsTrend.forEach((r) => {
      let key;
      if (trendGroupBy === "hour") {
        key = `${r._id.product}-${r._id.hour}-${r._id.day}-${r._id.month}-${r._id.year}`;
      } else if (trendGroupBy === "day") {
        key = `${r._id.product}-${r._id.day}-${r._id.month}-${r._id.year}`;
      } else if (trendGroupBy === "week") {
        key = `${r._id.product}-${r._id.week}-${r._id.year}`;
      } else {
        key = `${r._id.product}-${r._id.month}-${r._id.year}`;
      }
      returnsTrendMap[key] = r.returnValue;
    });

    const finalRevenueTrend = revenueTrend.map((item) => {
      let key;
      if (trendGroupBy === "hour") {
        key = `${item.productId}-${item.hour}-${item.day}-${item.month}-${item.year}`;
      } else if (trendGroupBy === "day") {
        key = `${item.productId}-${item.day}-${item.month}-${item.year}`;
      } else if (trendGroupBy === "week") {
        key = `${item.productId}-${item.week}-${item.year}`;
      } else {
        key = `${item.productId}-${item.month}-${item.year}`;
      }
      const returnValue = returnsTrendMap[key] || 0;
      return {
        ...item,
        returnValue: parseFloat(returnValue.toFixed(2)),
        netRevenue: parseFloat((item.revenue - returnValue).toFixed(2)),
      };
    });

    res.json({
      products: filteredProducts,
      summary,
      performanceBreakdown,
      revenueTrend: finalRevenueTrend,
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
      // CRITICAL: Exclude return transactions (they are refunds, not payments)
      paymentTransactions = await Transaction.find({
        ...paymentQuery,
        paymentMode: { $ne: "return" }
      })
        .populate("customerId", "name phone")
        .lean();
    }

    // Format invoices as transactions (with 2 decimal rounding)
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      type: "sale",
      date: invoice.date,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || "Walk-in Customer",
      paymentMethod: invoice.paymentMethod,
      amount: Math.round((invoice.total || 0) * 100) / 100,
      received: Math.round(((invoice.total || 0) - (invoice.dueAmount || 0)) * 100) / 100,
      due: Math.round((invoice.dueAmount || 0) * 100) / 100,
      creditUsed: Math.round((invoice.creditUsed || 0) * 100) / 100,
      items: invoice.items?.map(item => ({
        product: item.product?.name || "Unknown",
        quantity: Math.round((item.quantity || 0) * 100) / 100,
        unit: item.unit,
        price: Math.round((item.price || 0) * 100) / 100,
        subtotal: Math.round((item.quantity * item.price) * 100) / 100,
      })) || [],
      tax: Math.round((invoice.tax || 0) * 100) / 100,
      status: invoice.status,
    }));

    // Format payment transactions (with 2 decimal rounding)
    const formattedPayments = paymentTransactions.map(payment => ({
      _id: payment._id,
      type: "payment",
      date: payment.date,
      customerName: payment.customerId?.name || "Unknown",
      customerPhone: payment.customerId?.phone,
      paymentMethod: payment.paymentMode || "cash",
      amount: Math.round((payment.amount || 0) * 100) / 100,
      received: Math.round((payment.amount || 0) * 100) / 100,
      duesCleared: Math.round(Math.max(0, (payment.balanceBefore || 0) - (payment.balanceAfter || 0)) * 100) / 100,
      creditAdded: Math.round(Math.max(0, Math.abs(payment.balanceAfter < 0 ? payment.balanceAfter : 0)) * 100) / 100,
      balanceBefore: Math.round((payment.balanceBefore || 0) * 100) / 100,
      balanceAfter: Math.round((payment.balanceAfter || 0) * 100) / 100,
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
          // Calculate instant revenue (Cash/Online/Card) separately to avoid double counting due payments
          instantReceivedRevenue: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                { $subtract: ["$total", { $ifNull: ["$dueAmount", 0] }] },
                0
              ]
            }
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $gt: ["$invoiceInfo.tax", 0] },
                    { $gt: ["$invoiceInfo.subtotal", 0] }
                  ]
                },
                then: {
                  // Include proportional tax: (quantity × price) × (1 + tax/subtotal)
                  $multiply: [
                    { $multiply: ["$adjustment", "$productInfo.price"] },
                    {
                      $add: [
                        1,
                        { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }
                      ]
                    }
                  ]
                },
                else: { $multiply: ["$adjustment", "$productInfo.price"] }
              }
            }
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReturns = returnsData[0]?.totalValue || 0;

    // Get due payments from Transaction model (EXCLUDE returns!)
    const duePaymentsData = await Transaction.aggregate([
      {
        $match: {
          ...paymentQuery,
          paymentMode: { $ne: "return" }  // CRITICAL: Exclude returns
        }
      },
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
      instantReceivedRevenue: 0,
      totalDueRevenue: 0,
      transactionCount: 0,
    };

    const instantCollection = summary.instantReceivedRevenue || 0;

    // Calculate cash refunds (walk-in customer returns only)
    const cashReturnsData = await StockHistory.aggregate([
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: {
          path: "$invoiceInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          isWalkIn: {
            $cond: [
              {
                $or: [
                  { $eq: ["$invoiceInfo.customer._id", null] },
                  { $not: ["$invoiceInfo.customer._id"] }
                ]
              },
              true,
              false
            ]
          },
          value: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] },
                ],
              },
              then: {
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  {
                    $add: [
                      1,
                      { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] },
                    ],
                  },
                ],
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] },
            },
          },
        },
      },
      {
        $group: {
          _id: "$isWalkIn",
          totalValue: { $sum: "$value" },
        },
      },
    ]);

    // Get cash refunds (walk-in returns only)
    const cashRefunds = cashReturnsData.find(r => r._id === true)?.totalValue || 0;

    // Total collected = instant collection - cash refunds + due payments
    const totalCollected = instantCollection - cashRefunds + totalDuePayments;

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

    // Calculate period-based outstanding (matching dashboard's "Still Outstanding")
    // Get gross due sales (invoices with paymentMethod = 'due')
    const dueSalesData = await Invoice.aggregate([
      {
        $match: {
          ...invoiceQuery,
          paymentMethod: 'due'
        }
      },
      {
        $group: {
          _id: null,
          grossDueSales: { $sum: "$total" }
        }
      }
    ]);

    const grossDueSales = dueSalesData[0]?.grossDueSales || 0;

    // Get due customer returns (credit adjustments)
    const dueReturns = cashReturnsData.find(r => r._id === false)?.totalValue || 0;

    // Calculate net due sales and period-based outstanding
    const netDueSales = grossDueSales - dueReturns;
    const periodBasedOutstanding = netDueSales - totalDuePayments;

    // Calculate derived values
    console.log('\n=== TRANSACTIONS DEBUG ===');
    console.log('Transaction Type:', transactionType);
    console.log('Gross Due Sales:', grossDueSales);
    console.log('Due Customer Returns:', dueReturns);
    console.log('Net Due Sales:', netDueSales);
    console.log('Total Due Payments:', totalDuePayments);
    console.log('Period-Based Outstanding:', periodBasedOutstanding);
    console.log('Total Returns:', totalReturns);
    console.log('Cash Refunds (Walk-in only):', cashRefunds);
    console.log('Instant Collection:', instantCollection);
    console.log('Calculated Total Collected:', totalCollected);
    console.log('Calculated Net Revenue:', netRevenue);
    console.log('=========================\n');

    res.json({
      transactions,
      summary: {
        totalRevenue: Math.round((summary.totalRevenue || 0) * 100) / 100,
        actualReceivedRevenue: Math.round((summary.actualReceivedRevenue || 0) * 100) / 100,
        totalDueRevenue: Math.round(periodBasedOutstanding * 100) / 100, // Period-based outstanding
        transactionCount: summary.transactionCount || 0,
        invoiceCount: summary.transactionCount || 0, // Number of sales/invoices
        returns: Math.round((totalReturns || 0) * 100) / 100,
        duePayments: Math.round((totalDuePayments || 0) * 100) / 100,
        paymentCount: duesPaymentCount || 0,
        netRevenue: Math.round((netRevenue || 0) * 100) / 100,
        totalCollected: Math.round((totalCollected || 0) * 100) / 100,
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

// Get Product Returns Analytics
router.get("/returns", auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      categoryId,
      productId,
      sortBy = "returnValue",
      sortOrder = "desc",
    } = req.query;

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate || endDate) {
      dateFilter.timestamp = startDate
        ? { $gte: new Date(startDate) }
        : { $lte: new Date(endDate) };
    }

    // Build base match query
    const matchQuery = {
      user: userId,
      type: "return",
      ...dateFilter,
    };

    // Get product-wise returns data with tax calculation
    const productReturnsAggregation = [
      { $match: matchQuery },
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
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
        $addFields: {
          // Calculate return value including proportional tax (matching Dashboard logic)
          returnValueWithTax: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  { $add: [1, { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }] }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          }
        }
      },
      {
        $group: {
          _id: "$product",
          productName: { $first: "$productInfo.name" },
          productSku: { $first: "$productInfo.sku" },
          productPrice: { $first: "$productInfo.price" },
          categoryId: { $first: "$categoryInfo._id" },
          categoryName: {
            $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
          },
          returnQuantity: { $sum: "$adjustment" },
          returnCount: { $sum: 1 },
          returnValue: { $sum: "$returnValueWithTax" },
          lastReturnDate: { $max: "$timestamp" },
          avgReturnQuantity: { $avg: "$adjustment" },
        },
      },
    ];

    // Add category filter if provided
    if (categoryId && categoryId !== "all") {
      productReturnsAggregation.push({
        $match: { categoryId: new mongoose.Types.ObjectId(categoryId) },
      });
    }

    // Add product filter if provided
    if (productId && productId !== "all") {
      productReturnsAggregation.push({
        $match: { _id: new mongoose.Types.ObjectId(productId) },
      });
    }

    // Add sorting
    const sortField = {
      returnValue: "returnValue",
      returnQuantity: "returnQuantity",
      returnCount: "returnCount",
      productName: "productName",
      lastReturnDate: "lastReturnDate",
    }[sortBy] || "returnValue";

    productReturnsAggregation.push({
      $sort: { [sortField]: sortOrder === "desc" ? -1 : 1 },
    });

    const productReturns = await StockHistory.aggregate(
      productReturnsAggregation
    );

    // Calculate summary statistics with walk-in vs due breakdown
    const summaryData = await StockHistory.aggregate([
      { $match: matchQuery },
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          returnValueWithTax: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  { $add: [1, { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }] }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          },
          // Walk-in = no customer ID (cash refund)
          isWalkIn: {
            $cond: [
              {
                $or: [
                  { $eq: ["$invoiceInfo.customer._id", null] },
                  { $not: ["$invoiceInfo.customer._id"] }
                ]
              },
              true,
              false
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalReturnValue: { $sum: "$returnValueWithTax" },
          totalReturnQuantity: { $sum: "$adjustment" },
          totalReturnCount: { $sum: 1 },
          uniqueProducts: { $addToSet: "$product" },
          // Walk-in returns (cash refunds - money out)
          cashRefundsValue: {
            $sum: { $cond: [{ $eq: ["$isWalkIn", true] }, "$returnValueWithTax", 0] }
          },
          cashRefundsCount: {
            $sum: { $cond: [{ $eq: ["$isWalkIn", true] }, 1, 0] }
          },
          cashRefundsQuantity: {
            $sum: { $cond: [{ $eq: ["$isWalkIn", true] }, "$adjustment", 0] }
          },
          // Due customer returns (credit adjustments - no cash out)
          creditAdjustmentsValue: {
            $sum: { $cond: [{ $eq: ["$isWalkIn", false] }, "$returnValueWithTax", 0] }
          },
          creditAdjustmentsCount: {
            $sum: { $cond: [{ $eq: ["$isWalkIn", false] }, 1, 0] }
          },
          creditAdjustmentsQuantity: {
            $sum: { $cond: [{ $eq: ["$isWalkIn", false] }, "$adjustment", 0] }
          },
        },
      },
      {
        $project: {
          totalReturnValue: 1,
          totalReturnQuantity: 1,
          totalReturnCount: 1,
          uniqueProductCount: { $size: "$uniqueProducts" },
          cashRefunds: {
            value: "$cashRefundsValue",
            count: "$cashRefundsCount",
            quantity: "$cashRefundsQuantity"
          },
          creditAdjustments: {
            value: "$creditAdjustmentsValue",
            count: "$creditAdjustmentsCount",
            quantity: "$creditAdjustmentsQuantity"
          }
        },
      },
    ]);

    const summary = summaryData[0] || {
      totalReturnValue: 0,
      totalReturnQuantity: 0,
      totalReturnCount: 0,
      uniqueProductCount: 0,
      cashRefunds: { value: 0, count: 0, quantity: 0 },
      creditAdjustments: { value: 0, count: 0, quantity: 0 },
    };

    // Get category-wise returns breakdown with tax
    const categoryReturns = await StockHistory.aggregate([
      { $match: matchQuery },
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
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
        $addFields: {
          returnValueWithTax: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  { $add: [1, { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }] }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          }
        }
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          categoryName: {
            $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
          },
          returnValue: { $sum: "$returnValueWithTax" },
          returnQuantity: { $sum: "$adjustment" },
          returnCount: { $sum: 1 },
        },
      },
      { $sort: { returnValue: -1 } },
    ]);

    // Get returns trend (daily/weekly/monthly based on date range)
    const getTrendGrouping = () => {
      if (!startDate || !endDate) {
        return {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
        };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 31) {
        // Daily grouping for <= 1 month
        return {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          day: { $dayOfMonth: "$timestamp" },
        };
      } else if (daysDiff <= 365) {
        // Weekly grouping for <= 1 year
        return {
          year: { $year: "$timestamp" },
          week: { $week: "$timestamp" },
        };
      } else {
        // Monthly grouping for > 1 year
        return {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
        };
      }
    };

    const trendData = await StockHistory.aggregate([
      { $match: matchQuery },
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
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          returnValueWithTax: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$invoiceInfo.tax", 0] },
                  { $gt: ["$invoiceInfo.subtotal", 0] }
                ]
              },
              then: {
                $multiply: [
                  { $multiply: ["$adjustment", "$productInfo.price"] },
                  { $add: [1, { $divide: ["$invoiceInfo.tax", "$invoiceInfo.subtotal"] }] }
                ]
              },
              else: { $multiply: ["$adjustment", "$productInfo.price"] }
            }
          }
        }
      },
      {
        $group: {
          _id: getTrendGrouping(),
          returnValue: { $sum: "$returnValueWithTax" },
          returnQuantity: { $sum: "$adjustment" },
          returnCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Format trend data for frontend
    const formattedTrend = trendData.map((item) => {
      let date;
      if (item._id.day) {
        date = new Date(item._id.year, item._id.month - 1, item._id.day)
          .toISOString()
          .split("T")[0];
      } else if (item._id.week) {
        date = `${item._id.year}-W${String(item._id.week).padStart(2, "0")}`;
      } else {
        date = new Date(item._id.year, item._id.month - 1, 1)
          .toISOString()
          .split("T")[0]
          .substring(0, 7);
      }

      return {
        date,
        returnValue: Math.round(item.returnValue * 100) / 100,
        returnQuantity: item.returnQuantity,
        returnCount: item.returnCount,
      };
    });

    // Get total sales for the period to calculate return rate
    const salesData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...(startDate && endDate
            ? {
              date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            }
            : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
        },
      },
    ]);

    const totalSales = salesData[0]?.totalSales || 0;
    const returnRate =
      totalSales > 0 ? (summary.totalReturnValue / totalSales) * 100 : 0;

    // Find most returned product
    const mostReturnedProduct = productReturns[0] || null;

    // Enhanced summary
    const enhancedSummary = {
      ...summary,
      returnRate: Math.round(returnRate * 100) / 100,
      mostReturnedProduct: mostReturnedProduct
        ? {
          name: mostReturnedProduct.productName,
          returnValue: mostReturnedProduct.returnValue,
          returnQuantity: mostReturnedProduct.returnQuantity,
          returnCount: mostReturnedProduct.returnCount,
        }
        : null,
      avgReturnValue:
        summary.totalReturnCount > 0
          ? Math.round(
            (summary.totalReturnValue / summary.totalReturnCount) * 100
          ) / 100
          : 0,
      totalSales,
    };

    console.log("\n=== PRODUCT RETURNS ANALYTICS ===");
    console.log(`Total Return Value: ₹${summary.totalReturnValue}`);
    console.log(`Total Return Quantity: ${summary.totalReturnQuantity}`);
    console.log(`Total Return Transactions: ${summary.totalReturnCount}`);
    console.log(`Unique Products Returned: ${summary.uniqueProductCount}`);
    console.log(`Return Rate: ${returnRate.toFixed(2)}%`);
    console.log(`Total Sales (Period): ₹${totalSales}`);
    console.log("=================================\n");

    res.json({
      summary: enhancedSummary,
      products: productReturns,
      categoryBreakdown: categoryReturns,
      trend: formattedTrend,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Product returns error:", error);
    res.status(500).json({
      message: "Error fetching product returns",
      error: error.message,
    });
  }
});

// Get Revenue Analytics - Professional comprehensive analytics with returns & tax
router.get("/analytics", auth, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Calculate date range based on period (SAME AS REVENUE DASHBOARD)
    let start, end;
    const now = new Date();

    switch (period) {
      case "today":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        const quarterEndMonth = currentQuarter * 3 + 2;
        end = new Date(now.getFullYear(), quarterEndMonth + 1, 0);
        if (end > now) {
          end = new Date(now);
        }
        end.setHours(23, 59, 59, 999);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "all":
        start = new Date(0); // Beginning of time
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        if (startDate && endDate) {
          start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        } else {
          // Default to current month
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
        }
    }

    // Build date filter for the selected period
    const dateFilter = {
      date: { $gte: start, $lte: end },
    };

    // 1. PAYMENT SUMMARY
    // A. Initial Sales (Cash/Online/Card)
    const initialSalesData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          paymentMethod: { $in: ["cash", "online", "card"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalTax: { $sum: { $ifNull: ["$tax", 0] } },
          totalSubtotal: { $sum: "$subtotal" },
        },
      },
    ]);

    // B. Due/Credit Sales
    const dueSalesData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          paymentMethod: { $in: ["due", "credit"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalTax: { $sum: { $ifNull: ["$tax", 0] } },
          totalSubtotal: { $sum: "$subtotal" },
          currentDue: { $sum: { $ifNull: ["$dueAmount", 0] } },
        },
      },
    ]);

    // C. Due Payments (Collected via Transactions)
    const duePaymentsData = await mongoose.model("Transaction").aggregate([
      {
        $match: {
          type: "payment", // Payments for due invoices
          date: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoice",
        },
      },
      {
        $match: {
          "invoice.createdBy": userId,
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amount" },
        },
      },
    ]);

    const initialSales = initialSalesData[0] || { totalRevenue: 0, totalTax: 0, totalSubtotal: 0 };
    const dueSales = dueSalesData[0] || { totalRevenue: 0, totalTax: 0, totalSubtotal: 0, currentDue: 0 };
    const duePayments = duePaymentsData[0]?.totalCollected || 0;


    // Get RETURNS for the period (from StockHistory)

    // Get RETURNS for the period (from StockHistory)
    const returnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userId,
          type: "return",
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      {
        $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true },
      },
      // Find the specific item in the invoice to get the SOLD price
      {
        $addFields: {
          soldItem: {
            $filter: {
              input: "$invoiceInfo.items",
              as: "item",
              cond: { $eq: ["$$item.product", "$product"] }
            }
          }
        }
      },
      {
        $addFields: {
          soldPrice: {
            $ifNull: [
              { $arrayElemAt: ["$soldItem.price", 0] },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          // Calculate proportional tax for this return
          returnValue: { $multiply: ["$adjustment", "$soldPrice"] },
          itemProportion: {
            $cond: [
              { $gt: [{ $ifNull: ["$invoiceInfo.subtotal", 0] }, 0] },
              {
                $divide: [
                  { $multiply: ["$adjustment", "$soldPrice"] },
                  "$invoiceInfo.subtotal",
                ],
              },
              0,
            ],
          },
          isCreditReturn: {
            $in: ["$invoiceInfo.paymentMethod", ["due", "credit"]],
          },
        },
      },
      {
        $addFields: {
          proportionalTax: {
            $multiply: [
              { $ifNull: ["$invoiceInfo.tax", 0] },
              "$itemProportion",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$invoiceInfo.paymentMethod", // Group by actual payment method
          totalReturns: {
            $sum: {
              $add: [
                "$returnValue",
                "$proportionalTax",
              ],
            },
          },
          returnsCount: { $sum: 1 },
        },
      },
    ]);

    // Process Returns Data
    let totalReturns = 0;
    let returnsCount = 0;
    let cashRefunds = 0;
    let creditAdjustments = 0;
    const returnsByMethod = {};

    returnsData.forEach((group) => {
      const method = group._id;
      const value = group.totalReturns;

      totalReturns += value;
      returnsCount += group.returnsCount;
      returnsByMethod[method] = value;

      if (["due", "credit"].includes(method)) {
        creditAdjustments += value;
      } else {
        cashRefunds += value;
      }
    });

    console.log("=== ANALYTICS DEBUG ===");
    console.log("Initial Sales (Cash/Online):", initialSales.totalRevenue);
    console.log("Due Sales (Credit):", dueSales.totalRevenue);
    console.log("Due Payments (Transactions):", duePayments);
    console.log("Total Returns:", totalReturns);
    console.log("Cash Refunds:", cashRefunds);
    console.log("Credit Adjustments:", creditAdjustments);
    console.log("Calculated Actual Received:", (initialSales.totalRevenue - cashRefunds) + duePayments);
    console.log("Calculated Total Due:", (dueSales.totalRevenue - creditAdjustments) - duePayments);
    console.log("Returns by Method:", returnsByMethod);
    console.log("=======================");

    // Update Payment Summary with Returns Logic
    // Matches Dashboard: Total Collected = (Initial Sales - Cash Refunds) + Due Payments
    // Matches Dashboard: Net Outstanding = (Due Sales - Credit Adjustments) - Due Payments
    const paymentSummary = {
      totalRevenue: initialSales.totalRevenue + dueSales.totalRevenue,
      totalSubtotal: initialSales.totalSubtotal + dueSales.totalSubtotal,
      totalTax: initialSales.totalTax + dueSales.totalTax,
      actualReceived: (initialSales.totalRevenue - cashRefunds) + duePayments,
      totalDue: (dueSales.totalRevenue - creditAdjustments) - duePayments,
      totalCreditUsed: dueSales.totalRevenue,
    };

    const returns = totalReturns;


    // Calculate Net Revenue (Gross - Returns)
    const netRevenue = paymentSummary.totalRevenue - returns;

    // 2. CONVERSION RATE (Draft to Final) - PERIOD BASED
    const draftCount = await Invoice.countDocuments({
      createdBy: userId,
      status: "draft",
      ...dateFilter,
    });

    const finalCount = await Invoice.countDocuments({
      createdBy: userId,
      status: { $in: ["final", "paid"] },
      ...dateFilter,
    });

    const conversionRate =
      draftCount + finalCount > 0
        ? (finalCount / (draftCount + finalCount)) * 100
        : 100;

    // 3. CUSTOMER RETENTION - ALL TIME (not period-based)
    const customerData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
        },
      },
      {
        $group: {
          _id: "$customer",
          orderCount: { $sum: 1 },
          firstOrder: { $min: "$date" },
          lastOrder: { $max: "$date" },
        },
      },
    ]);

    const returningCustomers = customerData.filter((c) => c.orderCount > 1).length;
    const customerRetention =
      customerData.length > 0
        ? (returningCustomers / customerData.length) * 100
        : 0;

    // 4. AVERAGE ORDER FREQUENCY - ALL TIME
    const averageOrderFrequency =
      customerData.length > 0
        ? customerData.reduce((sum, c) => sum + c.orderCount, 0) /
        customerData.length
        : 0;

    // 5. MONTHLY TREND (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Fetch Monthly Returns
    // Filter to selected period's end date to match the selected filter
    const monthlyReturnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userId,
          type: "return",
          timestamp: { $gte: sixMonthsAgo, $lte: end }, // Use selected period end
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          soldItem: {
            $filter: {
              input: "$invoiceInfo.items",
              as: "item",
              cond: { $eq: ["$$item.product", "$product"] }
            }
          }
        }
      },
      {
        $addFields: {
          soldPrice: { $ifNull: [{ $arrayElemAt: ["$soldItem.price", 0] }, 0] }
        }
      },
      {
        $addFields: {
          returnValue: { $multiply: ["$adjustment", "$soldPrice"] },
          itemProportion: {
            $cond: [
              { $gt: [{ $ifNull: ["$invoiceInfo.subtotal", 0] }, 0] },
              { $divide: [{ $multiply: ["$adjustment", "$soldPrice"] }, "$invoiceInfo.subtotal"] },
              0,
            ],
          },
          isCreditReturn: { $in: ["$invoiceInfo.paymentMethod", ["due", "credit"]] },
        },
      },
      {
        $addFields: {
          proportionalTax: { $multiply: [{ $ifNull: ["$invoiceInfo.tax", 0] }, "$itemProportion"] },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$timestamp" },
            year: { $year: "$timestamp" },
            isCredit: "$isCreditReturn"
          },
          totalReturns: { $sum: { $add: ["$returnValue", "$proportionalTax"] } },
        },
      },
    ]);

    console.log("=== MONTHLY RETURNS DEBUG ===");
    console.log("Monthly Returns Data:", JSON.stringify(monthlyReturnsData, null, 2));
    console.log("==============================");

    // Fetch Monthly Transactions (for Due Payments)
    // Filter to selected period's end date to match the selected filter
    const monthlyTransactionsData = await mongoose.model("Transaction").aggregate([
      {
        $match: {
          type: "payment",
          date: { $gte: sixMonthsAgo, $lte: end }, // Use selected period end
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoice",
        },
      },
      { $match: { "invoice.createdBy": userId } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    console.log("=== MONTHLY TRANSACTIONS DEBUG ===");
    console.log("Monthly Transactions Data:", JSON.stringify(monthlyTransactionsData, null, 2));
    console.log("===================================");

    const monthlyTrendRaw = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          date: { $gte: sixMonthsAgo, $lte: end }, // Use selected period end
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
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$total",
                0,
              ],
            },
          },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Fetch current period transactions (for accurate current month data)
    const currentPeriodTransactions = await mongoose.model("Transaction").aggregate([
      {
        $match: {
          type: "payment",
          date: { $gte: start, $lte: end }, // Exact period only
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoice",
        },
      },
      { $match: { "invoice.createdBy": userId } },
      {
        $group: {
          _id: null,
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const currentPeriodTransactionAmount = currentPeriodTransactions[0]?.amount || 0;
    const endMonth = end.getMonth() + 1; // JS months are 0-indexed
    const endYear = end.getFullYear();

    console.log("=== CURRENT PERIOD TRANSACTIONS ===");
    console.log("Period Start:", start);
    console.log("Period End:", end);
    console.log("End Month/Year:", endMonth, "/", endYear);
    console.log("Current Period Transaction Amount:", currentPeriodTransactionAmount);
    console.log("====================================");

    // Merge Returns & Transactions into Monthly Trend
    const monthlyTrend = monthlyTrendRaw.map(item => {
      const monthReturns = monthlyReturnsData.filter(r =>
        r._id.month === item._id.month && r._id.year === item._id.year
      );

      // For the current period's end month, use period-specific transactions
      // For other months, use monthly aggregated transactions
      const isCurrentMonth = (item._id.month === endMonth && item._id.year === endYear);
      const transactionAmount = isCurrentMonth
        ? currentPeriodTransactionAmount
        : (monthlyTransactionsData.find(t => t._id.month === item._id.month && t._id.year === item._id.year)?.amount || 0);

      const cashRefunds = monthReturns.filter(r => !r._id.isCredit).reduce((sum, r) => sum + r.totalReturns, 0);
      const creditAdjustments = monthReturns.filter(r => r._id.isCredit).reduce((sum, r) => sum + r.totalReturns, 0);
      const totalReturns = cashRefunds + creditAdjustments;

      const netRevenue = item.revenue - totalReturns;
      // Received = (Initial Sales - Cash Refunds) + Due Payments (Transactions)
      const netReceived = (item.received - cashRefunds) + transactionAmount;
      // Pending = Net Revenue - Net Received
      const netDue = netRevenue - netReceived;

      console.log(`Month ${item._id.month}/${item._id.year}: isCurrentMonth=${isCurrentMonth}, transactionAmount=${transactionAmount}`);

      return {
        month: new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' }),
        year: item._id.year,
        revenue: netRevenue,
        received: netReceived,
        due: netDue > 0 ? netDue : 0,
        profit: netRevenue * 0.95, // Estimated profit
        collectionRate: netRevenue > 0 ? (netReceived / netRevenue) * 100 : 0,
        monthNum: item._id.month,
      };
    });

    // 6. TIME OF DAY & DAY OF WEEK RETURNS (Selected Period)
    const periodReturnsData = await StockHistory.aggregate([
      {
        $match: {
          user: userId,
          type: "return",
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          soldItem: {
            $filter: {
              input: "$invoiceInfo.items",
              as: "item",
              cond: { $eq: ["$$item.product", "$product"] }
            }
          }
        }
      },
      {
        $addFields: {
          soldPrice: { $ifNull: [{ $arrayElemAt: ["$soldItem.price", 0] }, 0] }
        }
      },
      {
        $addFields: {
          returnValue: { $multiply: ["$adjustment", "$soldPrice"] },
          itemProportion: {
            $cond: [
              { $gt: [{ $ifNull: ["$invoiceInfo.subtotal", 0] }, 0] },
              { $divide: [{ $multiply: ["$adjustment", "$soldPrice"] }, "$invoiceInfo.subtotal"] },
              0,
            ],
          },
          isCreditReturn: { $in: ["$invoiceInfo.paymentMethod", ["due", "credit"]] },
        },
      },
      {
        $addFields: {
          proportionalTax: { $multiply: [{ $ifNull: ["$invoiceInfo.tax", 0] }, "$itemProportion"] },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$timestamp" },
            day: { $dayOfWeek: "$timestamp" },
            isCredit: "$isCreditReturn"
          },
          totalReturns: { $sum: { $add: ["$returnValue", "$proportionalTax"] } },
        },
      },
    ]);

    // Fetch Period Transactions (for Due Payments)
    const periodTransactionsData = await mongoose.model("Transaction").aggregate([
      {
        $match: {
          type: "payment",
          date: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoice",
        },
      },
      { $match: { "invoice.createdBy": userId } },
      {
        $group: {
          _id: {
            hour: { $hour: "$date" },
            day: { $dayOfWeek: "$date" },
          },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    // 6. TIME OF DAY DATA
    const timeOfDayRaw = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $hour: "$date" },
          revenue: { $sum: "$total" },
          received: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$total",
                0,
              ],
            },
          },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const timeOfDayData = timeOfDayRaw.map(item => {
      const hourReturns = periodReturnsData.filter(r => r._id.hour === item._id);
      const hourTransactions = periodTransactionsData.find(t => t._id.hour === item._id);

      const cashRefunds = hourReturns.filter(r => !r._id.isCredit).reduce((sum, r) => sum + r.totalReturns, 0);
      const creditAdjustments = hourReturns.filter(r => r._id.isCredit).reduce((sum, r) => sum + r.totalReturns, 0);
      const transactionAmount = hourTransactions ? hourTransactions.amount : 0;

      const netRevenue = item.revenue - (cashRefunds + creditAdjustments);
      const netReceived = (item.received - cashRefunds) + transactionAmount;
      const netDue = netRevenue - netReceived;

      return {
        hour: item._id,
        revenue: netRevenue,
        received: netReceived,
        due: netDue > 0 ? netDue : 0,
        count: item.count
      };
    });

    // 7. DAY OF WEEK DATA
    const dayOfWeekRaw = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          revenue: { $sum: "$total" },
          received: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$total",
                0,
              ],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const dayOfWeekData = dayOfWeekRaw.map(item => {
      const dayReturns = periodReturnsData.filter(r => r._id.day === item._id);
      const dayTransactions = periodTransactionsData.find(t => t._id.day === item._id);

      const cashRefunds = dayReturns.filter(r => !r._id.isCredit).reduce((sum, r) => sum + r.totalReturns, 0);
      const creditAdjustments = dayReturns.filter(r => r._id.isCredit).reduce((sum, r) => sum + r.totalReturns, 0);
      const transactionAmount = dayTransactions ? dayTransactions.amount : 0;

      const netRevenue = item.revenue - (cashRefunds + creditAdjustments);
      const netReceived = (item.received - cashRefunds) + transactionAmount;

      const days = ["Unknown", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      return {
        day: days[item._id] || "Unknown",
        revenue: netRevenue,
        received: netReceived,
        orders: item.orders
      };
    });

    // 8. CUSTOMER SEGMENTS - Period-based (Walk-in vs Due)
    // First, fetch invoices with their transactions
    const periodCustomerData = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "invoiceId",
          as: "transactions",
        },
      },
      {
        $group: {
          _id: {
            customer: "$customer",
            isWalkIn: { $in: ["$paymentMethod", ["cash", "online", "card"]] }
          },
          revenue: { $sum: "$total" },
          tax: { $sum: { $ifNull: ["$tax", 0] } },
          // For Walk-in: Paid = Total
          // For Due: Paid = Sum of Transactions
          paid: {
            $sum: {
              $cond: [
                { $in: ["$paymentMethod", ["cash", "online", "card"]] },
                "$total",
                { $sum: "$transactions.amount" }
              ]
            }
          },
          due: { $sum: { $ifNull: ["$dueAmount", 0] } },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Calculate returns by customer segment (Walk-in vs Due)
    const segmentReturns = await StockHistory.aggregate([
      {
        $match: {
          user: userId,
          type: "return",
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "invoices",
          localField: "invoiceId",
          foreignField: "_id",
          as: "invoiceInfo",
        },
      },
      { $unwind: { path: "$invoiceInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          soldItem: {
            $filter: {
              input: "$invoiceInfo.items",
              as: "item",
              cond: { $eq: ["$$item.product", "$product"] }
            }
          }
        }
      },
      {
        $addFields: {
          soldPrice: { $ifNull: [{ $arrayElemAt: ["$soldItem.price", 0] }, 0] },
          isWalkIn: { $in: ["$invoiceInfo.paymentMethod", ["cash", "online", "card"]] }
        }
      },
      {
        $addFields: {
          returnValue: { $multiply: ["$adjustment", "$soldPrice"] },
          itemProportion: {
            $cond: [
              { $gt: [{ $ifNull: ["$invoiceInfo.subtotal", 0] }, 0] },
              { $divide: [{ $multiply: ["$adjustment", "$soldPrice"] }, "$invoiceInfo.subtotal"] },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          proportionalTax: { $multiply: [{ $ifNull: ["$invoiceInfo.tax", 0] }, "$itemProportion"] },
        },
      },
      {
        $group: {
          _id: "$isWalkIn",
          totalReturns: { $sum: { $add: ["$returnValue", "$proportionalTax"] } },
        },
      },
    ]);

    const walkInReturns = segmentReturns.find(r => r._id === true)?.totalReturns || 0;
    const dueReturns = segmentReturns.find(r => r._id === false)?.totalReturns || 0;

    // Separate into Walk-in and Due customers
    const walkInCustomers = periodCustomerData.filter(c => c._id.isWalkIn);
    const dueCustomers = periodCustomerData.filter(c => !c._id.isWalkIn);

    const segmentedCustomers = [
      {
        _id: 0,
        name: "Walk-in",
        value: walkInCustomers.length,
        revenue: walkInCustomers.reduce((sum, c) => sum + c.revenue, 0),
        returns: walkInReturns,
        tax: walkInCustomers.reduce((sum, c) => sum + c.tax, 0),
        paid: walkInCustomers.reduce((sum, c) => sum + c.paid, 0) - walkInReturns,
        due: walkInCustomers.reduce((sum, c) => sum + c.due, 0),
        collectionRate: 0,
      },
      {
        _id: 1,
        name: "Due",
        value: dueCustomers.length,
        revenue: dueCustomers.reduce((sum, c) => sum + c.revenue, 0),
        returns: dueReturns,
        tax: dueCustomers.reduce((sum, c) => sum + c.tax, 0),
        paid: dueCustomers.reduce((sum, c) => sum + c.paid, 0), // Transactions are actual payments
        due: dueCustomers.reduce((sum, c) => sum + c.due, 0),
        collectionRate: 0,
      },
    ];

    // Calculate collection rates
    segmentedCustomers.forEach(segment => {
      if (segment.revenue > 0) {
        segment.collectionRate = (segment.paid / segment.revenue) * 100;
      }
    });

    // 9. PAYMENT METHOD PERFORMANCE - PERIOD BASED
    const paymentMethodPerformanceRaw = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      {
        $project: {
          method: "$_id",
          count: 1,
          revenue: 1,
          avgTransactionValue: { $divide: ["$revenue", "$count"] },
        },
      },
    ]);

    const paymentMethodPerformance = paymentMethodPerformanceRaw.map(pm => {
      const returns = returnsByMethod[pm.method] || 0;
      return {
        ...pm,
        revenue: pm.revenue - returns,
      };
    });

    // 10. TOP CUSTOMERS - PERIOD BASED
    const topCustomers = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ["final", "paid"] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$customer",
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
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
      { $unwind: "$customerInfo" },
      {
        $project: {
          name: "$customerInfo.name",
          revenue: 1,
          orders: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // 11. TOP PRODUCTS - PERIOD BASED
    const topProducts = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
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
          name: "$productInfo.name",
          revenue: 1,
          quantity: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // 12. CATEGORY PERFORMANCE - PERIOD BASED
    const categoryPerformance = await Invoice.aggregate([
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
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          category: {
            $first: {
              $ifNull: ["$categoryInfo.name", "Uncategorized"],
            },
          },
          revenue: { $sum: "$items.subtotal" },
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // 13. PRODUCT PERFORMANCE (for compatibility)
    const productPerformance = categoryPerformance.map((cat) => ({
      category: cat.category,
      revenue: cat.revenue,
      score: 100,
    }));

    // 14. GROWTH CALCULATIONS (simplified)
    const growthRate = 0;
    const collectionGrowth = 0;

    // Calculate totalCollected matching Dashboard logic
    // Total Collected = (Gross Walk-in Sales - Cash Refunds) + Credit Payments
    const grossWalkInSales = initialSales.totalRevenue || 0;
    const netWalkInSales = grossWalkInSales - cashRefunds;
    const totalCollected = netWalkInSales + duePayments;

    // Net Position = (Due Sales - Credit Adjustments) - Due Payments  
    const grossCreditSales = dueSales.totalRevenue || 0;
    const netCreditSales = grossCreditSales - creditAdjustments;
    const netPosition = Math.max(0, netCreditSales - duePayments);

    // Collection Rate = Total Collected / Gross Revenue
    const grossRevenue = paymentSummary.totalRevenue;
    const collectionRate = grossRevenue > 0 ? (totalCollected / grossRevenue) * 100 : 0;

    // RETURN COMPREHENSIVE RESPONSE
    res.json({
      growthRate,
      collectionGrowth,
      revenuePerInvoice:
        finalCount > 0 ? grossRevenue / finalCount : 0,
      profitMargin: 95.53,
      collectionRate,
      conversionRate,
      customerRetention,
      averageOrderFrequency,
      paymentSummary: {
        grossRevenue: grossRevenue,
        netRevenue: netRevenue,
        totalCollected: totalCollected,
        netPosition: netPosition,
        // Legacy fields for compatibility
        totalRevenue: grossRevenue,
        actualReceived: totalCollected,
        totalDue: netPosition,
        totalCreditUsed: paymentSummary.totalCreditUsed,
      },
      returns: {
        total: returns,
        count: returnsCount,
        cashRefunds: cashRefunds,
        creditAdjustments: creditAdjustments,
      },
      // Additional metrics for frontend
      grossWalkInSales: grossWalkInSales,
      netWalkInSales: netWalkInSales,
      grossCreditSales: grossCreditSales,
      netCreditSales: netCreditSales,
      creditPayments: duePayments,
      netRevenue,
      monthlyTrend,
      customerSegments: segmentedCustomers,
      paymentMethodPerformance,
      productPerformance,
      timeOfDayData,
      dayOfWeekData,
      topCustomers,
      topProducts,
      categoryPerformance,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        label: period || "custom",
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      message: "Error fetching analytics",
      error: error.message,
    });
  }
});

module.exports = router;


