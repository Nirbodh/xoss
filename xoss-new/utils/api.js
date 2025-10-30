// xoss-new/utils/api.js - COMPLETE FIXED VERSION
import axios from 'axios';

// ✅ আপনার Backend URL
const BASE_URL = 'https://xoss.onrender.com';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ✅ REAL API functions - DIRECT EXPORT
export const api = {
  // ✅ Get all matches from combined API
  getMatches: async (params = {}) => {
    try {
      console.log('🔄 Fetching combined matches + tournaments from REAL API...');
      const response = await axiosInstance.get('/api/combined', { params });
      console.log('✅ Combined API Response received');
      return response.data;
    } catch (error) {
      console.error('❌ Combined API Error:', error);
      return {
        success: false,
        message: 'Failed to fetch data from backend',
        data: []
      };
    }
  },

  // ✅ Get match by ID
  getMatchById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/matches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching match:', error);
      return { success: false, message: 'Failed to fetch match' };
    }
  },

  // ✅ Join match
  joinMatch: async (matchId, token) => {
    try {
      const response = await axiosInstance.post(`/api/matches/${matchId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error joining match:', error);
      return { success: false, message: 'Failed to join match' };
    }
  },

  // ✅ Quick join match
  quickJoinMatch: async (matchId, token) => {
    try {
      const response = await axiosInstance.post(`/api/matches/${matchId}/quick-join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error quick joining match:', error);
      return { success: false, message: 'Failed to quick join match' };
    }
  },

  // ✅ Create match (এডমিন এর জন্য)
  createMatch: async (payload, token) => {
    try {
      console.log('🎯 Creating match...', payload);
      const response = await axiosInstance.post('/api/matches', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error creating match:', error);
      return { success: false, message: 'Failed to create match' };
    }
  }
};

// ✅ Default export (পুরানো code এর compatibility এর জন্য)
export default api;
