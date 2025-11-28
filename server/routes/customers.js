// server/routes/customers.js - REORDER ROUTES (specific routes before parameterized routes)

const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// ============================================
// SPECIFIC ROUTES MUST COME BEFORE :id ROUTES
// ============================================

// Get customer statistics - MOVE THIS TO THE TOP
router.get("/stats", auth, async (req, res) => {
  try {
    const { period = "month" } = req.query;

    // Calculate date ranges
    const now = new Date();
    let currentStart, previousStart, previousEnd;

    switch (period) {
      case "today":
        currentStart = new Date(now.setHours(0, 0, 0, 0));
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(currentStart);
        break;
      case "week":
        currentStart = new Date(now.setDate(now.getDate() - 7));
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        break;
      case "month":
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), quarter * 3, 1);
        previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      case "year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Enhanced statistics
    const [totalStats, dueStats, creditStats, recentTransactions] =
      await Promise.all([
        // Total customers and growth
        Customer.aggregate([
          { $match: { createdBy: req.user.userId } },
          {
            $facet: {
              total: [{ $count: "count" }],
              currentPeriod: [
                { $match: { createdAt: { $gte: currentStart } } },
                { $count: "count" },
              ],
              previousPeriod: [
                {
                  $match: {
                    createdAt: { $gte: previousStart, $lt: previousEnd },
                  },
                },
                { $count: "count" },
              ],
              activeCustomers: [
                {
                  $match: {
                    lastTransactionDate: {
                      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
                { $count: "count" },
              ],
            },
          },
        ]),

        // Due amount statistics
        Customer.aggregate([
          { $match: { createdBy: req.user.userId, amountDue: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              totalDue: { $sum: "$amountDue" },
              count: { $sum: 1 },
              avgDue: { $avg: "$amountDue" },
              maxDue: { $max: "$amountDue" },
            },
          },
        ]),

        // Credit balance statistics
        Customer.aggregate([
          { $match: { createdBy: req.user.userId, creditBalance: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              totalCredit: { $sum: "$creditBalance" },
              count: { $sum: 1 },
              avgCredit: { $avg: "$creditBalance" },
              maxCredit: { $max: "$creditBalance" },
            },
          },
        ]),

        // Recent transactions
        Transaction.find({ createdBy: req.user.userId })
          .sort({ date: -1 })
          .limit(5)
          .populate("customerId", "name"),
      ]);

    // Process the data
    const total = totalStats[0]?.total[0]?.count || 0;
    const currentCount = totalStats[0]?.currentPeriod[0]?.count || 0;
    const previousCount = totalStats[0]?.previousPeriod[0]?.count || 0;
    const activeCount = totalStats[0]?.activeCustomers[0]?.count || 0;

    const percentChange =
      previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : currentCount > 0
          ? 100
          : 0;

    res.json({
      customers: {
        total,
        active: activeCount,
        currentPeriod: currentCount,
        previousPeriod: previousCount,
        percentChange: parseFloat(percentChange.toFixed(1)),
        isPositive: percentChange >= 0,
      },
      dues: dueStats[0] || {
        totalDue: 0,
        count: 0,
        avgDue: 0,
        maxDue: 0,
      },
      credits: creditStats[0] || {
        totalCredit: 0,
        count: 0,
        avgCredit: 0,
        maxCredit: 0,
      },
      netBalance: {
        total:
          (dueStats[0]?.totalDue || 0) - (creditStats[0]?.totalCredit || 0),
        isPositive:
          (dueStats[0]?.totalDue || 0) > (creditStats[0]?.totalCredit || 0),
      },
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    res.status(500).json({
      message: "Error fetching customer statistics",
      error: error.message,
    });
  }
});

// Create new customer
router.post("/", auth, async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      createdBy: req.user.userId,
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all customers with search
router.get("/", auth, async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const query = {
      createdBy: req.user.userId,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { phoneNumber: { $regex: searchQuery, $options: "i" } },
        { place: { $regex: searchQuery, $options: "i" } },
      ],
    };

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PARAMETERIZED ROUTES MUST COME AFTER
// ============================================

// Get customer transactions - SPECIFIC SUB-ROUTE
router.get("/:id/transactions", auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const transactions = await Transaction.find({
      customerId: req.params.id,
    })
      .sort({ date: -1 })
      .populate("invoiceId", "invoiceNumber");

    res.json({
      customer,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/purchases", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, invoiceId, invoiceNumber } = req.body;
    const customerId = req.params.id;

    if (invoiceId) {
      return res.status(400).json({
        message: "Use invoice creation endpoint for invoice purchases",
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      createdBy: req.user.userId,
    }).session(session);

    if (!customer) {
      throw new Error("Customer not found");
    }

    const purchaseAmount = parseFloat(amount);
    const currentDue = customer.amountDue || 0;

    // SIMPLIFIED: Purchase just increases the due amount
    const newDue = currentDue + purchaseAmount;

    // Create purchase transaction
    const purchaseTransaction = new Transaction({
      customerId,
      type: "purchase",
      amount: purchaseAmount,
      date: new Date(),
      invoiceId,
      invoiceNumber,
      balanceBefore: currentDue,
      balanceAfter: newDue,
      description: `Purchase via invoice ${invoiceNumber}`,
      createdBy: req.user.userId,
    });
    await purchaseTransaction.save({ session });

    // Update customer
    customer.amountDue = newDue;
    customer.totalPurchases = (customer.totalPurchases || 0) + purchaseAmount;
    customer.lastTransactionDate = new Date();
    await customer.save({ session });

    await session.commitTransaction();

    res.json({
      transaction: purchaseTransaction,
      customer,
      message: "Purchase recorded successfully!",
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

router.post("/:id/payments", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Invoice = require("../models/Invoice");
    const { amount, paymentMode = "cash", description } = req.body;
    const customerId = req.params.id;

    // Validate input
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    // Convert customerId to ObjectId EARLY (before any use)
    const customerObjectId = mongoose.Types.ObjectId.isValid(customerId)
      ? new mongoose.Types.ObjectId(customerId)
      : customerId;

    // Find customer
    const customer = await Customer.findOne({
      _id: customerObjectId,
      createdBy: req.user.userId,
    }).session(session);

    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Customer not found" });
    }

    const paymentAmount = parseFloat(amount);
    const currentDue = customer.amountDue || 0;

    // SIMPLIFIED +/- LOGIC: Payment reduces due (can go negative = advance)
    const newDue = currentDue - paymentAmount;

    console.log("\n=== PAYMENT PROCESSING (SIMPLIFIED) ===");
    console.log(`Customer: ${customer.name}`);
    console.log(`Payment: ₹${paymentAmount}, Current Due: ₹${currentDue}, New Due: ₹${newDue}`);

    if (newDue < 0) console.log(`✓ Advance: ₹${Math.abs(newDue)}`);

    // Update invoices (if any outstanding)
    const invoicesUpdated = [];
    if (currentDue > 0) {
      const outstandingInvoices = await Invoice.find({
        "customer._id": customerObjectId,
        dueAmount: { $gt: 0 },
        status: { $in: ["final", "paid"] },
        createdBy: req.user.userId,
      }).sort({ date: 1 }).session(session);

      let remainingPayment = paymentAmount;
      for (const invoice of outstandingInvoices) {
        if (remainingPayment <= 0) break;
        const paymentForInvoice = Math.min(remainingPayment, invoice.dueAmount);
        const previousDue = invoice.dueAmount;

        // Calculate new due amount with precision handling
        const newDueAmount = Math.max(0, invoice.dueAmount - paymentForInvoice);
        invoice.dueAmount = Number(newDueAmount.toFixed(2));

        if (invoice.dueAmount === 0) {
          invoice.status = "paid";
          if (invoice.paymentMethod === "due") invoice.paymentMethod = "cash";
        }
        await invoice.save({ session });

        invoicesUpdated.push({
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          previousDue: Number(previousDue.toFixed(2)),
          paymentApplied: Number(paymentForInvoice.toFixed(2)),
          remainingDue: Number(invoice.dueAmount.toFixed(2)), // This now reflects the saved value
        });
        remainingPayment -= paymentForInvoice;
      }
    }

    // Create transaction
    const transaction = new Transaction({
      customerId: customerObjectId,
      type: "payment",
      amount: paymentAmount,
      date: new Date(),
      balanceBefore: currentDue,
      balanceAfter: newDue,
      paymentMode,
      description: description || `Payment of ₹${paymentAmount.toFixed(2)}${newDue < 0 ? ` - Advance: ₹${Math.abs(newDue).toFixed(2)}` : newDue > 0 ? ` - Due: ₹${newDue.toFixed(2)}` : ' - Settled'}`,
      createdBy: req.user.userId,
    });
    await transaction.save({ session });

    // Update customer
    customer.amountDue = newDue;
    customer.totalPayments = (customer.totalPayments || 0) + paymentAmount;
    customer.lastTransactionDate = new Date();
    await customer.save({ session });

    await session.commitTransaction();
    console.log("✅ Payment processed successfully\n");

    res.json({
      success: true,
      transaction,
      customer: {
        _id: customer._id,
        name: customer.name,
        amountDue: customer.amountDue,
        totalPayments: customer.totalPayments,
      },
      invoicesUpdated,
      message: newDue < 0 ? `✅ Payment successful! Advance: ₹${Math.abs(newDue).toFixed(2)}` : newDue === 0 ? `✅ All dues cleared!` : `✅ Payment successful! Remaining: ₹${newDue.toFixed(2)}`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing payment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Get single customer - GENERIC :id ROUTE
router.get("/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer - GENERIC :id ROUTE
router.put("/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer - GENERIC :id ROUTE
router.delete("/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
