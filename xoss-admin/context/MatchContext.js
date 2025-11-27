// context/MatchContext.js - COMPLETELY FIXED WITH APPROVAL SYSTEM
import React, { createContext, useContext, useState, useEffect } from 'react';
import { matchesAPI } from '../api/matchesAPI'; // ✅ Use real API
import { useAuth } from './AuthContext';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const { user, token } = useAuth() || {};
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ REAL API: Fetch All Matches
  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching matches from REAL API...');

      const res = await matchesAPI.getAll();
      console.log('📥 Matches API Response:', res);

      if (res && res.success) {
        setMatches(res.data || []);
        console.log(`✅ Loaded ${res.data?.length || 0} matches from backend`);
      } else {
        setError(res?.message || 'Failed to load matches');
        setMatches([]);
      }
    } catch (err) {
      console.error('❌ Match fetch error:', err);
      setError(err.message || 'Network error');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ REAL API: Create Match
  const createMatch = async (matchData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Creating match with data:', matchData);

      // ✅ Ensure all required fields for backend
      const backendData = {
        title: matchData.title,
        game: matchData.game,
        description: matchData.description || '',
        rules: matchData.rules || '',
        
        // Financial - BACKEND FIELD NAMES
        entry_fee: Number(matchData.entryFee) || 0,
        total_prize: Number(matchData.prizePool) || 0,
        per_kill: Number(matchData.perKill) || 0,
        
        // Participants - BACKEND FIELD NAMES
        max_participants: Number(matchData.maxPlayers) || 50,
        current_participants: 0, // Always start with 0
        
        // Game settings
        type: matchData.type || 'Solo',
        map: matchData.map || 'Bermuda',
        match_type: 'match', // ✅ IMPORTANT: This is a match
        
        // Room info
        room_id: matchData.roomId || '',
        room_password: matchData.password || '',
        
        // Timing
        start_time: matchData.startTime || matchData.scheduleTime,
        end_time: matchData.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        schedule_time: matchData.scheduleTime,
        
        // Status & Approval - ✅ SET TO PENDING FOR APPROVAL
        status: 'pending',
        approval_status: 'pending',
        created_by: matchData.created_by || user?.userId
      };

      console.log('📤 Sending to backend:', backendData);

      const result = await matchesAPI.create(backendData);
      
      if (result && result.success) {
        console.log('✅ Match created successfully in backend (Pending Approval)');
        await refreshMatches(); // Refresh the list
        return { 
          success: true, 
          message: 'Match created successfully! Waiting for admin approval.',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          error: result?.message || 'Create failed' 
        };
      }
    } catch (err) {
      console.error('❌ Create match error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ REAL API: Update Match
  const updateMatch = async (matchId, updateData) => {
    try {
      setLoading(true);
      const result = await matchesAPI.update(matchId, updateData);
      
      if (result && result.success) {
        await refreshMatches();
        return { success: true, message: 'Match updated successfully' };
      } else {
        return { success: false, error: result?.message || 'Update failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ REAL API: Delete Match
  const deleteMatch = async (matchId) => {
    try {
      setLoading(true);
      const result = await matchesAPI.delete(matchId);
      
      if (result && result.success) {
        await refreshMatches();
        return { success: true, message: 'Match deleted successfully' };
      } else {
        return { success: false, error: result?.message || 'Delete failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Approve Match Function
  const approveMatch = async (matchId) => {
    try {
      setLoading(true);
      const result = await matchesAPI.update(matchId, { 
        status: 'upcoming',
        approval_status: 'approved'
      });
      
      if (result && result.success) {
        await refreshMatches();
        return { success: true, message: 'Match approved successfully!' };
      } else {
        return { success: false, error: result?.message || 'Approval failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Reject Match Function
  const rejectMatch = async (matchId) => {
    try {
      setLoading(true);
      const result = await matchesAPI.update(matchId, { 
        status: 'rejected',
        approval_status: 'rejected'
      });
      
      if (result && result.success) {
        await refreshMatches();
        return { success: true, message: 'Match rejected successfully!' };
      } else {
        return { success: false, error: result?.message || 'Rejection failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Debug Function
  const debugMatchesAPI = async () => {
    try {
      console.log('🔍 Debugging Matches API...');
      const response = await matchesAPI.getAll();
      console.log('📊 Match API Response:', response);
    } catch (error) {
      console.error('❌ Debug Matches API error:', error);
    }
  };

  // ✅ Auto Fetch on Mount
  useEffect(() => {
    refreshMatches();
  }, []);

  return (
    <MatchContext.Provider
      value={{
        // Data
        matches,
        
        // Actions - REAL API
        refreshMatches,
        createMatch,
        updateMatch,
        deleteMatch,
        approveMatch, // ✅ NEW
        rejectMatch,  // ✅ NEW
        debugMatchesAPI,
        
        // State
        loading,
        error,
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
