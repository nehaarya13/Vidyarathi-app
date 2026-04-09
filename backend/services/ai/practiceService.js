const Chunk = require("../../models/Chunk");
const generateLLMResponse = require("../llmAdapter"); 
const mongoose = require("mongoose");

const generatePracticeSet = async (materialId, pattern) => {
  try {
    let searchId = materialId;
    if (mongoose.Types.ObjectId.isValid(materialId)) {
        searchId = new mongoose.Types.ObjectId(materialId);
    }

    // 1️⃣ PDF Context fetch karna
    const chunks = await Chunk.find({ materialId: searchId }).limit(15);
    let context = chunks.map((c) => c.text).join("\n");

    if (!context || context.length < 50) {
      context = "General academic and engineering principles including Object Oriented Programming (OOPS).";
    }

    // 2️⃣ Pattern definition with Topic Extraction
    const prompts = {
      mcq: `Generate 10 Multiple Choice Questions. 
            Format: [{
              "question": "...", 
              "options": ["...", "...", "...", "..."], 
              "answerIndex": 0, 
              "correctAnswer": "...",
              "topicKey": "Inheritance" 
            }]
            CRITICAL: Identify the specific sub-topic (e.g., Polymorphism, Classes, Abstraction) for 'topicKey'.`,

      "2marks": `Generate 5 very short conceptual questions. 
                 Format: [{"question": "...", "topicKey": "OOPS Basics"}]`,

      "5marks": `Generate 2 medium-length descriptive questions. 
                 Format: [{"question": "...", "topicKey": "Advanced Concepts"}]`,

      "10marks": `Generate 1 complex scenario question. 
                  Format: [{"question": "...", "topicKey": "System Design"}]`,
    };

    // 3️⃣ Final Prompt to AI
    const prompt = `
      System: You are an Academic Examiner. Your task is to extract sub-topics from the context.
      Return ONLY a raw JSON array. NO markdown, NO preamble.
      
      CONTEXT: ${context.substring(0, 6000)}
      
      TASK: ${prompts[pattern]}
      
      RULES:
      - 'topicKey' MUST be a specific string based on the question content (e.g., if question is about 'Inheritance', topicKey is 'Inheritance').
      - For MCQs, ensure 'correctAnswer' is the EXACT text from one of the options.
    `;

    const aiResponse = await generateLLMResponse(prompt);

    // 🔍 4️⃣ Robust JSON Extraction (REGEX)
    let cleanResponse = aiResponse.trim();
    
    // Pure text se array [...] nikaalne ke liye
    const arrayMatch = cleanResponse.match(/\[\s*{[\s\S]*}\s*\]/);
    
    if (arrayMatch) {
        cleanResponse = arrayMatch[0];
    } else {
        cleanResponse = cleanResponse.replace(/```json|```/g, "").trim();
    }

    try {
        const parsedData = JSON.parse(cleanResponse);
        console.log(`✅ AI identified topics like: ${parsedData[0]?.topicKey || 'General'}`);
        return parsedData;
    } catch (parseError) {
        console.error("❌ JSON Extraction Failed. Raw AI Response:", aiResponse);
        throw new Error("AI response was not valid JSON");
    }

  } catch (error) {
    console.error("❌ Practice Service Error:", error.message);
    
    // 🛡️ Safe Fallback
    return [{ 
        question: "What are the core pillars of Object Oriented Programming?",
        options: ["Inheritance", "Polymorphism", "Encapsulation", "All of the above"],
        answerIndex: 3,
        correctAnswer: "All of the above",
        topicKey: "OOPS Pillars"
    }];
  }
};

module.exports = { generatePracticeSet };