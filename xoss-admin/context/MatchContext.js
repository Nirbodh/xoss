// context/MatchContext.js - COMPLETELY FIXED WITH ADMIN ENDPOINTS
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'https://xoss.onrender.com/api';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CREATE axios instance with token
  const createApiClient = async () => {
    const token = await AsyncStorage.getItem('token');
    
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
  };

  // ✅ FIXED: Load ALL matches (including pending) for ADMIN
  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 MatchContext (ADMIN): Fetching ALL matches...');

      const api = await createApiClient();
      
      // ✅ Use admin endpoint to get ALL matches (including pending)
      const response = await api.get('/matches/admin/all');
      
      console.log('📥 MatchContext API Response:', {
        success: response.data?.success,
        count: response.data?.data?.length || 0,
        message: response.data?.message
      });
      
      if (response.data && response.data.success) {
        let matchData = [];
        
        if (Array.isArray(response.data.data)) {
          matchData = response.data.data;
        } else if (Array.isArray(response.data)) {
          matchData = response.data;
        }
        
        // ✅ Filter for matches only (not tournaments)
        matchData = matchData.filter(item => 
          item.matchType === 'match' || 
          item.match_type === 'match' ||
          (item.title && !item.title.toLowerCase().includes('tournament'))
        );
        
        console.log(`✅ MatchContext: Loaded ${matchData.length} matches`);
        setMatches(matchData);
      } else {
        console.log('ℹ️ MatchContext: No matches found');
        setMatches([]);
      }
    } catch (err) {
      console.error('❌ MatchContext fetch error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Network error');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Simple match creation - PENDING for approval
  const createMatch = async (matchData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 MatchContext: Creating match (PENDING)...', matchData);

      const api = await createApiClient();
      
      // ✅ Data structure for backend - PENDING status
      const payload = {
        title: matchData.title,
        game: matchData.game,
        description: matchData.description || '',
        rules: matchData.rules || '',
        entry_fee: Number(matchData.entryFee) || 0,
        total_prize: Number(matchData.prizePool) || 0,
        per_kill: Number(matchData.perKill) || 0,
        max_participants: Number(matchData.maxPlayers) || 25,
        type: matchData.type || 'Solo',
        map: matchData.map || 'Bermuda',
        match_type: 'match',
        room_id: matchData.roomId || '',
        room_password: matchData.password || '',
        schedule_time: matchData.scheduleTime,
        start_time: matchData.startTime || matchData.scheduleTime,
        end_time: matchData.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        approval_status: 'pending'
      };

      console.log('📤 Sending match payload (PENDING):', payload);
      
      const response = await api.post('/matches', payload);
      
      console.log('📥 Create match response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Match created and pending approval');
        await refreshMatches(); // Refresh list
        return { 
          success: true, 
          message: response.data.message || 'Match created successfully! Waiting for admin approval.',
          data: response.data.data || response.data.tournament
        };
      } else {
        return { 
          success: false, 
          error: response.data?.message || 'Create failed' 
        };
      }
    } catch (err) {
      console.error('❌ Create match error:', err.response?.data || err.message);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Create failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update match
  const updateMatch = async (matchId, updateData) => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.put(`/matches/${matchId}`, updateData);
      
      if (response.data && response.data.success) {
        await refreshMatches();
        return { success: true, message: 'Match updated successfully' };
      } else {
        return { success: false, error: response.data?.message || 'Update failed' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Update failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete match
  const deleteMatch = async (matchId) => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.delete(`/matches/${matchId}`);
      
      if (response.data && response.data.success) {
        await refreshMatches();
        return { success: true, message: 'Match deleted successfully' };
      } else {
        return { success: false, error: response.data?.message || 'Delete failed' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Delete failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Approve match (for admin)
  const approveMatch = async (matchId) => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.post(`/matches/admin/approve/${matchId}`);
      
      if (response.data && response.data.success) {
        await refreshMatches();
        return { success: true, message: response.data.message || 'Match approved successfully!' };
      } else {
        return { success: false, error: response.data?.message || 'Approval failed' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Approval failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reject match (for admin)
  const rejectMatch = async (matchId, reason = 'No reason provided') => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.post(`/matches/admin/reject/${matchId}`, {
        rejectionReason: reason
      });
      
      if (response.data && response.data.success) {
        await refreshMatches();
        return { success: true, message: response.data.message || 'Match rejected successfully!' };
      } else {
        return { success: false, error: response.data?.message || 'Rejection failed' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Rejection failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get pending matches (for admin)
  const getPendingMatches = async () => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.get('/matches/admin/pending');
      
      if (response.data && response.data.success) {
        return { 
          success: true, 
          data: response.data.data || response.data.tournaments || [],
          count: response.data.count || response.data.data?.length || 0
        };
      } else {
        return { 
          success: false, 
          error: response.data?.message || 'Failed to fetch pending matches',
          data: []
        };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message,
        data: []
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clear matches
  const clearMatches = () => {
    setMatches([]);
  };

  // Load matches on component mount
  useEffect(() => {
    refreshMatches();
  }, []);

  return (
    <MatchContext.Provider
      value={{
        matches,
        loading,
        error,
        refreshMatches,
        createMatch,
        updateMatch,
        deleteMatch,
        approveMatch,
        rejectMatch,
        getPendingMatches,
        clearMatches,
        clearError: () => setError(null),
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatches = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
};
