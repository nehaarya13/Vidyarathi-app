const mongoose = require('mongoose');

const PlannerSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    taskName: { 
        type: String, 
        required: true 
    },
    source: { 
        type: String, 
        enum: ['AI', 'Manual'], 
        default: 'Manual' 
    },
    linkedMaterialId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'StudyMaterial', 
        default: null 
    },
    isCompleted: { 
        type: Boolean, 
        default: false 
    },
    dueDate: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model('Planner', PlannerSchema);