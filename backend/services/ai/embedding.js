const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-0014" });
    const result = await model.embedContent(text);
    console.log("📏 Gemini Embedding Length:", result.embedding.values.length);
    return result.embedding.values; 
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
};

module.exports = { generateEmbedding };