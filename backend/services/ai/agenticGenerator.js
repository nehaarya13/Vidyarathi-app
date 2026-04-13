const MasteryGraph = require("../../models/MasteryGraph");
const Chunk = require("../../models/Chunk");
const generateLLMResponse = require("../llmAdapter");

const generateSmartTask = async (userId, materialId, topicKey) => {
  try {
    // 1️⃣ Fetch mastery graph
    const graph = await MasteryGraph.findOne({ userId, materialId });
    if (!graph) throw new Error("MasteryGraph not found");

    const topicData = graph.topics.find((t) => t.topicKey === topicKey);
    if (!topicData) throw new Error("Topic not found in mastery graph");

    const masteryLevel = topicData.masteryLevel ?? 50; // fallback

    let difficulty = "Medium (Conceptual Understanding)";
    let questionCount = 2;

    // 2️⃣ Agentic decision making (The Brain)
    if (masteryLevel < 40) {
      difficulty = "Easy (Basic Recall / Definitions)";
      questionCount = 3;
    } else if (masteryLevel > 75) {
      difficulty = "Hard (Scenario-based / Analytical)";
      questionCount = 1;
    }

    // 3️⃣ RAG context (Getting content from PDF)
    const chunks = await Chunk.find({ materialId, topicKey }).limit(3);
    const context =
      chunks.length > 0
        ? chunks.map((c) => c.text).join("\n")
        : "No direct context found. Generate questions from general understanding.";

    // 4️⃣ Prompt
    const prompt = `
You are an Agentic Learning Assistant.

Student Topic: ${topicData.name}
Current Mastery Level: ${masteryLevel}%
Target Difficulty: ${difficulty}

Context from study material:
${context}

TASK:
Generate ${questionCount} questions.

RULES:
- Output ONLY valid JSON array
- No explanation text, no markdown
- FORMAT: [{"question": "...", "options": ["...", "...", "...", "..."], "answerIndex": 0, "difficulty": "${difficulty}"}]
`;

    const aiResponse = await generateLLMResponse(prompt);

    // 5️⃣ Safe JSON cleanup & Extraction
    const cleanResponse = aiResponse.replace(/```json|```/g, "").trim();

    // Regex to extract only the JSON array part [ ... ]
    const jsonMatch = cleanResponse.match(/\[.*\]/s);
    const finalJson = jsonMatch ? jsonMatch[0] : cleanResponse;

    return JSON.parse(finalJson);
  } catch (error) {
    console.error("❌ Agentic Generator Error:", error.message);
    throw error;
  }
};

module.exports = { generateSmartTask };