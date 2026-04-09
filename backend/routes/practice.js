const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const MasteryGraph = require("../models/MasteryGraph");
const Chunk = require("../models/Chunk"); 
const { evaluateProgress } = require("../services/ai/evaluator");
const { generatePracticeSet } = require("../services/ai/practiceService");

// 🛠 Helper: Spaced Repetition Logic
const calculateNextReview = (score, currentStability = 1) => {
    let newStability;
    if (score >= 80) newStability = currentStability * 2;
    else if (score >= 45) newStability = currentStability * 1.5;
    else newStability = 1;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Math.ceil(newStability));
    return { nextDate, newStability };
};

// 🎯 1. Session Generation
router.post("/generate-session", async (req, res) => {
  try {
    const { userId, materialId, pattern } = req.body; 
    if (!materialId || !pattern) {
      return res.status(400).json({ success: false, error: "materialId and pattern are required" });
    }
    const questions = await generatePracticeSet(materialId, pattern);
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error("❌ Session Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to generate session" });
  }
});

// 🎯 2. Combined Submit & Mastery Sync 🚀
router.post("/submit", async (req, res) => {
  try {
    const { 
      userId, materialId, topicKey, studentAnswer, 
      question, options, correctAnswer 
    } = req.body;

    // 🔥 FIX: Guest User Check (Check if userId is a valid MongoDB ObjectId)
    const isGuest = !userId || userId === "guest_user" || !mongoose.Types.ObjectId.isValid(userId);

    console.log(`📝 Processing: User=${userId}, Material=${materialId}, Mode=${isGuest ? 'Guest' : 'Member'}`);

    // --- 🎯 MCQ Answer Extraction ---
    let finalAnswerToEvaluate = studentAnswer;
    if (options && Array.isArray(options) && studentAnswer !== "" && !isNaN(studentAnswer)) {
      finalAnswerToEvaluate = options[parseInt(studentAnswer)] || studentAnswer;
    }

    // --- 🎯 AI Context Prep (RAG logic) ---
    let queryId = mongoose.Types.ObjectId.isValid(materialId) ? new mongoose.Types.ObjectId(materialId) : materialId;
    const relevantChunks = await Chunk.find({ materialId: queryId }).limit(3);
    const referenceContext = relevantChunks.map(c => c.text).join("\n");

    // --- 🎯 AI EVALUATION (Groq Calling) ---
    const aiReview = await evaluateProgress({
      question,
      studentAnswer: String(finalAnswerToEvaluate || "No answer"),
      topicKeys: topicKey ? [topicKey] : ["General"],
      referenceContext: referenceContext || "General context"
    });

    let finalScore = aiReview.score;

    // --- 🎯 Strict MCQ Score Overwrite ---
    if (correctAnswer && finalAnswerToEvaluate) {
        const studentClean = String(finalAnswerToEvaluate).trim().toLowerCase();
        let correctClean = String(correctAnswer).trim().toLowerCase();
        
        const letterIndex = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
        if (letterIndex[correctClean] !== undefined && options) {
            correctClean = String(options[letterIndex[correctClean]]).trim().toLowerCase();
        }

        if (studentClean === correctClean) finalScore = 100;
        else if (options && options.length > 0) finalScore = 0; 
    }

    // --- 🎯 Mastery Graph Sync (Skipped for Guest) ---
    let overallProgress = 0;

    if (!isGuest) {
        // A. MaterialKey se search karo
        let graph = await MasteryGraph.findOne({ userId, materialKey: materialId });

        // B. Agar Graph nahi hai toh Naya banao
        if (!graph) {
            console.log("Creating NEW MasteryGraph for user:", userId);
            graph = new MasteryGraph({
                userId,
                materialKey: materialId,
                topics: [],
                overallProgress: 0
            });
        }

        // C. Find or Create Topic
        let topic = graph.topics.find(t => 
            t.topicKey === topicKey || 
            t.name.toLowerCase() === String(topicKey || "").toLowerCase()
        );

        if (!topic) {
            graph.topics.push({
                topicKey: topicKey || "General",
                name: topicKey || "General",
                masteryLevel: finalScore,
                status: finalScore >= 75 ? "Green" : finalScore >= 40 ? "Yellow" : "Red",
                attempts: 1,
                practiceHistory: []
            });
            topic = graph.topics[graph.topics.length - 1];
        } else {
            topic.masteryLevel = finalScore; 
            topic.status = finalScore >= 75 ? "Green" : finalScore >= 40 ? "Yellow" : "Red";
            topic.attempts += 1;
        }

        // D. Spaced Repetition Updates
        const { nextDate, newStability } = calculateNextReview(finalScore, topic.stabilityScore || 1);
        topic.nextReviewDate = nextDate;
        topic.stabilityScore = newStability;
        topic.lastEvaluated = new Date();

        // E. Add to Practice History
        topic.practiceHistory.push({
            question,
            score: finalScore,
            feedback: aiReview.feedback,
            remedialHint: aiReview.remedial_hint,
            attemptedAt: new Date()
        });

        // F. Calculate Overall Average
        if (graph.topics.length > 0) {
            const totalMastery = graph.topics.reduce((sum, t) => sum + (t.masteryLevel || 0), 0);
            graph.overallProgress = Math.round(totalMastery / graph.topics.length);
        }
        
        graph.lastUpdated = new Date();
        await graph.save();
        overallProgress = graph.overallProgress;

    } else {
        console.log("⚠️ Guest Mode: Evaluation sent but NOT saved to DB.");
    }

    // --- 💾 Final Response ---
    res.json({
      success: true,
      accuracy: finalScore,
      feedback: finalScore === 100 ? "Excellent! That's correct." : aiReview.feedback,
      remedial: aiReview.remedial_hint,
      overallProgress
    });

  } catch (error) {
    console.error("❌ Submit Error:", error.message);
    res.status(500).json({ success: false, error: "Evaluation failed" });
  }
});

module.exports = router;