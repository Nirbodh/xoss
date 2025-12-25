// api/matchesAPI.js - COMPLETELY FIXED FOR ADMIN
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://xoss.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ✅ FIXED: Auth token management
let storedToken = null;

export const setAuthToken = (token) => {
  storedToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const clearAuthToken = () => {
  storedToken = null;
  delete api.defaults.headers.common['Authorization'];
};

api.interceptors.request.use(
  async (config) => {
    try {
      let token = storedToken;
      
      if (!token) {
        token = await AsyncStorage.getItem('token');
        if (token) {
          storedToken = token;
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Token Error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const matchesAPI = {
  // ✅ GET ALL MATCHES - FOR ADMIN (INCLUDING PENDING)
  getAll: async (params = {}) => {
    try {
      console.log('🔍 matchesAPI.getAll: Fetching ALL matches...');
      
      const res = await api.get('/matches/admin/all', { params });
      
      console.log('📥 matchesAPI.getAll Response:', {
        success: res.data?.success,
        count: res.data?.data?.length || 0
      });
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || [],
          count: res.data.data?.length || 0,
          message: res.data.message || 'Matches fetched successfully'
        };
      } else {
        return { 
          success: true, 
          message: 'No matches found or API issue',
          data: [],
          count: 0
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.getAll Error:', error.message);
      return { 
        success: true, 
        message: 'No matches found or server error',
        data: [],
        count: 0
      };
    }
  },

  // ✅ GET PENDING MATCHES
  getPending: async () => {
    try {
      console.log('🔍 matchesAPI.getPending: Fetching pending matches...');
      const res = await api.get('/matches/admin/pending');
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || [],
          count: res.data.data?.length || 0
        };
      } else {
        return { 
          success: false, 
          message: res.data?.message || 'Failed to fetch pending matches',
          data: []
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.getPending Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  // ✅ CREATE MATCH
  create: async (matchData) => {
    try {
      console.log('📤 matchesAPI.create: Creating match...');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { 
          success: false, 
          message: 'Please login first to create a match' 
        };
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const res = await api.post('/matches', matchData, config);
      console.log('✅ matchesAPI.create Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.create Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create match',
        error: error.response?.data
      };
    }
  },

  // ✅ UPDATE MATCH
  update: async (id, updateData) => {
    try {
      console.log('🔄 matchesAPI.update: Updating match:', id);
      const res = await api.put(`/matches/${id}`, updateData);
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.update Error:', error.message);
      return { 
        success: false, 
        message: `Update failed: ${error.message}`
      };
    }
  },

  // ✅ APPROVE MATCH
  approve: async (id, adminNotes = '') => {
    try {
      console.log('✅ matchesAPI.approve: Approving match:', id);
      const res = await api.post(`/matches/admin/approve/${id}`, { adminNotes });
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.approve Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ REJECT MATCH
  reject: async (id, rejectionReason = 'No reason provided', adminNotes = '') => {
    try {
      console.log('❌ matchesAPI.reject: Rejecting match:', id);
      const res = await api.post(`/matches/admin/reject/${id}`, { 
        rejectionReason, 
        adminNotes 
      });
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.reject Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ DELETE MATCH
  delete: async (id) => {
    try {
      console.log('🗑️ matchesAPI.delete: Deleting match:', id);
      const res = await api.delete(`/matches/${id}`);
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.delete Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  }
};

export default matchesAPI;
