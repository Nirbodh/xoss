// api/matchesAPI.js - COMPLETELY FIXED WITH CORRECT ENDPOINT
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://xoss.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ✅ AUTH INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Match API Token:', token ? 'Found' : 'Not found');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token attached to request');
      }
    } catch (error) {
      console.error('❌ Match API token error:', error);
    }
    return config;
  }
);

export const matchesAPI = {
  // ✅ GET ALL MATCHES - CORRECT ENDPOINT
  getAll: async (params = {}) => {
    try {
      console.log('🔍 Fetching matches from:', `${API_BASE_URL}/api/matches`);
      
      const res = await api.get('/api/matches', { params }); // ✅ /api/matches
      console.log('✅ GET Matches Response:', res.data);
      
      return res.data;
    } catch (err) {
      console.error('❌ Matches API getAll error:', {
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

  // ✅ CREATE MATCH - CORRECT ENDPOINT
  create: async (data) => {
    try {
      console.log('📤 Creating match at:', `${API_BASE_URL}/api/matches`);
      console.log('📦 Match Data:', data);
      
      const res = await api.post('/api/matches', data); // ✅ /api/matches
      
      console.log('✅ CREATE Match Response:', res.data);
      return res.data;
    } catch (err) {
      console.error('❌ Matches API create error:', {
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

  // ✅ UPDATE MATCH
  update: async (id, data) => {
    try {
      const res = await api.put(`/api/matches/${id}`, data); // ✅ /api/matches
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ DELETE MATCH
  delete: async (id) => {
    try {
      const res = await api.delete(`/api/matches/${id}`); // ✅ /api/matches
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ GET SINGLE MATCH
  getById: async (id) => {
    try {
      const res = await api.get(`/api/matches/${id}`); // ✅ /api/matches
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ HEALTH CHECK
  health: async () => {
    try {
      const res = await api.get('/api/matches/health');
      return res.data;
    } catch (err) {
      return { success: false, message: 'Matches API not reachable' };
    }
  }
};

export default matchesAPI;
