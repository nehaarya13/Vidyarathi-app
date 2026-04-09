const express = require('express');
const router = express.Router();
const Planner = require('../models/Planner'); 
const MasteryGraph = require('../models/MasteryGraph');
const StudyMaterial = require('../models/StudyMaterial');
const mongoose = require('mongoose');

/**
 * 🎯 GET: Fetch Full Plan (Manual + AI Suggestions)
 * Fixed for materialKey and Guest User support.
 */
router.get('/get-full-plan/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date();

        // 1. Guest User Bypass (Crash Protection)
        let queryUserId = userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            // Agar guest hai toh ek constant ID use karein taaki query crash na ho
            queryUserId = "658c1a1a1a1a1a1a1a1a1a1a"; 
        }

        // 2. Fetch Manual Tasks from Database
        const manualTasks = await Planner.find({ userId: queryUserId })
            .sort({ isCompleted: 1, createdAt: -1 })
            .lean() || [];

        // 3. Fetch Mastery Context (Using materialKey support)
        // Hum userId se saare graphs nikalenge
        const userGraphs = await MasteryGraph.find({ userId: queryUserId }).lean() || [];
        
        // Material Names nikalne ke liye keys ka array banayein
        const materialKeys = userGraphs.map(g => g.materialKey).filter(Boolean);

        // Dono tarike se search karein: ObjectId aur FileName (materialKey)
        const materials = await StudyMaterial.find({
            $or: [
                { _id: { $in: materialKeys.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                { fileName: { $in: materialKeys } }
            ]
        }).select('fileName').lean();

        // Map banayein: Key -> FileName
        const materialMap = {};
        materials.forEach(m => { 
            materialMap[m._id.toString()] = m.fileName; 
            materialMap[m.fileName] = m.fileName; // String key mapping
        });

        let aiSuggestedTasks = [];

        // 4. Generate AI Tasks from Mastery Graph
        userGraphs.forEach(graph => {
            if (graph.topics && graph.topics.length > 0) {
                const mKey = graph.materialKey;
                const displayName = materialMap[mKey] || mKey || "Study Material";

                // PITCH LOGIC: Weak topics (Score < 80) automatically planner mein aayenge
                const pendingTopics = graph.topics.filter(t => {
                    const isWeak = (t.masteryLevel || 0) < 80; 
                    const isDue = t.nextReviewDate && new Date(t.nextReviewDate) <= today;
                    return isWeak || isDue;
                });

                // Top 3 priority topics per material
                pendingTopics.slice(0, 3).forEach(topic => {
                    aiSuggestedTasks.push({
                        _id: `ai_gen_${topic._id || Math.random().toString(36).substr(2, 9)}`, 
                        taskName: (topic.masteryLevel < 50) ? `Master: ${topic.name}` : `Revise: ${topic.name}`,
                        source: 'AI',
                        linkedMaterialId: mKey,
                        fileName: displayName,
                        isCompleted: false,
                        // Priority Visuals
                        priority: (topic.masteryLevel < 40) ? 'High' : (topic.masteryLevel < 75) ? 'Medium' : 'Low',
                        createdAt: new Date()
                    });
                });
            }
        });

        // 5. Combine and Sort
        // Strategy: AI Suggestions sabse upar dikheingi presentation ke liye
        const combinedPlan = [...aiSuggestedTasks, ...manualTasks];
        
        combinedPlan.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            
            // AI tasks ko visibility priority (Demo ke liye best)
            if (a.source === 'AI' && b.source !== 'AI') return -1;
            if (a.source !== 'AI' && b.source === 'AI') return 1;
            
            const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
        });

        res.status(200).json({ 
            success: true, 
            plan: combinedPlan,
            summary: {
                total: combinedPlan.length,
                aiGenerated: aiSuggestedTasks.length,
                manual: manualTasks.length
            }
        });

    } catch (err) {
        console.error("❌ Planner Route Error:", err.message);
        res.status(200).json({ success: false, plan: [], error: "AI is analyzing your progress..." });
    }
});

/**
 * ➕ POST: Add Manual Task
 */
router.post('/add-task', async (req, res) => {
    try {
        const { userId, taskName, linkedMaterialId, priority } = req.body;
        if (!userId || !taskName) return res.status(400).json({ success: false, error: "Missing fields" });

        const newTask = new Planner({
            userId,
            taskName,
            linkedMaterialId: linkedMaterialId || null,
            source: 'Manual',
            priority: priority || 'Medium',
            isCompleted: false
        });

        await newTask.save();
        res.status(201).json({ success: true, task: newTask });
    } catch (err) {
        console.error("❌ Add Task Error:", err.message);
        res.status(500).json({ success: false, error: "Failed to save task" });
    }
});

/**
 * ✅ PATCH: Toggle Task Status
 */
router.patch('/toggle-task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // AI tasks toggling logic
        if (taskId.startsWith('ai_gen')) {
            return res.json({ 
                success: true, 
                message: "Practice this topic to complete this AI task!" 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ success: false, error: "Invalid ID" });
        }

        const task = await Planner.findById(taskId);
        if (!task) return res.status(404).json({ success: false, error: "Not found" });

        task.isCompleted = !task.isCompleted;
        await task.save();
        res.json({ success: true, isCompleted: task.isCompleted });
    } catch (err) {
        res.status(500).json({ success: false, error: "Update failed" });
    }
});

module.exports = router;