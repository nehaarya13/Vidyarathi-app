const mongoose = require("mongoose");

// 1️⃣ Individual Topic Schema
const topicSchema = new mongoose.Schema({
  topicKey: { type: String, required: true },
  name: { type: String, required: true },
  pageNumbers: [Number],

  // AI & Progress Tracking
  masteryLevel: { type: Number, default: 0 },
  lastScore: { type: Number, default: 0 }, // 👈 Added for API consistency
  status: { 
    type: String, 
    enum: ["Red", "Yellow", "Green"], 
    default: "Red" 
  },

  // Engagement Stats
  attempts: { type: Number, default: 0 },
  lastEvaluated: { type: Date, default: Date.now },

  // Spaced Repetition Logic (Planner Engine)
  nextReviewDate: { type: Date, default: Date.now },
  stabilityScore: { type: Number, default: 1 },

  // Historical Session Data
  practiceHistory: [{
    question: { type: String },
    score: { type: Number },
    feedback: { type: String },
    remedialHint: { type: String },
    attemptedAt: { type: Date, default: Date.now }
  }]
});

// 2️⃣ Main Mastery Graph Schema
const masteryGraphSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  // ✅ String key supports filenames (jesc101) and ObjectIds (696cb...)
  materialKey: { 
    type: String, 
    required: true,
    index: true
  },

  topics: [topicSchema],

  overallProgress: { type: Number, default: 0 },
  lastAccessedTopic: { type: String, default: "" }, // 👈 Helpful for Dashboard UI
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// 🚀 PERFORMANCE: Compound index for fast dashboard/planner queries
// Isse multiple materials hone par bhi query fast rahegi
masteryGraphSchema.index({ userId: 1, materialKey: 1 });

module.exports = mongoose.model("MasteryGraph", masteryGraphSchema);