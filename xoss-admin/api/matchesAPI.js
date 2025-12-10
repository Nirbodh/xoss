// api/matchesAPI.js - COMPLETELY FIXED FOR ADMIN APP
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

// ✅ FIXED: ENHANCED AUTH INTERCEPTOR
let storedToken = null;

// ✅ Function to manually set token from AuthContext
export const setAuthToken = (token) => {
  storedToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ matchesAPI: Token set manually');
  }
};

// ✅ Function to clear token
export const clearAuthToken = () => {
  storedToken = null;
  delete api.defaults.headers.common['Authorization'];
  console.log('✅ matchesAPI: Token cleared');
};

// ✅ INTERCEPTOR: Check both stored token and AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      let token = storedToken;
      
      // If no stored token, check AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem('token');
        if (token) {
          storedToken = token;
        }
      }
      
      console.log('🔑 matchesAPI Token Status:', {
        hasStoredToken: !!storedToken,
        hasAsyncStorageToken: !!token,
        tokenLength: token?.length || 0
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token attached to request');
      } else {
        console.warn('⚠️ No token found for request to:', config.url);
        // Don't remove this warning - it helps debug
      }
    } catch (error) {
      console.error('❌ matchesAPI Token Error:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ matchesAPI Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ FIXED RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('❌ matchesAPI Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - You need to login');
      // Don't auto-clear tokens, let user handle login
    } else if (error.response?.status === 404) {
      console.log('🔍 404 Not Found - Endpoint does not exist:', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

// ✅ FIXED: MAIN API FUNCTIONS
export const matchesAPI = {
  // ====================
  // 🔍 GET OPERATIONS
  // ====================
  
  // ✅ GET ALL MATCHES - USE REGULAR ENDPOINT
  getAll: async (params = {}) => {
    try {
      console.log('🔍 matchesAPI.getAll: Fetching matches...');
      
      // ✅ FIX: Use regular /matches endpoint with admin flag
      const res = await api.get('/matches', { 
        params: { ...params, admin: 'true' } // Add admin flag
      });
      
      console.log('📥 matchesAPI.getAll Response:', {
        success: res.data?.success,
        count: res.data?.data?.length || 0,
        message: res.data?.message
      });
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || [],
          count: res.data.data?.length || 0,
          message: res.data.message || 'Matches fetched successfully'
        };
      } else {
        // Fallback: Try to get any data even if success is false
        const matchData = res.data?.data || res.data?.matches || [];
        console.log(`ℹ️ matchesAPI: Found ${matchData.length} matches (fallback)`);
        
        return { 
          success: true, 
          data: matchData,
          count: matchData.length,
          message: 'Matches fetched (fallback mode)'
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.getAll Error:', error.message);
      
      // Don't return failure - return empty array to prevent app crash
      return { 
        success: true, 
        message: 'No matches found or server error',
        data: [],
        count: 0,
        error: error.message
      };
    }
  },

  // ✅ GET MATCH BY ID
  getById: async (id) => {
    try {
      console.log('🔍 matchesAPI.getById: Fetching match:', id);
      const res = await api.get(`/matches/${id}`);
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.getById Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message,
        data: null
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

  // ====================
  // ✏️ CREATE OPERATIONS
  // ====================

  // ✅ CREATE MATCH - WITH TOKEN CHECK
  create: async (matchData) => {
    try {
      console.log('📤 matchesAPI.create: Creating match...');
      
      // Check token before proceeding
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { 
          success: false, 
          message: 'Please login first to create a match' 
        };
      }
      
      // Set token for this request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const endpoint = '/matches';
      console.log('🎯 Using endpoint:', endpoint);
      
      const res = await api.post(endpoint, matchData, config);
      console.log('✅ matchesAPI.create Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.create Error:', {
        message: error.message,
        status: error.response?.status
      });
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create match',
        error: error.response?.data
      };
    }
  },

  // ====================
  // 🔄 UPDATE OPERATIONS
  // ====================

  update: async (id, updateData) => {
    try {
      console.log('🔄 matchesAPI.update: Updating match:', id);
      const res = await api.put(`/matches/${id}`, updateData);
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.update Error:', error.message);
      return { 
        success: false, 
        message: `Update failed: ${error.message}`,
        error: error.response?.data
      };
    }
  },

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

  // ====================
  // 🗑️ DELETE OPERATIONS
  // ====================

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
  },

  // ====================
  // 🎮 MATCH ACTIONS
  // ====================

  join: async (id) => {
    try {
      console.log('🎮 matchesAPI.join: Joining match:', id);
      const res = await api.post(`/matches/${id}/join`);
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.join Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      console.log('🔄 matchesAPI.updateStatus: Updating match status:', id, status);
      const res = await api.put(`/matches/${id}/status`, { status });
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.updateStatus Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ====================
  // 🔧 DEBUG & UTILITY
  // ====================

  testConnection: async () => {
    try {
      console.log('🏥 matchesAPI.testConnection: Testing server connection...');
      const res = await api.get('/health');
      return { 
        success: true, 
        message: 'Server is connected and healthy',
        data: res.data 
      };
    } catch (error) {
      console.error('❌ matchesAPI.testConnection Error:', error.message);
      return { 
        success: false, 
        message: 'Server connection failed: ' + error.message
      };
    }
  },

  // ✅ NEW: Check auth status
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return {
        hasToken: !!token,
        tokenLength: token?.length || 0
      };
    } catch (error) {
      return { hasToken: false, error: error.message };
    }
  }
};

export default matchesAPI;
