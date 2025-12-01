// context/MatchContext.js - COMPLETELY FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import { matchesAPI } from '../api/matchesAPI';
import { useAuth } from './AuthContext';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: Proper data fetching with DEBUG
  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 MatchContext: Fetching matches from API...');

      const res = await matchesAPI.getAll();
      console.log('📥 MatchContext FULL API Response:', res);
      
      // ✅ CRITICAL FIX: Handle different response structures
      let matchData = [];
      
      if (res && res.success) {
        // Handle different backend response formats
        if (Array.isArray(res.data)) {
          matchData = res.data; // Standard format: {success: true, data: [...]}
        } else if (Array.isArray(res.matches)) {
          matchData = res.matches; // Alternative format: {success: true, matches: [...]}
        } else if (Array.isArray(res)) {
          matchData = res; // Direct array response
        }
        
        console.log(`✅ MatchContext: Loaded ${matchData.length} matches`);
        setMatches(matchData);
      } else {
        console.error('❌ MatchContext: API returned failure:', res);
        setError(res?.message || 'Failed to load matches');
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

  // ✅ FIXED: Create match function
  const createMatch = async (matchData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Creating match with data:', matchData);

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

  // ✅ FIXED: Update match function
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

  // ✅ FIXED: Delete match function
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

  // ✅ FIXED: Approve match function
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

  // ✅ FIXED: Reject match function
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
