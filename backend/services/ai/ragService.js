const Groq = require("groq-sdk");
const Chunk = require("../../models/Chunk");
const { generateEmbedding } = require("./embedding");
const mongoose = require("mongoose");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSmartAnswer = async (question, materialId, userProfile = null) => {
  try {
    let contextText = "";
    let pagesFound = [];
    let sourceUsed = 'general';

    // 1. Check if Material ID is valid for PDF Search
    if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
      console.log("🚀 RAG: Searching PDF Context...");
      const queryVector = await generateEmbedding(question);

      let candidates = [];
      try {
        candidates = await Chunk.aggregate([
          {
            $vectorSearch: {
              index: "vector_index", 
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 100,
              limit: 5,
              filter: { materialId: new mongoose.Types.ObjectId(materialId) }
            }
          },
          { $project: { text: 1, pageNumber: 1 } }
        ]);
      } catch (err) {
        console.log("⚠️ Vector Search failed, trying Regex...");
        const keywords = question.split(" ").filter(w => w.length > 3).slice(0, 3);
        candidates = await Chunk.find({
          materialId: new mongoose.Types.ObjectId(materialId),
          text: { $regex: keywords.join("|"), $options: "i" }
        }).limit(5);
      }

      if (candidates && candidates.length > 0) {
        contextText = candidates.map(c => `[PAGE ${c.pageNumber}]: ${c.text}`).join("\n\n");
        pagesFound = [...new Set(candidates.map(c => c.pageNumber))].sort((a, b) => a - b);
        sourceUsed = 'pdf';
      }
    }

    // 2. Build Smart System Prompt
    const systemPrompt = `You are an expert AI Study Assistant.
    - If PDF context is provided, prioritize it and mention page numbers.
    - If NO context is found or question is general, use your own knowledge to help the student.
    - Use **bold** for key terms and bullet points for clarity.
    ${sourceUsed === 'pdf' ? '📍 Always end with: Source: PDF Page(s) ' + pagesFound.join(", ") : '📍 Note: Answered from General Knowledge (Not found in PDF).'}`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3, 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextText ? `CONTEXT:\n${contextText}\n\nQUESTION: ${question}` : question }
      ]
    });

    return {
      answer: chatCompletion.choices[0].message.content,
      sources: pagesFound,
      sourceType: sourceUsed
    };

  } catch (error) {
    console.error("❌ RAG Service Error:", error.message);
    // Crash hone se bachane ke liye default answer
    return { answer: "I'm having trouble connecting to my brain. Please try again!", sourceType: 'error' };
  }
};

module.exports = { getSmartAnswer };