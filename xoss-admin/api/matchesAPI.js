// api/matchesAPI.js - COMPLETELY FIXED FOR ADMIN APP
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ IMPORTANT: Use SAME BASE_URL as User App
const API_BASE_URL = 'https://xoss.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ✅ FIXED: Better Token Handling
api.interceptors.request.use(
  async (config) => {
    try {
      // First try admin_token, then regular token
      const token = await AsyncStorage.getItem('admin_token') 
                    || await AsyncStorage.getItem('token');
      
      console.log('🔑 matchesAPI Token Status:', {
        hasAdminToken: !!await AsyncStorage.getItem('admin_token'),
        hasRegularToken: !!await AsyncStorage.getItem('token'),
        tokenLength: token ? token.length : 0
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token attached to request');
      } else {
        console.warn('⚠️ No token found for request');
        // Don't send request without token - might fail
      }
    } catch (error) {
      console.error('❌ Token interceptor error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor for better debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ matchesAPI Response:', {
      status: response.status,
      url: response.config.url,
      dataCount: response.data?.data?.length || 0
    });
    return response;
  },
  (error) => {
    console.error('❌ matchesAPI Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - Token invalid');
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('admin_token');
    }
    
    return Promise.reject(error);
  }
);

export const matchesAPI = {
  // ✅ FIXED: GET all matches - Use matchRoutes endpoint
  getAll: async () => {
    try {
      console.log('🔍 matchesAPI: Fetching from /matches endpoint...');
      
      const res = await api.get('/matches');
      console.log('📥 matchesAPI Response:', {
        success: res.data?.success,
        count: res.data?.data?.length || 0,
        message: res.data?.message
      });
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || [],
          count: res.data.data?.length || 0
        };
      } else {
        return { 
          success: false, 
          message: res.data?.message || 'Failed to fetch matches',
          data: []
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI GET error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Fallback: Try direct matches endpoint
      try {
        console.log('🔄 Trying direct /api/matches fallback...');
        const fallbackRes = await api.get('/matches');
        return { 
          success: true, 
          data: fallbackRes.data?.data || fallbackRes.data || []
        };
      } catch (fallbackError) {
        return { 
          success: false, 
          message: error.response?.data?.message || error.message,
          data: []
        };
      }
    }
  },

  // ✅ FIXED: UPDATE match
  update: async (id, data) => {
    try {
      console.log('🔄 matchesAPI: Updating match:', id, data);
      
      const res = await api.put(`/matches/${id}`, data);
      console.log('✅ matchesAPI Update Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI UPDATE error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Try PATCH if PUT fails
      try {
        console.log('🔄 Trying PATCH method...');
        const patchRes = await api.patch(`/matches/${id}`, data);
        return patchRes.data;
      } catch (patchError) {
        return { 
          success: false, 
          message: `Update failed: ${error.message}`,
          error: error.response?.data
        };
      }
    }
  },

  // ✅ FIXED: DELETE match
  delete: async (id) => {
    try {
      console.log('🗑️ matchesAPI: Deleting match:', id);
      
      const res = await api.delete(`/matches/${id}`);
      console.log('✅ matchesAPI Delete Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI DELETE error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ FIXED: CREATE match
  create: async (data) => {
    try {
      console.log('📤 matchesAPI: Creating match...', {
        title: data.title,
        game: data.game,
        matchType: data.matchType
      });
      
      const res = await api.post('/matches', data);
      console.log('✅ matchesAPI Create Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI CREATE error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ GET match by ID
  getById: async (id) => {
    try {
      const res = await api.get(`/matches/${id}`);
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ JOIN match
  join: async (id) => {
    try {
      const res = await api.post(`/matches/${id}/join`);
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ ADMIN: Get pending matches
  getPending: async () => {
    try {
      const res = await api.get('/matches/admin/pending');
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ ADMIN: Approve match
  approve: async (id) => {
    try {
      const res = await api.post(`/matches/admin/approve/${id}`);
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ ADMIN: Reject match
  reject: async (id, reason = 'No reason provided') => {
    try {
      const res = await api.post(`/matches/admin/reject/${id}`, { 
        rejectionReason: reason 
      });
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ ADDED: Test server connection
  testConnection: async () => {
    try {
      console.log('🏥 matchesAPI: Testing server connection...');
      
      const res = await api.get('/health');
      console.log('✅ Server Health:', res.data);
      
      return { 
        success: true, 
        message: 'Server is connected',
        data: res.data 
      };
    } catch (error) {
      console.error('❌ Server connection failed:', error.message);
      return { 
        success: false, 
        message: 'Server connection failed: ' + error.message
      };
    }
  }
};

export default matchesAPI;
