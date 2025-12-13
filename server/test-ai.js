require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env file");
        return;
    }
    console.log("Found API Key:", apiKey.substring(0, 5) + "...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Testing model: gemini-1.5-flash...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("✅ Response received:", response.text());
        console.log("🎉 Gemini AI is working correctly!");
    } catch (error) {
        console.error("❌ Error testing Gemini:", error.message);
    }
}

testGemini();
