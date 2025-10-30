import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ LOCAL DEVELOPMENT URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const tournamentsAPI = {
  // ✅ Health check first
  health: async () => {
    try {
      const res = await api.get('/health');
      return res.data;
    } catch (err) {
      console.error('❌ Health check failed:', err.message);
      return { success: false, message: 'Server not reachable' };
    }
  },

  // ✅ Get all tournaments/matches - FIXED
  getAll: async (params = {}) => {
    try {
      console.log('🔍 Fetching from:', `${API_BASE_URL}/matches`);
      const res = await api.get('/matches', { params });
      console.log('✅ GET Response:', res.data);
      return res.data;
    } catch (err) {
      console.error('❌ API getAll error:', {
        message: err.message,
        code: err.code,
        url: err.config?.url,
        status: err.response?.status
      });
      return { 
        success: false, 
        message: err.response?.data?.message || err.message
      };
    }
  },

  // ✅ Create tournament/match - FIXED ROUTE
  create: async (data) => {
    try {
      console.log('📤 Sending to:', `${API_BASE_URL}/matches`);
      console.log('📦 Data:', data);
      
      // ✅ CORRECT: POST to /matches (not /matches/create)
      const res = await api.post('/matches', data);
      
      console.log('✅ CREATE Response:', res.data);
      return res.data;
    } catch (err) {
      console.error('❌ API create error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      return { 
        success: false, 
        message: err.response?.data?.message || err.message
      };
    }
  },

  // ✅ Update tournament/match
  update: async (id, data) => {
    try {
      const res = await api.put(`/matches/${id}`, data);
      return res.data;
    } catch (err) {
      console.error('❌ API update error:', err.response?.data || err.message);
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ Delete tournament/match
  delete: async (id) => {
    try {
      const res = await api.delete(`/matches/${id}`);
      return res.data;
    } catch (err) {
      console.error('❌ API delete error:', err.response?.data || err.message);
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ Get single tournament/match
  getById: async (id) => {
    try {
      const res = await api.get(`/matches/${id}`);
      return res.data;
    } catch (err) {
      console.error('❌ API getById error:', err.response?.data || err.message);
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  }
};
