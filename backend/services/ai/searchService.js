const StudyMaterial = require('../../models/StudyMaterial');
const { generateEmbedding } = require('./embedding');

const findRelevantContext = async (userQuestion, materialId) => {
  try {
    // 1. User ke sawal ko vector (numbers) mein badlo
    const questionVector = await generateEmbedding(userQuestion);

    // 2. MongoDB mein milta-julta text dhoondho (Vector Search)
    // Note: Iske liye hum MongoDB dashboard par Index banayenge baad mein
    const results = await StudyMaterial.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "chunks.embedding",
          queryVector: questionVector,
          numCandidates: 100,
          limit: 5 // Top 5 sabse milte-julte chunks nikalna
        }
      }
    ]);

    return results;
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
};

module.exports = { findRelevantContext };