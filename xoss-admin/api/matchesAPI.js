// api/matchesAPI.js - COMPLETELY FIXED FOR ADMIN APP
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ IMPORTANT: Use the SAME BASE_URL as your user app
const API_BASE_URL = 'https://xoss.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ✅ ENHANCED AUTH INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    try {
      // Try multiple token storage keys
      const token = await AsyncStorage.getItem('token') || 
                   await AsyncStorage.getItem('admin_token') ||
                   await AsyncStorage.getItem('auth_token');
      
      console.log('🔑 matchesAPI Token Check:', {
        hasToken: !!token,
        source: token ? (await AsyncStorage.getItem('token') ? 'token' : 
                        await AsyncStorage.getItem('admin_token') ? 'admin_token' : 
                        await AsyncStorage.getItem('auth_token') ? 'auth_token' : 'unknown') : 'none'
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token attached to matches request');
      } else {
        console.warn('⚠️ No token found for matches request');
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

// ✅ ENHANCED RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log('✅ matchesAPI Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
      dataCount: response.data?.data?.length || 0,
      success: response.data?.success
    });
    return response;
  },
  async (error) => {
    console.error('❌ matchesAPI Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    // Handle token expiration
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - Clearing tokens');
      await AsyncStorage.multiRemove(['token', 'admin_token', 'auth_token']);
    }
    
    return Promise.reject(error);
  }
);

// ✅ MAIN API FUNCTIONS
export const matchesAPI = {
  // ====================
  // 🔍 GET OPERATIONS
  // ====================
  
  // ✅ GET ALL MATCHES (With admin fallback)
  getAll: async (params = {}) => {
    try {
      console.log('🔍 matchesAPI.getAll: Fetching matches...', params);
      
      // Try admin endpoint first
      const res = await api.get('/matches/admin/all', { params });
      
      console.log('📥 matchesAPI.getAll Response:', {
        success: res.data?.success,
        count: res.data?.data?.length || res.data?.matches?.length || 0,
        message: res.data?.message
      });
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || res.data.matches || [],
          count: res.data.data?.length || res.data.matches?.length || 0,
          message: res.data.message || 'Matches fetched successfully'
        };
      } else {
        // Fallback to regular endpoint
        console.log('🔄 matchesAPI.getAll: Trying regular endpoint...');
        const fallbackRes = await api.get('/matches', { params });
        
        let matchData = [];
        if (fallbackRes.data && fallbackRes.data.success) {
          matchData = fallbackRes.data.data || fallbackRes.data.matches || [];
        } else if (Array.isArray(fallbackRes.data)) {
          matchData = fallbackRes.data;
        }
        
        console.log(`✅ matchesAPI.getAll Fallback: Found ${matchData.length} matches`);
        
        return { 
          success: true, 
          data: matchData,
          count: matchData.length,
          message: 'Matches fetched via fallback'
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.getAll Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return { 
        success: false, 
        message: 'Failed to fetch matches: ' + error.message,
        data: [],
        error: error.response?.data
      };
    }
  },

  // ✅ GET MATCH BY ID
  getById: async (id) => {
    try {
      console.log('🔍 matchesAPI.getById: Fetching match:', id);
      
      const res = await api.get(`/matches/${id}`);
      console.log('✅ matchesAPI.getById Response:', res.data);
      
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

  // ✅ GET PENDING MATCHES (For admin approval)
  getPending: async () => {
    try {
      console.log('🔍 matchesAPI.getPending: Fetching pending matches...');
      
      const res = await api.get('/matches/admin/pending');
      console.log('✅ matchesAPI.getPending Response:', {
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

  // ✅ CREATE MATCH
  create: async (matchData) => {
    try {
      console.log('📤 matchesAPI.create: Creating match...', {
        title: matchData.title,
        game: matchData.game,
        matchType: matchData.matchType || 'match'
      });
      
      // Determine endpoint based on matchType
      const endpoint = matchData.matchType === 'tournament' ? '/tournaments/create' : '/matches';
      console.log('🎯 Using endpoint:', endpoint);
      
      const res = await api.post(endpoint, matchData);
      console.log('✅ matchesAPI.create Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.create Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create match: ' + error.message,
        error: error.response?.data
      };
    }
  },

  // ====================
  // 🔄 UPDATE OPERATIONS
  // ====================

  // ✅ UPDATE MATCH
  update: async (id, updateData) => {
    try {
      console.log('🔄 matchesAPI.update: Updating match:', id, updateData);
      
      const res = await api.put(`/matches/${id}`, updateData);
      console.log('✅ matchesAPI.update Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.update Error:', error.message);
      
      // Try PATCH method as fallback
      try {
        console.log('🔄 Trying PATCH method...');
        const patchRes = await api.patch(`/matches/${id}`, updateData);
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

  // ✅ ADMIN: APPROVE MATCH
  approve: async (id, adminNotes = '') => {
    try {
      console.log('✅ matchesAPI.approve: Approving match:', id);
      
      const res = await api.post(`/matches/admin/approve/${id}`, { adminNotes });
      console.log('✅ matchesAPI.approve Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.approve Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ ADMIN: REJECT MATCH
  reject: async (id, rejectionReason = 'No reason provided', adminNotes = '') => {
    try {
      console.log('❌ matchesAPI.reject: Rejecting match:', id);
      
      const res = await api.post(`/matches/admin/reject/${id}`, { 
        rejectionReason, 
        adminNotes 
      });
      console.log('✅ matchesAPI.reject Response:', res.data);
      
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

  // ✅ DELETE MATCH
  delete: async (id) => {
    try {
      console.log('🗑️ matchesAPI.delete: Deleting match:', id);
      
      const res = await api.delete(`/matches/${id}`);
      console.log('✅ matchesAPI.delete Response:', res.data);
      
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

  // ✅ JOIN MATCH
  join: async (id) => {
    try {
      console.log('🎮 matchesAPI.join: Joining match:', id);
      
      const res = await api.post(`/matches/${id}/join`);
      console.log('✅ matchesAPI.join Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ matchesAPI.join Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ UPDATE MATCH STATUS
  updateStatus: async (id, status) => {
    try {
      console.log('🔄 matchesAPI.updateStatus: Updating match status:', id, status);
      
      const res = await api.put(`/matches/${id}/status`, { status });
      console.log('✅ matchesAPI.updateStatus Response:', res.data);
      
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

  // ✅ GET ALL MATCHES WITHOUT FILTERS (DEBUG)
  getAllNoFilter: async () => {
    try {
      console.log('🔍 matchesAPI.getAllNoFilter: Fetching ALL matches (no filters)...');
      
      // Try to get all matches directly from DB (if debug endpoint exists)
      const res = await api.get('/matches/debug/all');
      console.log('✅ matchesAPI.getAllNoFilter Response:', res.data);
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.allMatches || [],
          counts: res.data.counts || {}
        };
      } else {
        return { 
          success: false, 
          message: res.data?.message || 'Debug endpoint failed',
          data: []
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.getAllNoFilter Error:', error.message);
      return { 
        success: false, 
        message: 'Debug endpoint not available: ' + error.message,
        data: []
      };
    }
  },

  // ✅ TEST SERVER CONNECTION
  testConnection: async () => {
    try {
      console.log('🏥 matchesAPI.testConnection: Testing server connection...');
      
      const res = await api.get('/health');
      console.log('✅ matchesAPI.testConnection Response:', res.data);
      
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

  // ✅ GET MATCH STATISTICS
  getStats: async () => {
    try {
      console.log('📊 matchesAPI.getStats: Getting match statistics...');
      
      // Try to get from debug endpoint
      const res = await api.get('/matches/debug/all');
      
      if (res.data && res.data.success) {
        const stats = {
          total: res.data.counts?.total || 0,
          approved: res.data.counts?.approved || 0,
          pending: res.data.counts?.pending || 0,
          upcoming: res.data.counts?.upcoming || 0,
          completed: res.data.counts?.completed || 0,
          live: 0, // You might need to calculate this
          rejected: 0 // You might need to calculate this
        };
        
        return { 
          success: true, 
          data: stats,
          message: 'Match statistics fetched'
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to fetch statistics',
          data: {}
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.getStats Error:', error.message);
      return { 
        success: false, 
        message: 'Statistics endpoint not available',
        data: {}
      };
    }
  },

  // ✅ SEARCH MATCHES
  search: async (query) => {
    try {
      console.log('🔎 matchesAPI.search: Searching matches for:', query);
      
      const res = await api.get('/matches', {
        params: {
          search: query,
          limit: 50
        }
      });
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || [],
          count: res.data.count || 0
        };
      } else {
        return { 
          success: false, 
          message: 'Search failed',
          data: []
        };
      }
    } catch (error) {
      console.error('❌ matchesAPI.search Error:', error.message);
      return { 
        success: false, 
        message: 'Search failed: ' + error.message,
        data: []
      };
    }
  }
};

export default matchesAPI;
