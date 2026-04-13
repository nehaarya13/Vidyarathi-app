const mongoose = require('mongoose');

const StudyMaterialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true }, 
  
  // 🔥 Isko required: false kar do taaki validation fail na ho
  fileId: { type: String, required: false }, 

  chunks: [{
    text: String,        
    embedding: [Number], 
    pageNumber: Number,
    heading: { type: String, default: "General" }, 
    chunkType: { type: String, default: "content" } 
  }],

  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema);