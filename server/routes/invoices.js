// routes/invoices.js
const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const generateCompactInvoicePDF = require("../utils/generateInvoicePDF");
const StockHistory = require("../models/StockHistory");

async function updateProductStock(
  items,
  session,
  userId,
  invoiceNumber,
  invoiceId,
  increase = false,
  typeOverride = null
) {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);
    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }

    if (product.isStockRequired) {
      if (product.unit !== item.unit) {
        throw new Error(
          `Unit mismatch for product ${product.name}: expected ${product.unit}, got ${item.unit}`
        );
      }

      const previousStock = product.stock;
      const adjustmentAmount = increase ? item.quantity : -item.quantity;
      const newStock = previousStock + adjustmentAmount;

      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      // Update product stock
      await Product.findByIdAndUpdate(
        item.product,
        { stock: newStock },
        { session }
      );

      // Determine type
      let type = increase ? "return" : "sale";
      if (typeOverride) {
        type = typeOverride;
      }

      // Create stock history entry with invoice reference
      const stockHistory = new StockHistory({
        product: item.product,
        adjustment: adjustmentAmount,
        unit: product.unit,
        previousStock: previousStock,
        newStock: newStock,
        user: userId,
        type: type,
        description: increase
          ? `Returned ${item.quantity} ${product.unit} from invoice ${invoiceNumber}`
          : `Sold ${item.quantity} ${product.unit} via invoice ${invoiceNumber}`,
        reference: invoiceNumber,
        invoiceId: invoiceId,
        timestamp: new Date(),
      });

      await stockHistory.save({ session });
    }
  }
}

// Create Invoice
router.post("/", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Settings = require("../models/Settings");
    const Customer = require("../models/Customer");
    const Transaction = require("../models/Transaction");

    const { customer, items, paymentMethod, status = "draft" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one item is required",
      });
    }

    // Fetch user's tax settings
    const settings = await Settings.findOne({
      user: req.user.userId,
    }).session(session);

    // Calculate totals
    let subtotal = 0;
    let tax = 0;

    // Check stock and calculate subtotal
    for (const item of items) {
      if (!item.product || !item.quantity || !item.price || !item.unit) {
        throw new Error("Invalid item data");
      }

      // Verify product exists and check stock if required
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.isStockRequired && status !== "draft") {
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;
    }

    // Calculate tax
    if (settings?.taxEnabled && settings?.taxRate > 0) {
      tax = (subtotal * settings.taxRate) / 100;
    }

    const total = subtotal + tax;

    // Generate professional invoice number
    // Format: INV-YYYYMMDD-XXXX (e.g., INV-20251130-0001)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // Find the last invoice created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const lastTodayInvoice = await Invoice.findOne({
      createdBy: req.user.userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ createdAt: -1 })
      .session(session);

    let sequenceNumber = 1;

    if (lastTodayInvoice && lastTodayInvoice.invoiceNumber) {
      // Extract sequence from last invoice (format: INV-YYYYMMDD-XXXX)
      const parts = lastTodayInvoice.invoiceNumber.split('-');
      if (parts.length === 3 && parts[1] === dateStr) {
        // Same day, increment sequence
        sequenceNumber = parseInt(parts[2]) + 1;
      }
      // Different day, sequence resets to 1
    }

    // Format: INV-YYYYMMDD-0001
    const invoiceNumber = `INV-${dateStr}-${String(sequenceNumber).padStart(4, '0')}`;


    // Handle payments and credit
    let creditUsed = 0;
    let finalTotal = total;
    let dueAmount = 0;
    let actualPaymentMethod = paymentMethod;

    if (customer?._id) {
      const existingCustomer = await Customer.findById(customer._id).session(
        session
      );
      if (existingCustomer) {
        if (paymentMethod === "credit_balance") {
          const availableCredit = existingCustomer.creditBalance || 0;

          // Automatically use credit if available
          if (availableCredit > 0) {
            if (availableCredit >= total) {
              // Credit covers entire invoice
              creditUsed = total;
              finalTotal = 0;
              dueAmount = 0;
              actualPaymentMethod = "credit"; // Fully paid with credit
            } else {
              // Credit partially covers invoice
              creditUsed = availableCredit;
              finalTotal = total - creditUsed;
              dueAmount = finalTotal;
              actualPaymentMethod = "mixed"; // Partially paid with credit
            }
          } else {
            // No credit available
            dueAmount = total;
          }
        } else {
          dueAmount = total;
        }
      } else if (paymentMethod === "due") {
        // Due payment without customer (walk-in customer with due)
        dueAmount = total;
      }
    }

    // Create invoice
    const invoiceData = {
      invoiceNumber,
      customer: {
        name: customer?.name || "Walk-in Customer",
        _id: customer?._id || null,
      },
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      creditUsed: Number(creditUsed.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2)),
      status,
      paymentMethod: actualPaymentMethod,
      dueAmount: Number(dueAmount.toFixed(2)),
      createdBy: req.user.userId,
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save({ session });

    // Handle customer transactions ONLY for final invoices with a customer
    if (status === "final" && customer?._id) {
      const existingCustomer = await Customer.findById(customer._id).session(
        session
      );

      if (existingCustomer) {
        const currentDue = existingCustomer.amountDue || 0;
        const currentCredit = existingCustomer.creditBalance || 0;

        let newDue = currentDue;
        let newCredit = currentCredit;

        // Update balances based on credit usage
        if (creditUsed > 0) {
          // Deduct credit used
          newCredit = currentCredit - creditUsed;

          // Create credit usage transaction
          const creditTransaction = new Transaction({
            customerId: existingCustomer._id,
            type: "credit_used",
            amount: creditUsed,
            date: new Date(),
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            balanceBefore: currentDue,
            balanceAfter: currentDue, // Due doesn't change on credit usage
            creditBefore: currentCredit,
            creditAfter: newCredit,
            description: `Credit of ₹${creditUsed} applied to invoice ${invoice.invoiceNumber}`,
            createdBy: req.user.userId,
          });
          await creditTransaction.save({ session });
        }

        // Add remaining due amount to customer's due balance
        if (dueAmount > 0) {
          newDue = currentDue + dueAmount;

          // Create purchase transaction
          const purchaseTransaction = new Transaction({
            customerId: existingCustomer._id,
            type: "purchase",
            amount: total,
            date: new Date(),
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            balanceBefore: currentDue,
            balanceAfter: newDue,
            creditBefore: creditUsed > 0 ? currentCredit : newCredit,
            creditAfter: creditUsed > 0 ? newCredit : currentCredit,
            description: `Invoice #${invoice.invoiceNumber}`,
            createdBy: req.user.userId,
          });
          await purchaseTransaction.save({ session });
        }

        // Update customer balances
        existingCustomer.amountDue = newDue;
        existingCustomer.creditBalance = newCredit;
        await existingCustomer.save({ session });
      }
    }

    // Update stock if status is not draft
    if (status !== "draft") {
      await updateProductStock(
        items,
        session,
        req.user.userId,
        invoiceNumber,
        invoice._id,
        false // decrease stock
      );
    }

    await session.commitTransaction();
    res.status(201).json(invoice);
  } catch (error) {
    await session.abortTransaction();
    console.error("Create invoice error:", error);
    res.status(500).json({
      message: error.message || "Error creating invoice",
    });
  } finally {
    session.endSession();
  }
});

// Get all invoices
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      dateFilter = "all",
      fromDate,
      toDate,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Build date filter
    let dateQuery = {};
    if (fromDate && toDate) {
      dateQuery.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else {
      switch (dateFilter) {
        case "today":
          dateQuery.date = {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lte: new Date().setHours(23, 59, 59, 999),
          };
          break;
        case "yesterday":
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          dateQuery.date = {
            $gte: yesterday.setHours(0, 0, 0, 0),
            $lte: yesterday.setHours(23, 59, 59, 999),
          };
          break;
        case "week":
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          dateQuery.date = {
            $gte: weekStart.setHours(0, 0, 0, 0),
          };
          break;
        case "month":
          const monthStart = new Date();
          monthStart.setDate(1);
          dateQuery.date = {
            $gte: monthStart.setHours(0, 0, 0, 0),
          };
          break;
      }
    }

    // Build search query
    const searchQuery = search
      ? {
        $or: [
          { "customer.name": { $regex: search, $options: "i" } },
          { invoiceNumber: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    // Build sort options
    const sortOptions = {};
    if (sortBy === "customerName") {
      sortOptions["customer.name"] = sortOrder;
    } else if (sortBy === "date") {
      sortOptions.date = sortOrder;
    } else if (sortBy === "total") {
      sortOptions.total = sortOrder;
    }

    // Combine all queries
    const query = {
      createdBy: req.user.userId,
      ...dateQuery,
      ...searchQuery,
    };

    // Get total count for pagination
    const total = await Invoice.countDocuments(query);

    // Get paginated invoices
    const invoices = await Invoice.find(query)
      .populate({
        path: "items.product",
        match: { createdBy: req.user.userId },
        select: "name price stock",
      })
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Calculate totals for filtered results
    const totals = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          averageAmount: { $avg: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Send response with metadata
    res.json({
      data: invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasNextPage,
        hasPreviousPage,
        limit: parseInt(limit),
      },
      summary: totals[0] || {
        totalAmount: 0,
        averageAmount: 0,
        count: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message,
    });
  }
});

// Update Invoice Status
router.patch("/:id/status", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;

    if (!["draft", "final", "paid"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).session(session);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Handle stock updates based on status change
    if (invoice.status === "draft" && status !== "draft") {
      // Deduct stock when moving from draft to final/paid
      await updateProductStock(
        invoice.items,
        session,
        req.user.userId,
        invoice.invoiceNumber,
        invoice._id,
        false // decrease = false means deduct
      );
    } else if (invoice.status !== "draft" && status === "draft") {
      // Restore stock when moving back to draft
      await updateProductStock(
        invoice.items,
        session,
        req.user.userId,
        invoice.invoiceNumber,
        invoice._id,
        true, // increase = true means restore
        "adjustment" // Override to adjustment
      );
    }

    invoice.status = status;
    await invoice.save({ session });

    await session.commitTransaction();
    res.json(invoice);
  } catch (error) {
    await session.abortTransaction();
    console.error("Status update error:", error);
    res.status(500).json({
      message: error.message || "Error updating invoice status",
    });
  } finally {
    session.endSession();
  }
});

// Update Invoice
router.put("/:id", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalInvoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).session(session);

    if (!originalInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // If status is changing from draft to final/paid, update stock
    if (
      originalInvoice.status === "draft" &&
      req.body.status &&
      req.body.status !== "draft"
    ) {
      await updateProductStock(
        req.body.items,
        session,
        req.user.userId,
        originalInvoice.invoiceNumber,
        originalInvoice._id,
        false
      );
    }
    // If status is changing from final/paid to draft, restore stock
    else if (
      originalInvoice.status !== "draft" &&
      req.body.status === "draft"
    ) {
      await updateProductStock(
        originalInvoice.items,
        session,
        req.user.userId,
        originalInvoice.invoiceNumber,
        originalInvoice._id,
        true,
        "adjustment" // Override to adjustment
      );
    }
    // If updating items in a final/paid invoice
    else if (originalInvoice.status !== "draft" && req.body.items) {
      // Restore original stock
      await updateProductStock(
        originalInvoice.items,
        session,
        req.user.userId,
        originalInvoice.invoiceNumber,
        originalInvoice._id,
        true,
        "adjustment" // Override to adjustment
      );
      // Deduct new stock
      await updateProductStock(
        req.body.items,
        session,
        req.user.userId,
        originalInvoice.invoiceNumber,
        originalInvoice._id,
        false
      );
    }

    // Handle customer transaction updates for due invoices
    const Customer = require("../models/Customer");
    const Transaction = require("../models/Transaction");

    const oldPaymentMethod = originalInvoice.paymentMethod;
    const oldCustomerId = originalInvoice.customer?._id;
    const newPaymentMethod = req.body.paymentMethod;
    const newCustomerId = req.body.customer?._id;
    const newDueAmount = req.body.dueAmount;
    const newTotal = req.body.total;
    const newStatus = req.body.status || originalInvoice.status;

    // Case 1: Editing existing due invoice
    if (oldCustomerId && oldPaymentMethod === "due" && newStatus === "final") {
      const customer = await Customer.findById(oldCustomerId).session(session);

      if (customer) {
        // Delete old transactions for this invoice
        await Transaction.deleteMany({
          customerId: oldCustomerId,
          invoiceId: originalInvoice._id,
        }).session(session);

        // Recalculate all customer transactions
        const allTransactions = await Transaction.find({
          customerId: oldCustomerId,
        }).sort({ date: 1 }).session(session);

        let runningBalance = 0;
        for (const trans of allTransactions) {
          if (trans.type === "purchase") {
            runningBalance += trans.amount;
          } else if (trans.type === "payment") {
            runningBalance -= trans.amount;
          }
          trans.balanceAfter = runningBalance;
          await trans.save({ session });
        }

        // If new version is still due, create new transaction
        if (newPaymentMethod === "due" && newDueAmount > 0) {
          const newPurchaseTrans = new Transaction({
            customerId: oldCustomerId,
            type: "purchase",
            amount: newDueAmount,
            date: new Date(),
            invoiceId: originalInvoice._id,
            invoiceNumber: originalInvoice.invoiceNumber,
            balanceBefore: runningBalance,
            balanceAfter: runningBalance + newDueAmount,
            description: `Purchase for invoice ${originalInvoice.invoiceNumber} (₹${newTotal})`,
            createdBy: req.user.userId,
          });
          await newPurchaseTrans.save({ session });
          runningBalance += newDueAmount;
        }

        // Update customer balance
        customer.amountDue = runningBalance;
        await customer.save({ session });
      }
    }
    // Case 2: Converting TO due invoice
    else if (newCustomerId && newPaymentMethod === "due" && newDueAmount > 0 && newStatus === "final" && oldPaymentMethod !== "due") {
      const customer = await Customer.findById(newCustomerId).session(session);

      if (customer) {
        const currentDue = customer.amountDue || 0;

        const newPurchaseTrans = new Transaction({
          customerId: newCustomerId,
          type: "purchase",
          amount: newDueAmount,
          date: new Date(),
          invoiceId: originalInvoice._id,
          invoiceNumber: originalInvoice.invoiceNumber,
          balanceBefore: currentDue,
          balanceAfter: currentDue + newDueAmount,
          description: `Purchase for invoice ${originalInvoice.invoiceNumber} (₹${newTotal})`,
          createdBy: req.user.userId,
        });
        await newPurchaseTrans.save({ session });

        customer.amountDue = currentDue + newDueAmount;
        await customer.save({ session });
      }
    }

    // Update the invoice
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      req.body,
      { new: true, session }
    ).populate("items.product");

    await session.commitTransaction();
    res.json(updatedInvoice);
  } catch (error) {
    await session.abortTransaction();
    console.error("Invoice update error:", error);
    res.status(500).json({
      message: error.message || "Error updating invoice",
    });
  } finally {
    session.endSession();
  }
});

// Delete Invoice
router.delete("/:id", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).session(session);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // If the invoice was final/paid, restore stock
    if (invoice.status !== "draft") {
      await updateProductStock(
        invoice.items,
        session,
        req.user.userId,
        invoice.invoiceNumber,
        invoice._id,
        true, // increase = true means restore
        "adjustment" // Override to adjustment
      );
    }

    await Invoice.deleteOne({ _id: req.params.id }).session(session);
    await session.commitTransaction();
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Error deleting invoice",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Get single invoice
router.get("/:id", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).populate("items.product");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      message: "Error fetching invoice",
      error: error.message,
    });
  }
});

// Generate PDF for invoice
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const Customer = require("../models/Customer");
    const Transaction = require("../models/Transaction");
    const Settings = require("../models/Settings");

    // Find the invoice and populate product details
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).populate("items.product");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Fetch shop settings for business information
    const settings = await Settings.findOne({
      user: req.user.userId,
    });

    // Fetch customer data if invoice has a customer
    let customerData = null;
    let recentPayment = null;
    if (invoice.customer?._id) {
      customerData = await Customer.findById(invoice.customer._id);

      // Fetch the most recent payment transaction
      recentPayment = await Transaction.findOne({
        customerId: invoice.customer._id,
        type: "payment",
        createdBy: req.user.userId,
      }).sort({ date: -1 }).limit(1);
    }

    // Generate PDF with customer context and shop settings
    const pdfBuffer = await generateCompactInvoicePDF(invoice, customerData, recentPayment, settings);

    // Set response headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      message: "Error generating PDF",
      error: error.message,
    });
  }
});

module.exports = router;
