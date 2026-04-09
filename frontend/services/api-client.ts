import axios from 'axios';
import { storage } from './storage'; 

/**
 * ⚠️ IMPORTANT: Ngrok URL har restart ke baad update karein
 */
const BASE_URL = 'https://convincedly-unlanterned-ember.ngrok-free.dev'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
  },
});

// 🔐 AUTH INTERCEPTOR
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const StudyBuddyAPI = {
  // --------------------------------------------------------
  // 1️⃣ AUTHENTICATION
  // --------------------------------------------------------
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data; 
  },

  completeOnboarding: async (onboardData) => {
    const response = await api.post('/api/auth/complete-onboarding', onboardData);
    return response.data;
  },

  // --------------------------------------------------------
  // 2️⃣ MASTERY & SMART INSIGHTS
  // --------------------------------------------------------
  
  // ✅ FIXED: Is function ki wajah se crash ho raha tha
  updateScore: async (scoreData) => {
    // scoreData: { userId, materialId, score, topicKey, topicName }
    const response = await api.post('/api/mastery/update-score', scoreData);
    return response.data;
  },

  getMasteryData: async (userId, materialId) => {
    const response = await api.get(`/api/mastery/${userId}/${materialId}`);
    return response.data;
  },

  getAIInsights: async (userId) => {
    try {
      const response = await api.get(`/api/mastery/get-insights/${userId}`);
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        aiMessage: "Ready to boost your scores? Pick a priority goal below to start practicing.",
        stats: { avgMastery: 0, totalSessions: 0 } 
      };
    }
  },

  getUserMaterials: async (userId) => {
    const response = await api.get(`/api/upload/user-materials/${userId}`);
    return response.data;
  },

  // --------------------------------------------------------
  // 3️⃣ PRACTICE & EVALUATION
  // --------------------------------------------------------
  generateSession: async (userId, materialId, pattern) => {
    const response = await api.post('/api/practice/generate-session', { userId, materialId, pattern });
    return response.data;
  },

  submitPracticeAnswer: async (answerData) => {
    const response = await api.post('/api/practice/submit', answerData);
    return response.data;
  },

  // --------------------------------------------------------
  // 4️⃣ AI CHAT
  // --------------------------------------------------------
  sendMessage: async (question, userId, materialId = null) => {
    const response = await api.post('/api/chat/ask', { 
      question, 
      userId, 
      materialId: materialId || null 
    }); 
    return response.data; 
  },

  // --------------------------------------------------------
  // 5️⃣ PDF UPLOADS
  // --------------------------------------------------------
  uploadMaterial: async (formData) => {
    try {
      const response = await api.post('/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, 
      });
      return response.data;
    } catch (error) {
      console.error("Upload API Error:", error.response?.data || error.message);
      throw error;
    }
  },

  // --------------------------------------------------------
  // 6️⃣ PLANNER & GOAL MANAGEMENT
  // --------------------------------------------------------
  getFullPlan: async (userId) => {
    try {
      const response = await api.get(`/api/planner/get-full-plan/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, plan: [] };
    }
  },

  addTask: async (taskData) => {
    const response = await api.post('/api/planner/add-task', taskData);
    return response.data;
  },

  toggleTask: async (taskId) => {
    const response = await api.patch(`/api/planner/toggle-task/${taskId}`);
    return response.data;
  },
};

export default api;