require('dotenv').config();
const axios = require('axios');

async function listModelsHttp() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("Fetching available models...");
    try {
        const response = await axios.get(url);
        const models = response.data.models;
        console.log("✅ Available Models:");
        models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name}`);
            }
        });
    } catch (error) {
        console.error("❌ Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModelsHttp();
