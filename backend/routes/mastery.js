const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MasteryGraph = require("../models/MasteryGraph");
const StudyMaterial = require("../models/StudyMaterial");

// --------------------------------------------------------
// 🧠 1. GET: AI Historical Insights (Dashboard Summary)
// --------------------------------------------------------
router.get('/get-insights/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const allGraphs = await MasteryGraph.find({ userId }).lean();

        if (!allGraphs || allGraphs.length === 0) {
            return res.json({ 
                success: true, 
                aiMessage: "Ready to build your knowledge? Practice a topic to see AI insights! ✨",
                stats: { avgMastery: 0, totalSessions: 0 }
            });
        }

        let totalSessions = allGraphs.length;
        let cumulativeScore = allGraphs.reduce((sum, g) => sum + (g.overallProgress || 0), 0);
        const avgMastery = Math.round(cumulativeScore / totalSessions);
        
        let aiMessage = totalSessions < 3 
            ? `Off to a great start! Your average mastery is ${avgMastery}% 🚀` 
            : `Steady progress! Across ${totalSessions} materials, you've hit ${avgMastery}%. 📈`;

        res.json({ success: true, aiMessage, stats: { avgMastery, totalSessions } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --------------------------------------------------------
// 🎯 2. GET: Fetch Mastery Data (For Bubbles & Planner)
// --------------------------------------------------------
router.get('/:userId/:materialId', async (req, res) => {
    const { userId, materialId } = req.params;
    try {
        // Find by materialKey (Supports both ObjectId and Filename like "jesc101")
        let graph = await MasteryGraph.findOne({ userId, materialKey: materialId }).lean();
        
        // Migration Support: Agar graph nahi mila par purana material score hai
        if (!graph && mongoose.Types.ObjectId.isValid(materialId)) {
            const material = await StudyMaterial.findById(materialId);
            if (material && material.masteryScore > 0) {
                return res.status(200).json({
                    success: true,
                    overallProgress: material.masteryScore,
                    topics: [{
                        topicKey: "legacy-session",
                        name: "Previous Practice",
                        status: material.masteryScore < 50 ? 'Red' : (material.masteryScore < 80 ? 'Yellow' : 'Green'),
                        lastScore: material.masteryScore,
                        masteryLevel: material.masteryScore
                    }]
                });
            }
        }

        res.status(200).json({
            success: true,
            overallProgress: graph?.overallProgress || 0,
            lastAccessedTopic: graph?.lastAccessedTopic || "",
            topics: graph?.topics || []
        });

    } catch (error) {
        console.error("❌ Fetch Mastery Error:", error.message);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// --------------------------------------------------------
// 🚀 3. POST: Update Score (Sync with History Logging)
// --------------------------------------------------------
router.post('/update-score', async (req, res) => {
    const { userId, materialId, score, topicKey, topicName, question, feedback } = req.body;
    
    try {
        if (!userId || !materialId) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        // 1. Find or Create Graph
        let graph = await MasteryGraph.findOne({ userId, materialKey: materialId });
        
        if (!graph) {
            graph = new MasteryGraph({ 
                userId, 
                materialKey: materialId, 
                topics: [], 
                overallProgress: score 
            });
        }

        const finalTopicKey = topicKey || "general-session";
        const finalTopicName = topicName || "Study Session";
        const status = score < 50 ? 'Red' : (score < 80 ? 'Yellow' : 'Green');

        // 2. Find and Update Topic
        let topic = graph.topics.find(t => t.topicKey === finalTopicKey);
        
        if (topic) {
            topic.status = status;
            topic.masteryLevel = score; 
            topic.lastScore = score;
            topic.attempts = (topic.attempts || 0) + 1;
        } else {
            graph.topics.push({
                topicKey: finalTopicKey,
                name: finalTopicName,
                status: status,
                masteryLevel: score,
                lastScore: score,
                attempts: 1,
                practiceHistory: []
            });
            topic = graph.topics[graph.topics.length - 1];
        }

        // 3. 📝 Add to History (Consistent with /submit logic)
        if (!topic.practiceHistory) topic.practiceHistory = [];
        topic.practiceHistory.push({
            question: question || "Quick Practice Session",
            score: score,
            feedback: feedback || "Session completed successfully",
            attemptedAt: new Date()
        });

        // Limit history size to keep DB clean
        if (topic.practiceHistory.length > 15) topic.practiceHistory.shift();

        // 4. Update Stats
        graph.lastAccessedTopic = finalTopicName;
        graph.lastUpdated = new Date();

        // Recalculate Average Progress
        if (graph.topics.length > 0) {
            const total = graph.topics.reduce((s, t) => s + (t.masteryLevel || 0), 0);
            graph.overallProgress = Math.round(total / graph.topics.length);
        }

        await graph.save();
        
        res.status(200).json({ 
            success: true, 
            overallProgress: graph.overallProgress,
            message: "Mastery and History updated!"
        });

    } catch (err) {
        console.error("❌ Update Score Error:", err.message);
        res.status(500).json({ success: false, error: "Sync failed: " + err.message });
    }
});

module.exports = router;