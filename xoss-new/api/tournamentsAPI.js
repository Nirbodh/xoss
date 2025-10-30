// xoss-new/api/tournamentsAPI.js - FIXED VERSION
import { api } from '../utils/api';

// Tournament specific API functions for user app
export const tournamentsAPI = {
  // ✅ Get all tournaments/matches - DIRECT API CALL
  getAll: async (params = {}) => {
    try {
      console.log('🎯 tournamentsAPI: Calling combined API...');
      return await api.getMatches(params);
    } catch (error) {
      console.error('❌ tournamentsAPI.getAll error:', error);
      return {
        success: false,
        message: 'Failed to fetch tournaments',
        data: []
      };
    }
  },

  // ✅ Get single tournament/match
  getById: async (id) => {
    try {
      return await api.getMatchById(id);
    } catch (error) {
      console.error('tournamentsAPI.getById error:', error);
      return { success: false, message: 'Failed to fetch tournament' };
    }
  },

  // ✅ Join tournament/match
  join: async (matchId, token) => {
    try {
      return await api.joinMatch(matchId, token);
    } catch (error) {
      console.error('tournamentsAPI.join error:', error);
      return { success: false, message: 'Failed to join tournament' };
    }
  },

  // ✅ Quick join tournament/match
  quickJoin: async (matchId, token) => {
    try {
      return await api.quickJoinMatch(matchId, token);
    } catch (error) {
      console.error('tournamentsAPI.quickJoin error:', error);
      return { success: false, message: 'Failed to quick join tournament' };
    }
  },

  // ✅ Create tournament (এডমিন এর জন্য)
  create: async (payload, token) => {
    try {
      console.log('🎯 Creating tournament...', payload);
      return await api.createMatch(payload, token);
    } catch (error) {
      console.error('tournamentsAPI.create error:', error);
      return { success: false, message: 'Failed to create tournament' };
    }
  },

  // ✅ Debug function for testing API
  debugAPI: async () => {
    try {
      console.log('🔍 Debugging tournamentsAPI...');
      const result = await api.getMatches();
      console.log('📊 Debug Result:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        message: result.message
      });
      return result;
    } catch (error) {
      console.error('❌ Debug API Error:', error);
      return { success: false, message: 'Debug failed' };
    }
  }
};

export default tournamentsAPI;
