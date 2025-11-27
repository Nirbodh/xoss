// api/tournamentsAPI.js - COMPLETELY FIXED VERSION
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://xoss.onrender.com/api'; // ✅ FIXED URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ✅ IMPROVED Auth Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token from storage:', token ? 'Found' : 'Not found');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token attached to request');
      } else {
        console.warn('⚠️ No token found for request');
      }
    } catch (error) {
      console.error('❌ Token interceptor error:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor for Auth Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - Token invalid');
      AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const tournamentsAPI = {
  // ✅ Health check
  health: async () => {
    try {
      const res = await api.get('/health');
      return res.data;
    } catch (err) {
      return { success: false, message: 'Server not reachable' };
    }
  },

  // ✅ GET ALL EVENTS (matches + tournaments) - FIXED
  getAll: async (params = {}) => {
    try {
      console.log('🔍 Fetching ALL events from combined endpoint...');
      
      const res = await api.get('/combined', { params });
      console.log('✅ GET Combined Response:', res.data);
      
      return res.data;
    } catch (err) {
      console.error('❌ API getAll error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Fallback: Try separate endpoints if combined fails
      try {
        console.log('🔄 Trying separate endpoints...');
        const [tournamentsRes, matchesRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/matches')
        ]);

        const combinedData = [
          ...(tournamentsRes.data.tournaments || []).map(item => ({ ...item, matchType: 'tournament' })),
          ...(matchesRes.data.data || []).map(item => ({ ...item, matchType: 'match' }))
        ];

        return {
          success: true,
          data: combinedData,
          count: combinedData.length,
          message: 'Used fallback method'
        };
      } catch (fallbackError) {
        return { 
          success: false, 
          message: 'Failed to fetch events',
          error: err.message 
        };
      }
    }
  },

  // ✅ CREATE TOURNAMENT - FIXED ENDPOINT
  create: async (data) => {
    try {
      console.log('📤 Creating tournament...', data);
      
      const res = await api.post('/tournaments/create', data);
      console.log('✅ CREATE Tournament Response:', res.data);
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

  // ✅ UPDATE TOURNAMENT
  update: async (id, data) => {
    try {
      const res = await api.put(`/tournaments/${id}`, data);
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ DELETE TOURNAMENT
  delete: async (id) => {
    try {
      const res = await api.delete(`/tournaments/${id}`);
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ GET SINGLE TOURNAMENT
  getById: async (id) => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  },

  // ✅ JOIN TOURNAMENT
  join: async (id) => {
    try {
      const res = await api.post(`/tournaments/${id}/join`);
      return res.data;
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    }
  }
};

export default tournamentsAPI;
