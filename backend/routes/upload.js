const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");

// Models
const StudyMaterial = require("../models/StudyMaterial");
const Chunk = require("../models/Chunk");
const MasteryGraph = require("../models/MasteryGraph"); // 👈 Added for Planner Integration

// Services
const { generateEmbedding } = require("../services/ai/embedding");
const { extractTextWithPages } = require("../utils/textUtils"); 
const { generateInitialGraph } = require("../services/ai/planner");

// Multer Setup - (Purana Logic Same Hai)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'data/uploads/'; 
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); 
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

/**
 * @route   GET /api/upload/user-materials/:userId
 */
router.get('/user-materials/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const materials = await StudyMaterial.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(materials);
  } catch (err) {
    console.error("❌ Library Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch materials." });
  }
});

/**
 * @route   POST /api/upload/
 */
router.post("/", upload.single("file"), async (req, res) => {
  console.log("📩 --- UPLOAD & ANALYSIS STARTING ---");
  
  try {
    const { userId } = req.body;
    if (!req.file) return res.status(400).json({ error: "File upload failed." });
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid or missing User ID");
    }

    const localPath = req.file.path; 

    // 1. Create Initial Entry (Purana Logic)
    const material = new StudyMaterial({
      userId: new mongoose.Types.ObjectId(userId),
      fileName: req.file.originalname,
      fileUrl: localPath, 
      fileId: req.file.filename, 
      status: "processing",
      masteryScore: 0 
    });
    await material.save();

    console.log(`✅ Material Created: ${material._id}`);

    // 2. Extract Text (Purana Logic)
    const pages = await extractTextWithPages(localPath);
    if (!pages || pages.length === 0) throw new Error("PDF extraction failed.");

    // 3. Chunking (Purana Logic)
    let segmentsToProcess = [];
    for (const pageItem of pages) {
      if (!pageItem.text || pageItem.text.trim().length < 10) continue;
      const cleanText = pageItem.text.replace(/\s+/g, ' ').trim();
      const textSegments = cleanText.match(/.{1,1000}/g) || [cleanText];
      textSegments.forEach(seg => {
        segmentsToProcess.push({ text: seg, page: pageItem.page });
      });
    }

    // 4. Vector Embeddings (Purana Logic)
    const chunkPromises = segmentsToProcess.map(async (seg) => {
      try {
        const vector = await generateEmbedding(seg.text);
        if (vector) {
          return {
            materialId: material._id,
            userId: new mongoose.Types.ObjectId(userId),
            text: seg.text,
            embedding: vector,
            pageNumber: seg.page || 1,
            sourceFile: req.file.originalname
          };
        }
      } catch (err) { return null; }
    });

    const chunksToInsert = (await Promise.all(chunkPromises)).filter(c => c !== null);

    // 5. Save Chunks (Purana Logic)
    if (chunksToInsert.length > 0) {
        await Chunk.insertMany(chunksToInsert);
    }

    // 6. Mastery Graph & Planner Integration 🚀 (UPDATED FEATURE)
    try {
        const fullContent = pages.map(p => p.text).join("\n").slice(0, 5000); 
        
        // Isse topics extract honge aur MasteryGraph mein "Red" (Pending) status mein save honge
        // Taaki Planner screen ko naye tasks dikhen
        await generateInitialGraph(userId, material._id, fullContent);
        
        console.log(`📡 Planner Notified: New topics added for ${material.fileName}`);
    } catch (graphErr) {
        console.log("⚠️ Graph Error:", graphErr.message);
    }

    // 7. Complete (Purana Logic)
    material.status = "completed";
    await material.save();

    res.status(200).json({ success: true, materialId: material._id });

  } catch (error) {
    console.error("❌ Upload Fail:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;