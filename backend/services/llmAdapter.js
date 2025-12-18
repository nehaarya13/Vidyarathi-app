// services/llmAdapter.js
require("dotenv").config();
const axios = require("axios");

async function generateLLMResponse(prompt) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a friendly AI study assistant for college students. Explain things simply."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error(
      "🔥 GROQ ERROR:",
      error.response?.data || error.message
    );
    return "❌ LLM error occurred.";
  }
}

module.exports = generateLLMResponse;
