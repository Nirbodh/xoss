// context/MatchContext.js - COMPLETELY FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import { matchesAPI } from '../api/matchesAPI';
import { useAuth } from './AuthContext';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const { user, refreshToken } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: Proper data fetching
  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 MatchContext: Fetching matches from API...');

      // ✅ Fix: সরাসরি API কল করুন, refreshToken সমস্যা করতে পারে
      const res = await matchesAPI.getAll();
      
      console.log('📥 MatchContext API Response:', {
        success: res.success,
        count: res.data?.length || 0
      });
      
      if (res && res.success) {
        let matchData = [];
        
        if (Array.isArray(res.data)) {
          matchData = res.data;
        } else if (Array.isArray(res.matches)) {
          matchData = res.matches;
        } else if (Array.isArray(res)) {
          matchData = res;
        }
        
        console.log(`✅ MatchContext: Loaded ${matchData.length} matches`);
        setMatches(matchData);
      } else {
        console.log('ℹ️ MatchContext: No matches found or API issue');
        setMatches([]);
      }
    } catch (err) {
      console.error('❌ MatchContext fetch error:', err);
      setError(err.message || 'Network error');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Create match function WITHOUT useAuth() inside
  const createMatch = async (matchData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Creating match with data:', matchData);

      // ✅ FIXED: সরাসরি user চেক করুন (useAuth() নয়)
      if (!user) {
        return { 
          success: false, 
          error: 'Please login first to create a match' 
        };
      }

      const result = await matchesAPI.create(matchData);
      
      if (result && result.success) {
        console.log('✅ Match created successfully');
        await refreshMatches(); // Refresh the list
        return { 
          success: true, 
          message: 'Match created successfully!',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          error: result?.message || result?.error || 'Create failed' 
        };
      }
    } catch (err) {
      console.error('❌ Create match error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update match
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

  // ✅ Delete match
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

  // ✅ Approve match
  const approveMatch = async (matchId) => {
    try {
      setLoading(true);
      const result = await matchesAPI.approve(matchId);
      
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

  // ✅ Reject match
  const rejectMatch = async (matchId) => {
    try {
      setLoading(true);
      const result = await matchesAPI.reject(matchId);
      
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

  // ✅ Join match
  const joinMatch = async (matchId) => {
    try {
      setLoading(true);
      const result = await matchesAPI.join(matchId);
      
      if (result && result.success) {
        await refreshMatches();
        return { success: true, message: 'Successfully joined match' };
      } else {
        return { success: false, error: result?.message || 'Join failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
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
        joinMatch,
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
