// routes/chat.js
const express = require('express');
const router = express.Router();
const generateLLMResponse = require('../services/llmAdapter');

// POST /chat
router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Call the AI backend
    const answer = await generateLLMResponse(prompt);

    res.json({ answer });

  } catch (err) {
    console.error("Chat Route Error:", err);
    res.status(500).json({ error: "Server error occurred" });
  }
});

module.exports = router;
