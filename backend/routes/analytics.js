const express = require("express");
const router = express.Router();
const MasteryGraph = require("../models/MasteryGraph");
const User = require("../models/User");
const mongoose = require("mongoose");

router.get("/user-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Convert string to ObjectId if needed safely
    const objectId = mongoose.Types.ObjectId.isValid(userId) 
                     ? new mongoose.Types.ObjectId(userId) 
                     : userId;

    // 2. Fetch User
    const user = await User.findById(objectId);
    
    // 3. Fetch all Graphs for this user
    const graphs = await MasteryGraph.find({ userId: userId }); // String aur ID dono try karega Mongo

    // --- AGAR USER NAHI MILA ---
    if (!user) {
      console.log("❌ User not found in DB for ID:", userId);
      return res.status(404).json({ 
        success: false, 
        error: "User not found. Please check if the ID exists in Users collection." 
      });
    }

    // --- AGAR USER MIL GAYA PAR PADHAI NAHI KI ---
    if (!graphs || graphs.length === 0) {
      return res.json({
        success: true,
        message: "User found, but no study data yet.",
        globalStats: { overallMastery: 0, totalTopics: 0, level: user.level },
        streak: { current: user.currentStreak || 0 },
        recentActivity: []
      });
    }

    // --- 🟢 AGAR SAB KUCH HAI TOH CALCULATE KARO ---
    let totalTopics = 0;
    let totalMastery = 0;
    let counts = { Green: 0, Yellow: 0, Red: 0 };
    let recentActivity = [];

    graphs.forEach(graph => {
      graph.topics.forEach(topic => {
        totalTopics++;
        totalMastery += topic.masteryLevel;
        
        const status = topic.status ? topic.status.charAt(0).toUpperCase() + topic.status.slice(1).toLowerCase() : "Red";
        if (counts[status] !== undefined) counts[status]++;

        if (topic.practiceHistory) {
          topic.practiceHistory.forEach(h => {
            recentActivity.push({
              topic: topic.name,
              score: h.score,
              date: h.attemptedAt
            });
          });
        }
      });
    });

    const avgMastery = totalTopics > 0 ? Math.round(totalMastery / totalTopics) : 0;

    res.json({
      success: true,
      globalStats: {
        overallMastery: avgMastery,
        level: user.level,
        totalTopicsStudied: totalTopics
      },
      distribution: counts,
      streak: user.currentStreak || 0,
      recentActivity: recentActivity.sort((a,b) => b.date - a.date).slice(0, 5)
    });

  } catch (error) {
    console.error("Analytics Route Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;