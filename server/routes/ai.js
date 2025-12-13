// routes/ai.js - AI Features API with Gemini Integration
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const StockHistory = require("../models/StockHistory");
const {
    initializeAI,
    generateSalesInsightsAI,
    generateCustomerInsightsAI,
    chatWithAI,
} = require("../utils/ai");

// Initialize AI on startup
initializeAI();

// ==========================================
// SMART SALES PREDICTIONS (with AI Insights)
// ==========================================
router.get("/sales-predictions", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = "week" } = req.query;

        // Get historical invoice data (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const invoices = await Invoice.find({
            createdBy: userId,
            date: { $gte: ninetyDaysAgo },
            status: { $ne: "draft" },
        }).sort({ date: 1 });

        // Group by day
        const dailySales = {};
        invoices.forEach((inv) => {
            const dateKey = inv.date.toISOString().split("T")[0];
            if (!dailySales[dateKey]) {
                dailySales[dateKey] = { total: 0, count: 0 };
            }
            dailySales[dateKey].total += inv.total;
            dailySales[dateKey].count += 1;
        });

        const salesArray = Object.entries(dailySales).map(([date, data]) => ({
            date,
            ...data,
        }));

        // Calculate trend (simple linear regression)
        const n = salesArray.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        salesArray.forEach((day, i) => {
            sumX += i;
            sumY += day.total;
            sumXY += i * day.total;
            sumXX += i * i;
        });

        const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
        const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

        // Predict next 7 days
        const predictions = [];
        const today = new Date();
        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const predictedValue = Math.max(0, intercept + slope * (n + i));

            const dayOfWeek = futureDate.getDay();
            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek];

            const sameDayInvoices = invoices.filter(inv => inv.date.getDay() === dayOfWeek);
            const dayAverage = sameDayInvoices.length > 0
                ? sameDayInvoices.reduce((sum, inv) => sum + inv.total, 0) / sameDayInvoices.length
                : predictedValue;

            const blendedPrediction = (predictedValue * 0.6) + (dayAverage * 0.4);

            predictions.push({
                date: futureDate.toISOString().split("T")[0],
                dayName,
                predicted: Math.round(blendedPrediction * 100) / 100,
                confidence: Math.min(85, 50 + (n / 2)),
            });
        }

        // Get top selling products
        const productSales = {};
        invoices.forEach((inv) => {
            inv.items.forEach((item) => {
                const productId = item.product.toString();
                if (!productSales[productId]) {
                    productSales[productId] = { quantity: 0, revenue: 0 };
                }
                productSales[productId].quantity += item.quantity;
                productSales[productId].revenue += item.subtotal;
            });
        });

        const topProducts = await Promise.all(
            Object.entries(productSales)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .slice(0, 5)
                .map(async ([productId, data], index) => {
                    const product = await Product.findById(productId);
                    return {
                        name: product?.name || "Unknown",
                        quantity: data.quantity,
                        revenue: data.revenue,
                        trend: slope > 0 ? "up" : slope < 0 ? "down" : "stable",
                    };
                })
        );

        // Weekend vs weekday analysis
        const weekendSales = salesArray.filter(d => {
            const day = new Date(d.date).getDay();
            return day === 0 || day === 6;
        });
        const weekdaySales = salesArray.filter(d => {
            const day = new Date(d.date).getDay();
            return day >= 1 && day <= 5;
        });

        const avgWeekend = weekendSales.length > 0
            ? weekendSales.reduce((s, d) => s + d.total, 0) / weekendSales.length
            : 0;
        const avgWeekday = weekdaySales.length > 0
            ? weekdaySales.reduce((s, d) => s + d.total, 0) / weekdaySales.length
            : 0;

        // Calculate summary stats
        const totalRevenue = salesArray.reduce((sum, day) => sum + day.total, 0);
        const avgDaily = n > 0 ? totalRevenue / n : 0;
        const trendDirection = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";
        const trendPercentage = avgDaily > 0 ? ((slope * 7) / avgDaily) * 100 : 0;

        // Try to get AI-generated insights
        let insights = null;
        try {
            insights = await generateSalesInsightsAI({
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                avgDaily: Math.round(avgDaily * 100) / 100,
                trendDirection,
                trendPercentage: Math.round(trendPercentage * 100) / 100,
                dataPoints: n,
                topProduct: topProducts[0]?.name || null,
                weekendAvg: Math.round(avgWeekend * 100) / 100,
                weekdayAvg: Math.round(avgWeekday * 100) / 100,
            });
        } catch (aiError) {
            console.error("AI insights generation failed:", aiError.message);
        }

        // Fallback to rule-based insights if AI fails
        if (!insights) {
            insights = generateFallbackSalesInsights(salesArray, slope, avgDaily, topProducts, avgWeekend, avgWeekday);
        }

        res.json({
            success: true,
            aiPowered: insights !== null && Array.isArray(insights),
            data: {
                predictions,
                historicalData: salesArray.slice(-30),
                topProducts,
                summary: {
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    avgDailyRevenue: Math.round(avgDaily * 100) / 100,
                    trendDirection,
                    trendPercentage: Math.round(trendPercentage * 100) / 100,
                    dataPoints: n,
                    predictedNextWeek: predictions.reduce((sum, p) => sum + p.predicted, 0),
                },
                insights,
            },
        });
    } catch (error) {
        console.error("Sales prediction error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback insights when AI is unavailable
function generateFallbackSalesInsights(salesArray, slope, avgDaily, topProducts, avgWeekend, avgWeekday) {
    const insights = [];

    if (slope > 0) {
        insights.push({
            type: "positive",
            title: "Sales Trending Up",
            message: "Your sales are showing an upward trend. Keep up the momentum!",
        });
    } else if (slope < 0) {
        insights.push({
            type: "warning",
            title: "Sales Declining",
            message: "Sales have been declining recently. Consider promotions or new products.",
        });
    } else {
        insights.push({
            type: "info",
            title: "Stable Sales",
            message: "Your sales are stable. Consider strategies to boost growth.",
        });
    }

    if (topProducts.length > 0) {
        insights.push({
            type: "positive",
            title: "Top Performer",
            message: `"${topProducts[0].name}" is your best seller with ₹${topProducts[0].revenue.toFixed(2)} in revenue.`,
        });
    }

    if (avgWeekend > avgWeekday * 1.2) {
        insights.push({
            type: "info",
            title: "Weekend Surge",
            message: `Weekends generate ${Math.round((avgWeekend / avgWeekday - 1) * 100)}% more revenue. Focus weekend promotions.`,
        });
    }

    return insights;
}

// ==========================================
// CUSTOMER INSIGHTS (with AI Analysis)
// ==========================================
router.get("/customer-insights", auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const customers = await Customer.find({ createdBy: userId });
        const invoices = await Invoice.find({
            createdBy: userId,
            status: { $ne: "draft" },
        }).populate("customer._id");

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Analyze each customer
        const customerAnalysis = await Promise.all(
            customers.map(async (customer) => {
                const customerInvoices = invoices.filter(
                    (inv) => inv.customer?._id?.toString() === customer._id.toString()
                );

                const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
                const invoiceCount = customerInvoices.length;
                const avgOrderValue = invoiceCount > 0 ? totalSpent / invoiceCount : 0;

                const lastInvoice = customerInvoices.sort((a, b) => b.date - a.date)[0];
                const lastPurchaseDate = lastInvoice?.date;
                const daysSinceLastPurchase = lastPurchaseDate
                    ? Math.floor((new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24))
                    : null;

                const recentInvoices = customerInvoices.filter(inv => inv.date >= thirtyDaysAgo);
                const purchaseFrequency = recentInvoices.length;

                let segment = "new";
                let riskLevel = "low";
                let loyaltyScore = 0;

                if (invoiceCount >= 10 && avgOrderValue > 500) {
                    segment = "vip";
                    loyaltyScore = 90;
                } else if (invoiceCount >= 5) {
                    segment = "regular";
                    loyaltyScore = 70;
                } else if (invoiceCount >= 2) {
                    segment = "returning";
                    loyaltyScore = 50;
                } else {
                    segment = "new";
                    loyaltyScore = 30;
                }

                if (daysSinceLastPurchase > 60) {
                    riskLevel = "high";
                    loyaltyScore -= 30;
                } else if (daysSinceLastPurchase > 30) {
                    riskLevel = "medium";
                    loyaltyScore -= 15;
                }

                if (customer.amountDue > 5000) {
                    riskLevel = "high";
                } else if (customer.amountDue > 2000) {
                    riskLevel = customer.amountDue > 0 ? "medium" : riskLevel;
                }

                return {
                    _id: customer._id,
                    name: customer.name,
                    phoneNumber: customer.phoneNumber,
                    place: customer.place,
                    amountDue: customer.amountDue,
                    totalSpent,
                    invoiceCount,
                    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                    lastPurchaseDate,
                    daysSinceLastPurchase,
                    purchaseFrequency,
                    segment,
                    riskLevel,
                    loyaltyScore: Math.max(0, Math.min(100, loyaltyScore)),
                };
            })
        );

        const segmentCounts = {
            vip: customerAnalysis.filter(c => c.segment === "vip").length,
            regular: customerAnalysis.filter(c => c.segment === "regular").length,
            returning: customerAnalysis.filter(c => c.segment === "returning").length,
            new: customerAnalysis.filter(c => c.segment === "new").length,
        };

        const vipCustomers = customerAnalysis.filter(c => c.segment === "vip").sort((a, b) => b.totalSpent - a.totalSpent);
        const atRiskCustomers = customerAnalysis.filter(c => c.riskLevel === "high" || c.daysSinceLastPurchase > 45).sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase);
        const highDueCustomers = customerAnalysis.filter(c => c.amountDue > 0).sort((a, b) => b.amountDue - a.amountDue);
        const newCustomers = customerAnalysis.filter(c => c.segment === "new" && c.daysSinceLastPurchase !== null && c.daysSinceLastPurchase < 30);

        const totalDues = customerAnalysis.reduce((sum, c) => sum + Math.max(0, c.amountDue), 0);
        const avgLoyaltyScore = customerAnalysis.length > 0
            ? customerAnalysis.reduce((sum, c) => sum + c.loyaltyScore, 0) / customerAnalysis.length
            : 0;

        // Try to get AI-generated insights
        let insights = null;
        try {
            insights = await generateCustomerInsightsAI({
                totalCustomers: customers.length,
                vipCount: segmentCounts.vip,
                regularCount: segmentCounts.regular,
                newCount: segmentCounts.new,
                atRiskCount: atRiskCustomers.length,
                totalDues: Math.round(totalDues * 100) / 100,
                avgLoyaltyScore: Math.round(avgLoyaltyScore),
            });
        } catch (aiError) {
            console.error("AI customer insights failed:", aiError.message);
        }

        // Fallback insights
        if (!insights) {
            insights = generateFallbackCustomerInsights(customerAnalysis, segmentCounts, atRiskCustomers.length, totalDues);
        }

        res.json({
            success: true,
            aiPowered: insights !== null && Array.isArray(insights),
            data: {
                totalCustomers: customers.length,
                segmentCounts,
                vipCustomers: vipCustomers.slice(0, 10),
                atRiskCustomers: atRiskCustomers.slice(0, 10),
                highDueCustomers: highDueCustomers.slice(0, 10),
                newCustomers: newCustomers.slice(0, 10),
                allCustomers: customerAnalysis.sort((a, b) => b.loyaltyScore - a.loyaltyScore),
                insights,
                summary: {
                    totalDues,
                    avgLoyaltyScore: Math.round(avgLoyaltyScore),
                    churnRisk: atRiskCustomers.length,
                },
            },
        });
    } catch (error) {
        console.error("Customer insights error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

function generateFallbackCustomerInsights(customers, segmentCounts, atRiskCount, totalDues) {
    const insights = [];
    const totalCustomers = customers.length;

    if (segmentCounts.vip > 0) {
        insights.push({
            type: "positive",
            title: `${segmentCounts.vip} VIP Customers`,
            message: `These loyal customers drive most of your revenue. Keep them engaged!`,
        });
    }

    if (atRiskCount > 0) {
        insights.push({
            type: "warning",
            title: `${atRiskCount} At-Risk Customers`,
            message: `These customers haven't purchased recently. Reach out with special offers.`,
        });
    }

    if (totalDues > 5000) {
        insights.push({
            type: "danger",
            title: `₹${totalDues.toFixed(0)} Pending`,
            message: `Follow up on outstanding payments to improve cash flow.`,
        });
    }

    if (segmentCounts.new > 0) {
        insights.push({
            type: "info",
            title: `${segmentCounts.new} New Customers`,
            message: `Convert these first-time buyers into regulars with great service.`,
        });
    }

    return insights;
}

// ==========================================
// NATURAL LANGUAGE QUERY (AI Powered)
// ==========================================
router.post("/query", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { query } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ success: false, error: "Query is required" });
        }

        // Gather business context for AI
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalProducts,
            totalCustomers,
            todayInvoices,
            monthInvoices,
            allCustomers,
            lowStockProducts,
            outOfStockProducts,
        ] = await Promise.all([
            Product.countDocuments({ createdBy: userId }),
            Customer.countDocuments({ createdBy: userId }),
            Invoice.find({ createdBy: userId, date: { $gte: today }, status: { $ne: "draft" } }),
            Invoice.find({ createdBy: userId, date: { $gte: monthStart }, status: { $ne: "draft" } }),
            Customer.find({ createdBy: userId }),
            Product.find({ createdBy: userId, isStockRequired: true, stock: { $lte: 10, $gt: 0 } }),
            Product.find({ createdBy: userId, isStockRequired: true, stock: 0 }),
        ]);

        // Calculate revenues
        const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalDues = allCustomers.reduce((sum, c) => sum + Math.max(0, c.amountDue), 0);

        // Get top products
        const productSales = {};
        monthInvoices.forEach((inv) => {
            inv.items.forEach((item) => {
                const productId = item.product.toString();
                if (!productSales[productId]) {
                    productSales[productId] = { quantity: 0, revenue: 0 };
                }
                productSales[productId].quantity += item.quantity;
                productSales[productId].revenue += item.subtotal;
            });
        });

        const topProducts = await Promise.all(
            Object.entries(productSales)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .slice(0, 5)
                .map(async ([productId, data]) => {
                    const product = await Product.findById(productId);
                    return { name: product?.name || "Unknown", revenue: data.revenue };
                })
        );

        const topDueCustomers = allCustomers
            .filter(c => c.amountDue > 0)
            .sort((a, b) => b.amountDue - a.amountDue)
            .slice(0, 5)
            .map(c => ({ name: c.name, amountDue: c.amountDue }));

        const businessContext = {
            totalProducts,
            totalCustomers,
            todayRevenue: Math.round(todayRevenue * 100) / 100,
            monthRevenue: Math.round(monthRevenue * 100) / 100,
            totalDues: Math.round(totalDues * 100) / 100,
            lowStockCount: lowStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
            todayInvoices: todayInvoices.length,
            topProducts,
            topDueCustomers,
        };

        // Try AI-powered response
        let aiResponse = null;
        try {
            aiResponse = await chatWithAI(query, businessContext);
        } catch (aiError) {
            console.error("AI chat error:", aiError.message);
        }

        if (aiResponse) {
            // AI response successful
            res.json({
                success: true,
                aiPowered: true,
                data: {
                    type: "ai-response",
                    title: "AI Assistant",
                    message: aiResponse,
                    context: {
                        todayRevenue: businessContext.todayRevenue,
                        monthRevenue: businessContext.monthRevenue,
                        totalCustomers: businessContext.totalCustomers,
                    },
                },
            });
        } else {
            // Fallback to rule-based response
            const fallbackResponse = await handleFallbackQuery(userId, query, businessContext);
            res.json({
                success: true,
                aiPowered: false,
                data: fallbackResponse,
            });
        }
    } catch (error) {
        console.error("Query error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback query handler (when AI is unavailable)
async function handleFallbackQuery(userId, query, context) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("revenue") || lowerQuery.includes("sales")) {
        return {
            type: "stats",
            title: "Revenue Summary",
            summary: `Here's your revenue overview`,
            stats: [
                { label: "Today", value: `₹${context.todayRevenue.toFixed(2)}`, color: "blue" },
                { label: "This Month", value: `₹${context.monthRevenue.toFixed(2)}`, color: "green" },
                { label: "Pending Dues", value: `₹${context.totalDues.toFixed(2)}`, color: "red" },
            ],
        };
    }

    if (lowerQuery.includes("stock") || lowerQuery.includes("inventory")) {
        return {
            type: "stats",
            title: "Stock Overview",
            summary: `Your inventory status`,
            stats: [
                { label: "Total Products", value: context.totalProducts.toString(), color: "blue" },
                { label: "Low Stock", value: context.lowStockCount.toString(), color: "yellow" },
                { label: "Out of Stock", value: context.outOfStockCount.toString(), color: "red" },
            ],
        };
    }

    if (lowerQuery.includes("customer")) {
        return {
            type: "stats",
            title: "Customer Overview",
            summary: `Your customer summary`,
            stats: [
                { label: "Total Customers", value: context.totalCustomers.toString(), color: "blue" },
                { label: "Total Dues", value: `₹${context.totalDues.toFixed(2)}`, color: "red" },
            ],
        };
    }

    // Default help response
    return {
        type: "help",
        title: "I can help you with:",
        summary: "AI is currently unavailable. Try these queries:",
        suggestions: [
            "Show me today's revenue",
            "What's my stock status?",
            "How many customers do I have?",
        ],
        note: "💡 Add GEMINI_API_KEY to .env for AI-powered responses",
    };
}

module.exports = router;
