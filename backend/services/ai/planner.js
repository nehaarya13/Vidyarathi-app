const MasteryGraph = require("../../models/MasteryGraph");
const Planner = require("../../models/Planner");

/**
 * 🧠 AI Service: Generates initial study roadmap after PDF processing
 */
const generateInitialStudyPath = async (userId, materialId, extractedTopics) => {
    try {
        if (!extractedTopics || extractedTopics.length === 0) {
            console.log("⚠️ No topics provided to generate study path.");
            return { success: false, message: "No topics found" };
        }

        // 1. Prepare topics for the Mastery Graph (Initial status 'Red')
        const topics = extractedTopics.map(topic => ({
            topicKey: topic.id || topic.name.toLowerCase().replace(/\s+/g, '_'),
            name: topic.name,
            status: "Red",
            masteryLevel: 0,
            attempts: 0
        }));

        // 2. Create and Save the Mastery Graph for this PDF
        const newGraph = new MasteryGraph({
            userId,
            materialId,
            topics,
            overallProgress: 0,
            lastAccessedTopic: extractedTopics[0].name
        });
        await newGraph.save();

        // 3. Create a "First Milestone" task in the Planner for the User
        const firstGoal = new Planner({
            userId,
            taskName: `Master: ${extractedTopics[0].name}`,
            linkedMaterialId: materialId,
            source: 'AI',
            priority: 'Medium'
        });
        await firstGoal.save();

        console.log(`✅ AI Study Path generated for Material: ${materialId}`);
        return { success: true, graphId: newGraph._id };

    } catch (error) {
        console.error("❌ AI Planner Service Error:", error.message);
        throw error;
    }
};

module.exports = { generateInitialStudyPath };