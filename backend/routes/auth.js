const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MasteryGraph = require("../models/MasteryGraph");
const { sendOTPEmail } = require('../services/ai/emailService');

// 🔍 Debugging Middleware
router.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] Auth Route Hit: ${req.method} ${req.url}`);
  next();
});

// --- 🛠️ 1. UPDATE PROFILE (For Profile Screen Sync) ---
router.post('/update-profile', async (req, res) => {
  try {
    const { userId, level, studyTime, language, name } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // Update User Fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        level: level, 
        studyTime: studyTime, 
        language: language,
        name: name 
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ 
      success: true, 
      message: "Profile updated successfully! ✨",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        level: updatedUser.level,
        studyTime: updatedUser.studyTime,
        language: updatedUser.language
      }
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({ error: "Failed to update profile settings" });
  }
});

// --- 📥 2. GET PROFILE (To Load User Data) ---
router.get('/get-profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching profile" });
  }
});

// --- 🚀 3. COMPLETE ONBOARDING ---
router.post('/complete-onboarding', async (req, res) => {
  try {
    const { userId, userType, contextDetails } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        onboarded: true, 
        userType: userType || 'other', 
        contextDetails: contextDetails || '' 
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    // Update activity in MasteryGraph
    await MasteryGraph.findOneAndUpdate(
      { userId: userId },
      { $push: { activities: { description: "Onboarding completed! Profile set up. 🎯", timestamp: new Date() } } }
    );

    res.json({ 
      success: true, 
      message: "Onboarding completed!", 
      user: {
        id: user._id,
        onboarded: user.onboarded,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error("❌ Onboarding Error:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// --- 📝 4. SIGNUP ---
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Please enter all fields' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType: 'other', 
      onboarded: false,
      currentStreak: 1,
      lastActive: new Date(),
      level: 'School', // Default levels
      studyTime: 'Morning',
      language: 'English'
    });

    const savedUser = await newUser.save();

    await MasteryGraph.create({
      userId: savedUser._id,
      materialId: "jesc101", 
      topics: [],
      overallProgress: 0,
      activities: [{ description: "Account created! Welcome 🚀", timestamp: new Date() }]
    });

    res.status(201).json({ success: true, message: 'User created successfully! 🎉' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup', details: error.message });
  }
});

// --- 🔑 5. LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Streak Logic
    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = user.lastActive ? user.lastActive.toISOString().split('T')[0] : null;

    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      user.currentStreak = (lastActiveDate === yesterdayStr) ? user.currentStreak + 1 : 1;
      user.lastActive = new Date();
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.currentStreak,
        onboarded: user.onboarded,
        userType: user.userType || 'other',
        level: user.level,
        studyTime: user.studyTime,
        language: user.language
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- 📩 6. FORGOT PASSWORD ---
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 600000; 
    await user.save();

    await sendOTPEmail(user.email, otp);
    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

// --- 📍 7. VERIFY OTP ---
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired code" });
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// --- 🔒 8. RESET PASSWORD ---
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: "Session expired" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Could not reset password" });
  }
});

module.exports = router;