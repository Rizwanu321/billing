require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini25() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Gemini 2.5 Flash...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent("Hello from 2025!");
        const response = await result.response;
        console.log("✅ Response received:", response.text());
        console.log("🎉 Gemini 2.5 is working!");
    } catch (error) {
        console.error("❌ Error testing Gemini 2.5:", error.message);
    }
}

testGemini25();
