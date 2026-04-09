const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- 1. Basic Auth Info ---
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // Forgot Password Fields
  resetPasswordOTP: String,
  resetPasswordExpires: Date,

  // --- 2. Phase 1: Onboarding & Profile Sync ---
  onboarded: { 
    type: Boolean, 
    default: false 
  },
  
  user_type: { 
    type: String, 
    enum: ['school', 'college', 'competitive', 'other', ''], 
    default: '' 
  },
  
  class_exam: { 
    type: String, 
    default: '' 
  }, 

  // 🔥 Profile Screen Preferences (Updated for Sync)
  level: { 
    type: String, 
    enum: ['School', 'College', 'Professional', 'beginner', 'intermediate', 'advanced'], 
    default: 'School' 
  },

  language: {
    type: String,
    enum: ['English', 'Hindi', 'Hinglish'],
    default: 'English'
  },

  studyTime: {
    type: String,
    default: 'Morning' // Stores values like 'Morning', 'Evening', etc.
  },
  
  profile_pic: { 
    type: String, 
    default: '' 
  }, 

  // --- 3. Phase 7: Analytics & Streak Tracking ---
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  currentStreak: { 
    type: Number, 
    default: 0 
  },
  longestStreak: { 
    type: Number, 
    default: 0 
  },
  total_mastery_score: { 
    type: Number, 
    default: 0 
  },

  // --- 4. System Info ---
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);