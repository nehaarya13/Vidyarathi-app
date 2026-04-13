const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * 🧠 UNIVERSAL AI EVALUATOR
 * Evaluate any subject (Coding, Science, Arts) based on provided PDF context.
 * Supports Semantic Matching & Hinglish for better user experience.
 */
const evaluateProgress = async ({
  question,
  studentAnswer,
  topicKeys,
  referenceContext
}) => {
  try {
    // 1. Check for Empty Input
    if (!studentAnswer || studentAnswer.trim() === "") {
      return {
        topicKey: topicKeys[0] || "General",
        score: 0,
        status: "Red",
        understanding: "None",
        feedback: "Koshish toh karo! Try answering in your own words.",
        needsRemedial: true,
        remedial_hint: "Tip: Read the question again and try to recall keywords from your file."
      };
    }

    // 2. AI Processing with Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Consistency maintain karne ke liye low temperature
      messages: [
        {
          role: "system",
          content: `You are a Universal AI Subject Matter Expert. 
          Your goal is to evaluate the student's answer based STRICTLY on the provided [DATABASE CONTEXT].

          EVALUATION GUIDELINES:
          1. UNIVERSAL CONTEXT: Grade based on provided context regardless of subject.
          2. SEMANTIC FLEXIBILITY: Full credit for correct concepts even if explained in simple language or Hinglish.
          3. KEYWORD MATCHING: Verify if core technical terms or their meanings are present.
          4. SCORING BRACKETS:
             - 85-100: Mastery - Correct and complete.
             - 50-84: Developing - Correct but missing secondary details.
             - Below 50: Needs Help - Conceptual errors or irrelevant.
          5. FEEDBACK: Supportive, professional, and max 15 words.
          6. REMEDIAL: If score < 75, provide a specific one-line hint.`
        },
        {
          role: "user",
          content: `
          [DATABASE CONTEXT]
          ${referenceContext}

          [USER ATTEMPT]
          Question: ${question}
          Student's Answer: ${studentAnswer}
          Target Topic Key: ${topicKeys[0] || "General"}

          [OUTPUT JSON FORMAT]
          {
            "topicKey": "string",
            "score": number,
            "understanding": "Clear" | "Partial" | "Poor",
            "feedback": "string",
            "remedial_hint": "string"
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    // 3. Parse Result
    let result = JSON.parse(response.choices[0].message.content);

    // 🛠 SAFETY LOCK: Ensure the topicKey matches exactly what we sent
    // Isse MasteryGraph update hone mein error nahi aayegi
    if (topicKeys && topicKeys.length > 0) {
      result.topicKey = topicKeys[0];
    }

    // 4. Dynamic Status & Remedial Logic
    result.needsRemedial = result.score < 75;
    
    // Mapping scores to Colors for MasteryGraph UI
    if (result.score >= 80) {
      result.status = "Green";
      result.understanding = "Clear";
    } else if (result.score >= 45) {
      result.status = "Yellow";
      result.understanding = "Partial";
    } else {
      result.status = "Red";
      result.understanding = "Poor";
    }

    return result;

  } catch (error) {
    console.error("❌ Evaluator Critical Error:", error.message);
    // Reliable Fallback
    return {
      topicKey: topicKeys[0] || "General",
      score: 0,
      status: "Red",
      understanding: "Error",
      feedback: "System is busy. Let's try this one again.",
      needsRemedial: true,
      remedial_hint: "Check your internet connection or refresh the app."
    };
  }
};

module.exports = { evaluateProgress };