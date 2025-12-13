require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing");
        return;
    }

    // We can't list models directly with the SDK easily in all versions, 
    // but let's try a standard generation with a very basic model name "gemini-pro" again just in case,
    // or try to use the listModels via REST if we can, but SDK is better.
    // Actually, let's just try to hit the API with a fallback chain.

    // Better strategy: Try common model names until one works.
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-pro"];

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
        console.log(`Trying model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}!`);
            return;
        } catch (error) {
            console.log(`❌ Failed ${modelName}: ${error.message.split(':')[0]}`);
        }
    }
    console.log("❌ All models failed.");
}

listModels();
