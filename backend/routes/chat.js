const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MasteryGraph = require("../models/MasteryGraph");
const Chunk = require("../models/Chunk");
const { getSmartAnswer } = require("../services/ai/ragService");
const { evaluateProgress } = require("../services/ai/evaluator");
const generateLLMResponse = require('../services/llmAdapter');

/**
 * 1️⃣ SMART CHAT ROUTE (PDF + General AI)
 */
router.post('/ask', async (req, res) => {
  try {
    const { userId, question, materialId } = req.body;

    // --- DEBUGGING LOGS ---
    console.log(`-----------------------------------------------`);
    console.log(`📩 NEW CHAT REQUEST`);
    console.log(`❓ Question: "${question}"`);
    console.log(`🆔 MaterialID Received: ${materialId}`);
    console.log(`-----------------------------------------------`);

    if (!userId || !question) {
      return res.status(400).json({ error: "User ID aur Question zaroori hain!" });
    }

    // User profile fetch karna personalization ke liye
    const user = await User.findById(userId);
    const userProfile = {
      userType: user?.userType || "Student",
      contextDetails: user?.contextDetails || "General Studies"
    };

    let result = null;

    // 🔥 SMART CHECK: Kya humein PDF se answer dhoondna chahiye?
    const isValidMaterial = materialId && 
                            materialId !== "null" && 
                            materialId !== "undefined" && 
                            materialId !== "jesc101" && 
                            materialId.length > 10; // Real MongoDB ID check

    if (isValidMaterial) {
      try {
        console.log("🔍 [RAG MODE]: Searching PDF context in Database...");
        const ragResponse = await getSmartAnswer(question, materialId, userProfile);
        
        // Agar PDF mein se kuch kaam ka mila
        if (ragResponse && (ragResponse.answer || ragResponse.text)) {
          console.log("✅ [SUCCESS]: Found relevant info in PDF.");
          result = {
            answer: typeof ragResponse === 'string' ? ragResponse : (ragResponse.answer || ragResponse.text),
            sources: ragResponse.sources || [],
            sourceType: 'pdf' // Frontend par "Source: PDF" dikhane ke liye
          };
        } else {
          console.log("⚠️ [RAG]: PDF mein is sawal ka jawab nahi mila.");
        }
      } catch (err) {
        console.error("❌ [RAG ERROR]:", err.message);
      }
    } else {
      console.log("ℹ️ [GENERAL MODE]: No valid PDF ID provided, using General AI.");
    }

    // 🌐 FALLBACK: Agar PDF se jawab nahi mila, toh General AI use karo
    if (!result) {
      console.log("🌐 [GENERAL AI]: Serving response from LLM Knowledge Base...");
      const generalAnswer = await generateLLMResponse(question, userProfile);
      result = {
        answer: generalAnswer,
        sources: [],
        sourceType: 'internet' // Frontend par "Source: Web" dikhane ke liye
      };
    }

    res.json(result);

  } catch (error) {
    console.error("🔥 [GLOBAL CHAT ERROR]:", error.message);
    res.status(500).json({ error: "AI processing failed. Please try again." });
  }
});

/**
 * 2️⃣ PROGRESS EVALUATION ROUTE (Submit Answer)
 */
router.post('/submit-answer', async (req, res) => {
  try {
    const { question, studentAnswer, materialId, userId } = req.body;
    
    console.log(`📊 Evaluating Answer for User: ${userId}`);

    const user = await User.findById(userId);
    const graph = await MasteryGraph.findOne({ userId, materialId });

    if (!graph) {
      return res.status(404).json({ error: "Is material ka Progress Graph nahi mila." });
    }

    // PDF context nikalna evaluation ke liye
    const relatedChunks = await Chunk.find({ materialId }).limit(3); 
    const referenceContext = relatedChunks.map(c => c.text).join("\n");

    const evalResult = await evaluateProgress({
      question,
      studentAnswer,
      topicKeys: graph.topics.map(t => t.topicKey),
      referenceContext,
      userProfile: { userType: user?.userType, contextDetails: user?.contextDetails }
    });

    // Graph update logic
    const topic = graph.topics.find(t => t.topicKey.toLowerCase() === evalResult.topicKey.toLowerCase());
    if (topic) {
      topic.attempts += 1;
      const score = Number(evalResult.score) || 0;
      if (score > topic.masteryLevel) topic.masteryLevel = score;
      
      // Color coding update
      if (topic.masteryLevel >= 70) topic.status = "green";
      else if (topic.masteryLevel >= 40) topic.status = "yellow";
      else topic.status = "red";

      // Overall Progress calculate karna
      const totalMastery = graph.topics.reduce((s, t) => s + (Number(t.masteryLevel) || 0), 0);
      graph.overallProgress = Math.round(totalMastery / graph.topics.length);
      await graph.save();
    }

    res.json({ 
      feedback: evalResult.feedback, 
      newMastery: topic?.masteryLevel, 
      overallProgress: graph.overallProgress 
    });

  } catch (error) {
    console.error("❌ [EVALUATION ERROR]:", error.message);
    res.status(500).json({ error: "Evaluation failed." });
  }
});

module.exports = router;