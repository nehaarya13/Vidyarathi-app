const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema({
  materialId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "StudyMaterial", 
    required: true,
    index: true // 👈 Search fast karne ke liye
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: false // Optional if you only track by materialId
  },
  text: { 
    type: String, 
    required: true 
  },
  embedding: { 
    type: [Number], 
    required: true 
  },
  pageNumber: {
    type: Number
  },
  heading: {
    type: String // e.g. "Importance of pH in Everyday Life"
  },
  subHeading: {
    type: String
  },
  chunkType: {
    type: String,
    enum: ["definition", "explanation", "example", "exercise", "summary", "content"],
    default: "content"
  },
  sourceFile: {
    type: String // PDF name for reference
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Purana model delete karke naya export karne ke liye
module.exports = mongoose.models.Chunk || mongoose.model("Chunk", ChunkSchema);