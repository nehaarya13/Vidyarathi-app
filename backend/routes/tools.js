// routes/tools.js
const express = require("express");
const router = express.Router();
const generateLLMResponse = require("../services/llmAdapter");

// POST /tools
router.post("/", async (req, res) => {
  try {
    const { type, text } = req.body;

    if (!type || !text) {
      return res.status(400).json({
        error: "type and text are required"
      });
    }

    let prompt = "";

    // 🔹 Decide prompt based on tool type
    switch (type) {
      case "summary":
        prompt = `Summarize the following text in simple words for a college student:\n\n${text}`;
        break;

      case "explain":
        prompt = `Explain the following topic in an easy, friendly way with examples:\n\n${text}`;
        break;

      case "mcq":
        prompt = `Create 5 multiple choice questions (MCQs) with answers from the following content:\n\n${text}`;
        break;

      case "study_plan":
        prompt = `Create a simple study plan based on the following topic for a student:\n\n${text}`;
        break;

      case "emotional_support":
        prompt = `Talk to the student in a supportive and motivating way based on this situation:\n\n${text}`;
        break;

      default:
        return res.status(400).json({
          error: "Invalid tool type"
        });
    }

    // 🔹 Call AI
    const result = await generateLLMResponse(prompt);

    res.json({ result });

  } catch (error) {
    console.error("Tools Route Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
