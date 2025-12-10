// api/tournamentsAPI.js - COMPLETELY FIXED
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Use the same BASE_URL as your app
const API_BASE_URL = 'https://xoss.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// ✅ ENHANCED AUTH INTERCEPTOR
let currentToken = null;

// ✅ Function to set token from AuthContext
export const setTournamentToken = (token) => {
  currentToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ tournamentsAPI: Token set manually');
  }
};

// ✅ Function to clear token
export const clearTournamentToken = () => {
  currentToken = null;
  delete api.defaults.headers.common['Authorization'];
  console.log('✅ tournamentsAPI: Token cleared');
};

api.interceptors.request.use(
  async (config) => {
    try {
      let token = currentToken;
      
      // If no current token, check AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem('token');
        if (token) {
          currentToken = token;
        }
      }
      
      console.log('🔑 tournamentsAPI Token Status:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        url: config.url
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ tournamentsAPI: No token found for request');
      }
    } catch (error) {
      console.error('❌ tournamentsAPI Token Error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ FIXED API FUNCTIONS
export const tournamentsAPI = {
  // ✅ GET ALL TOURNAMENTS (WITH MATCHES)
  getAll: async () => {
    try {
      console.log('🔍 tournamentsAPI.getAll: Fetching tournaments...');
      
      // Try to get all matches first (both tournaments and matches)
      const response = await api.get('/matches', {
        params: {
          limit: 100,
          admin: 'true' // Get all matches without filters
        }
      });
      
      console.log('📥 tournamentsAPI.getAll Response:', {
        success: response.data?.success,
        count: response.data?.data?.length || 0,
        message: response.data?.message
      });
      
      if (response.data && response.data.success) {
        const allData = response.data.data || [];
        
        // Filter for tournaments only
        const tournamentData = allData.filter(item => 
          item.matchType === 'tournament' || 
          item.match_type === 'tournament' ||
          (item.title && item.title.toLowerCase().includes('tournament'))
        );
        
        console.log(`✅ Found ${tournamentData.length} tournaments out of ${allData.length} total events`);
        
        return { 
          success: true, 
          data: tournamentData,
          count: tournamentData.length,
          message: 'Tournaments fetched successfully'
        };
      } else {
        // Fallback to /tournaments endpoint
        try {
          console.log('🔄 tournamentsAPI.getAll: Trying /tournaments endpoint...');
          const fallbackRes = await api.get('/tournaments');
          
          let tournamentData = [];
          if (fallbackRes.data && fallbackRes.data.success) {
            tournamentData = fallbackRes.data.data || fallbackRes.data.tournaments || [];
          } else if (Array.isArray(fallbackRes.data)) {
            tournamentData = fallbackRes.data;
          }
          
          console.log(`✅ Fallback: Found ${tournamentData.length} tournaments`);
          
          return { 
            success: true, 
            data: tournamentData,
            count: tournamentData.length,
            message: 'Tournaments fetched via fallback'
          };
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError.message);
          return { 
            success: false, 
            message: 'Failed to fetch tournaments: ' + fallbackError.message,
            data: []
          };
        }
      }
    } catch (error) {
      console.error('❌ tournamentsAPI.getAll Error:', error.message);
      return { 
        success: false, 
        message: 'Network error: ' + error.message,
        data: []
      };
    }
  },

  // ✅ GET TOURNAMENT BY ID
  getById: async (id) => {
    try {
      console.log('🔍 tournamentsAPI.getById: Fetching tournament:', id);
      const res = await api.get(`/tournaments/${id}`);
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.getById Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message,
        data: null
      };
    }
  },

  // ✅ CREATE TOURNAMENT
  create: async (payload) => {
    try {
      console.log('📤 tournamentsAPI.create: Creating tournament...', {
        title: payload.title,
        game: payload.game,
        matchType: payload.matchType
      });
      
      // Check token first
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { 
          success: false, 
          message: 'Please login first to create tournament' 
        };
      }
      
      // Determine endpoint
      const endpoint = payload.matchType === 'tournament' ? '/tournaments/create' : '/matches';
      console.log('🎯 Using endpoint:', endpoint);
      
      // Set token for this request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const res = await api.post(endpoint, payload, config);
      console.log('✅ tournamentsAPI.create Response:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.create Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create tournament',
        error: error.response?.data
      };
    }
  },

  // ✅ UPDATE TOURNAMENT
  update: async (id, data) => {
    try {
      console.log('🔄 tournamentsAPI.update: Updating tournament:', id);
      const res = await api.put(`/tournaments/${id}`, data);
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.update Error:', error.message);
      
      // Try PATCH method as fallback
      try {
        console.log('🔄 Trying PATCH method...');
        const patchRes = await api.patch(`/tournaments/${id}`, data);
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

  // ✅ DELETE TOURNAMENT
  delete: async (id) => {
    try {
      console.log('🗑️ tournamentsAPI.delete: Deleting tournament:', id);
      const res = await api.delete(`/tournaments/${id}`);
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.delete Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ JOIN TOURNAMENT
  join: async (id) => {
    try {
      console.log('🎮 tournamentsAPI.join: Joining tournament:', id);
      const res = await api.post(`/tournaments/${id}/join`);
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.join Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ APPROVE TOURNAMENT
  approve: async (id, adminNotes = '') => {
    try {
      console.log('✅ tournamentsAPI.approve: Approving tournament:', id);
      const res = await api.post(`/tournaments/admin/approve/${id}`, { adminNotes });
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.approve Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ REJECT TOURNAMENT
  reject: async (id, rejectionReason = 'No reason provided', adminNotes = '') => {
    try {
      console.log('❌ tournamentsAPI.reject: Rejecting tournament:', id);
      const res = await api.post(`/tournaments/admin/reject/${id}`, { 
        rejectionReason, 
        adminNotes 
      });
      return res.data;
    } catch (error) {
      console.error('❌ tournamentsAPI.reject Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message
      };
    }
  },

  // ✅ GET PENDING TOURNAMENTS
  getPending: async () => {
    try {
      console.log('🔍 tournamentsAPI.getPending: Fetching pending tournaments...');
      const res = await api.get('/tournaments/admin/pending');
      
      if (res.data && res.data.success) {
        return { 
          success: true, 
          data: res.data.data || [],
          count: res.data.data?.length || 0
        };
      } else {
        return { 
          success: false, 
          message: res.data?.message || 'Failed to fetch pending tournaments',
          data: []
        };
      }
    } catch (error) {
      console.error('❌ tournamentsAPI.getPending Error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  // ✅ TEST CONNECTION
  testConnection: async () => {
    try {
      console.log('🏥 tournamentsAPI.testConnection: Testing server connection...');
      const res = await api.get('/health');
      return { 
        success: true, 
        message: 'Server is connected and healthy',
        data: res.data 
      };
    } catch (error) {
      console.error('❌ tournamentsAPI.testConnection Error:', error.message);
      return { 
        success: false, 
        message: 'Server connection failed: ' + error.message
      };
    }
  },

  // ✅ CHECK AUTH
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

export default tournamentsAPI;
