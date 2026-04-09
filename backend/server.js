require('dotenv').config();
require('./scheduler/reminder'); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- 1. MIDDLEWARES ---
app.use(cors());

// Modern Express Body Parsers (Increased limit for PDF/Large Data processing)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔍 REQUEST LOGGER
app.use((req, res, next) => {
    console.log(`📩 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// --- 2. STATIC FILES ACCESS ---
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- 4. ROUTES REGISTRATION ---
// Note: Profile update logic routes/auth.js ke andar jayega
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/upload', require('./routes/upload')); 
app.use('/api/chat', require('./routes/chat'));
app.use('/api/practice', require('./routes/practice'));
app.use('/api/planner', require('./routes/planner')); 
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/mastery', require('./routes/mastery')); 

// --- 5. SYSTEM ROUTES ---
app.get("/", (req, res) => {
    res.send("StudyBuddy Core Active 😎 | Backend is Running");
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', 
        timestamp: new Date() 
    });
});

// --- 6. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("🔥 SERVER ERROR:", err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
    });
});

// --- 7. SERVER START ---
const PORT = process.env.PORT || 3000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------------`);
    console.log(`StudyBuddy Server is LIVE on Port ${PORT}!`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Use NGROK for Mobile Testing (Prefix URLs with /api)`);
    console.log(`-----------------------------------------------`);
});