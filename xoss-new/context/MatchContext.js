// context/MatchContext.js - COMPLETELY FIXED ERROR HANDLING
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import { useAuth } from './AuthContext';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  // ✅ REAL API CALLS - FIXED ENDPOINTS
  const matchesAPI = {
    // GET all matches
    getAll: async () => {
      try {
        console.log('🔄 Fetching matches from REAL API...');
        const response = await axios.get(`${BASE_URL}/matches`);
        console.log('📥 REAL API Response:', response.data);
        return response.data;
      } catch (err) {
        console.error('❌ API Error:', err);
        return {
          success: false,
          data: [],
          message: err.response?.data?.message || 'Failed to fetch matches'
        };
      }
    },

    // CREATE match - FIXED ENDPOINT
    create: async (matchData) => {
      try {
        console.log('🔄 Creating match via REAL API:', matchData);
        const response = await axios.post(`${BASE_URL}/matches`, matchData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (err) {
        console.error('❌ Create Match Error:', err);
        return {
          success: false,
          error: err.response?.data?.message || 'Failed to create match'
        };
      }
    },

    // UPDATE match
    update: async (matchId, updateData) => {
      try {
        const response = await axios.put(`${BASE_URL}/matches/${matchId}`, updateData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || 'Failed to update match'
        };
      }
    },

    // DELETE match
    delete: async (matchId) => {
      try {
        const response = await axios.delete(`${BASE_URL}/matches/${matchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || 'Failed to delete match'
        };
      }
    }
  };

  // ✅ Fetch All Matches
  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching matches from REAL API...');

      const res = await matchesAPI.getAll();
      console.log('📥 API Response:', res);

      if (res && res.success) {
        setMatches(res.data || []);
      } else {
        setError(res?.message || 'Failed to load matches');
      }
    } catch (err) {
      console.error('❌ Match fetch error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create Match - SIMPLIFIED
  const createMatch = async (matchData) => {
    try {
      setLoading(true);
      
      // ✅ SIMPLIFIED: Direct mapping without complex conversion
      const backendMatchData = {
        title: matchData.title,
        game: matchData.game,
        description: matchData.description || '',
        rules: matchData.rules || '',
        entryFee: Number(matchData.entryFee) || 0,
        prizePool: Number(matchData.prizePool) || 0,
        perKill: Number(matchData.perKill) || 0,
        maxPlayers: Number(matchData.maxPlayers) || 25,
        roomId: matchData.roomId || '',
        password: matchData.password || '',
        map: matchData.map || 'Bermuda',
        type: matchData.type || 'Solo',
        scheduleTime: matchData.scheduleTime,
        endTime: matchData.endTime,
        status: 'pending'
      };

      console.log('🔄 Sending to backend:', backendMatchData);
      const result = await matchesAPI.create(backendMatchData);
      
      if (result.success) {
        await refreshMatches(); // Refresh the list
      }
      
      return result;
    } catch (err) {
      console.error('❌ Create match error:', err);
      return {
        success: false,
        error: err.message || 'Failed to create match'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update Match
  const updateMatch = async (matchId, updateData) => {
    const result = await matchesAPI.update(matchId, updateData);
    if (result.success) {
      await refreshMatches();
    }
    return result;
  };

  // ✅ Delete Match
  const deleteMatch = async (matchId) => {
    const result = await matchesAPI.delete(matchId);
    if (result.success) {
      await refreshMatches();
    }
    return result;
  };

  // ✅ Auto Fetch on Mount
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
        deleteMatch
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
