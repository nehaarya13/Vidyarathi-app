require("dotenv").config();
const axios = require("axios");

async function generateLLMResponse(prompt, userContext = null) {
  try {
    let systemMessage = "You are a friendly AI study assistant. Explain things simply.";

    if (userContext?.userType && userContext?.contextDetails) {
      systemMessage = `You are a StudyBuddy AI Mentor. The user is a ${userContext.userType} specializing in ${userContext.contextDetails}.
      1. Use level-appropriate language. 
      2. Be exam-oriented for competitive students. 3. Maintain a supportive tone.`;
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("🔥 GROQ ERROR:", error.message);
    return "I'm having trouble connecting to my brain right now. Please try again!";
  }
}

module.exports = generateLLMResponse;