// utils/ai.js - AI Model Integration using Google Gemini (Free)
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
let genAI = null;
let model = null;

const initializeAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("GEMINI_API_KEY not found. AI features will use fallback mode.");
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.5-flash - the latest model available for your key
        model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });
        console.log("✅ Gemini AI initialized successfully");
        return true;
    } catch (error) {
        console.error("Failed to initialize Gemini AI:", error.message);
        return false;
    }
};

// Generate AI response for natural language query
const generateAIResponse = async (query, context) => {
    if (!model) {
        return null; // Will use fallback
    }

    const prompt = `You are a helpful business analytics AI assistant for a billing/invoicing application called BillTrack Pro. 
You help users understand their sales, customers, inventory, and business performance.

BUSINESS CONTEXT:
${JSON.stringify(context, null, 2)}

USER QUESTION: "${query}"

Provide a helpful, concise response based on the business data provided. 
- Use specific numbers from the context when available
- Format currency in Indian Rupees (₹)
- Be conversational but professional
- If you can't answer from the context, say so politely
- Keep responses under 200 words

Response:`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini AI error:", error.message);
        return null;
    }
};

// Generate sales insights using AI
const generateSalesInsightsAI = async (salesData) => {
    if (!model) {
        return null;
    }

    const prompt = `You are a business analytics AI. Analyze this sales data and provide 3 actionable insights.

SALES DATA:
- Total Revenue (90 days): ₹${salesData.totalRevenue}
- Average Daily Revenue: ₹${salesData.avgDaily}
- Trend: ${salesData.trendDirection} (${salesData.trendPercentage}% weekly)
- Data Points: ${salesData.dataPoints} days
- Top Product: ${salesData.topProduct || 'N/A'}
- Weekend vs Weekday: Weekend avg ₹${salesData.weekendAvg || 0}, Weekday avg ₹${salesData.weekdayAvg || 0}

Provide exactly 3 insights in this JSON format:
[
  {"type": "positive|warning|info", "title": "Short Title", "message": "Actionable insight under 50 words"},
  {"type": "positive|warning|info", "title": "Short Title", "message": "Actionable insight under 50 words"},
  {"type": "positive|warning|info", "title": "Short Title", "message": "Actionable insight under 50 words"}
]

Only respond with valid JSON array, no other text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error("Gemini sales insights error:", error.message);
        return null;
    }
};

// Generate customer insights using AI
const generateCustomerInsightsAI = async (customerData) => {
    if (!model) {
        return null;
    }

    const prompt = `You are a customer analytics AI. Analyze this customer data and provide 4 actionable insights.

CUSTOMER DATA:
- Total Customers: ${customerData.totalCustomers}
- VIP Customers: ${customerData.vipCount}
- Regular Customers: ${customerData.regularCount}
- New Customers: ${customerData.newCount}
- At-Risk Customers (no purchase 45+ days): ${customerData.atRiskCount}
- Total Outstanding Dues: ₹${customerData.totalDues}
- Average Loyalty Score: ${customerData.avgLoyaltyScore}%

Provide exactly 4 insights in this JSON format:
[
  {"type": "positive|warning|danger|info", "title": "Short Title", "message": "Actionable insight under 40 words"},
  {"type": "positive|warning|danger|info", "title": "Short Title", "message": "Actionable insight under 40 words"},
  {"type": "positive|warning|danger|info", "title": "Short Title", "message": "Actionable insight under 40 words"},
  {"type": "positive|warning|danger|info", "title": "Short Title", "message": "Actionable insight under 40 words"}
]

Only respond with valid JSON array, no other text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error("Gemini customer insights error:", error.message);
        return null;
    }
};

// Chat with AI about business
const chatWithAI = async (userMessage, businessContext) => {
    if (!model) {
        return null;
    }

    const prompt = `You are a helpful AI assistant for BillTrack Pro, a billing and inventory management application.

CURRENT BUSINESS SNAPSHOT:
- Total Products: ${businessContext.totalProducts}
- Total Customers: ${businessContext.totalCustomers}
- Today's Revenue: ₹${businessContext.todayRevenue}
- This Month's Revenue: ₹${businessContext.monthRevenue}
- Pending Dues: ₹${businessContext.totalDues}
- Low Stock Items: ${businessContext.lowStockCount}
- Out of Stock Items: ${businessContext.outOfStockCount}
- Recent Invoices (today): ${businessContext.todayInvoices}

Top 5 Products by Revenue:
${businessContext.topProducts?.map((p, i) => `${i + 1}. ${p.name}: ₹${p.revenue}`).join('\n') || 'No data'}

Top 5 Customers by Dues:
${businessContext.topDueCustomers?.map((c, i) => `${i + 1}. ${c.name}: ₹${c.amountDue}`).join('\n') || 'No dues'}

USER QUESTION: "${userMessage}"

Provide a helpful, conversational response. Use the data above to answer. Format currency in ₹.
If asked for lists or tables, format them clearly. Keep the response concise but complete.
If you can't determine something from the data, be honest about it.

Response:`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini chat error:", error.message);
        return null;
    }
};

module.exports = {
    initializeAI,
    generateAIResponse,
    generateSalesInsightsAI,
    generateCustomerInsightsAI,
    chatWithAI,
};
