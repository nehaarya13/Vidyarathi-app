'use strict';

// 1. ENVIRONMENT CONFIG
require('dotenv').config();
require('./scheduler/reminder'); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // Security enhancement
const morgan = require('morgan'); // Standardized logging

// 2. INITIALIZE APP
const app = express();
const PORT = process.env.PORT || 3000;

// 3. SECURITY & MIDDLEWARE
app.use(helmet({ crossOriginResourcePolicy: false })); // Protects headers
app.use(cors());
app.use(morgan('dev')); // Clean logging format

// Optimized Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets correctly
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. DATABASE INITIALIZATION
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ Database Connection Error: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

// 5. API ROUTES MAPPER
const API_PREFIX = '/api';
const routes = {
    auth: require('./routes/auth'),
    upload: require('./routes/upload'),
    chat: require('./routes/chat'),
    practice: require('./routes/practice'),
    planner: require('./routes/planner'),
    analytics: require('./routes/analytics'),
    mastery: require('./routes/mastery')
};

// Auto-register routes
Object.entries(routes).forEach(([path, route]) => {
    app.use(`${API_PREFIX}/${path}`, route);
});

// 6. SYSTEM HEALTH & BASE ROUTES
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        db_state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', 
        uptime: process.uptime().toFixed(2) + 's'
    });
});

app.get("/", (req, res) => {
    res.status(200).send("StudyBuddy API v1.0.0 | Operational");
});

// 7. ERROR HANDLING
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Global Error Interceptor
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(` [Error]: ${err.message}`);
    
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// 8. STARTUP SEQUENCE
const startServer = async () => {
    await connectDB();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n===============================================`);
        console.log(`StudyBuddy Core Engine LIVE on Port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`===============================================\n`);
    });

    // Graceful Shutdown - Production mein kaam aata hai
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => mongoose.connection.close(false, () => process.exit(0)));
    });
};

startServer();