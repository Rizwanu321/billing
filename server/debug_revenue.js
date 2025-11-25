const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Register models in order
require('./models/User');
require('./models/Category');
require('./models/Product');
const Transaction = require('./models/Transaction');
const Invoice = require('./models/Invoice');

async function debugRevenue() {
    try {
        console.log("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Not Found");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const invoices = await Invoice.find()
            .sort({ date: -1 })
            .limit(5)
            .populate({
                path: 'items.product',
                populate: { path: 'category' }
            })
            .populate('customer');

        console.log("\n=== RECENT INVOICES ===");
        let targetInvoiceId = null;
        let targetCustomerId = null;

        for (const inv of invoices) {
            console.log(`Invoice: ${inv.invoiceNumber} | Total: ${inv.total} | Due: ${inv.dueAmount} | ID: ${inv._id}`);

            let hasFruits = false;
            if (inv.items) {
                inv.items.forEach(i => {
                    const catName = i.product?.category?.name;
                    console.log(`  - Item: ${i.product?.name} (${catName}) | Subtotal: ${i.subtotal}`);
                    if (catName === 'Fruits') hasFruits = true;
                });
            }

            if (hasFruits && inv.total === 180) {
                console.log("  -> POTENTIAL TARGET (Total 180, Fruits)");
                targetInvoiceId = inv._id;
                targetCustomerId = inv.customer?._id;
            }
        }

        if (targetCustomerId) {
            console.log(`\n=== TRANSACTIONS FOR CUSTOMER ${targetCustomerId} ===`);
            const transactions = await Transaction.find({ customer: targetCustomerId }).sort({ date: -1 });

            transactions.forEach(t => {
                console.log(`Tx: ${t._id} | Amount: ${t.amount} | InvoiceId: ${t.invoiceId} | Type: ${t.paymentMode}`);
            });
        } else {
            console.log("\nCould not identify target customer/invoice definitively. Listing all recent transactions.");
            const transactions = await Transaction.find().sort({ date: -1 }).limit(10);
            transactions.forEach(t => {
                console.log(`Tx: ${t._id} | Amount: ${t.amount} | InvoiceId: ${t.invoiceId} | Customer: ${t.customer}`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugRevenue();
