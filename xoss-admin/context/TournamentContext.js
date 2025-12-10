// context/TournamentContext.js - COMPLETELY FIXED
import React, { createContext, useContext, useState, useEffect } from 'react';
import { tournamentsAPI, setTournamentToken, clearTournamentToken } from '../api/tournamentsAPI';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
  const { user, refreshToken, getCurrentToken } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: Load tournaments with token refresh
  const refreshTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 TournamentContext: Fetching tournaments...');

      // ✅ First refresh token
      await refreshToken();
      
      // ✅ Get current token and set it
      const token = await getCurrentToken();
      if (token) {
        setTournamentToken(token);
      }

      const res = await tournamentsAPI.getAll();
      console.log('📥 TournamentContext API Response:', {
        success: res.success,
        count: res.data?.length || 0,
        message: res.message
      });
      
      if (res && res.success) {
        let tournamentData = res.data || [];
        
        // Ensure we have an array
        if (!Array.isArray(tournamentData)) {
          console.warn('⚠️ Tournament data is not array:', tournamentData);
          tournamentData = [];
        }
        
        // Filter for tournaments if needed
        if (tournamentData.length > 0) {
          tournamentData = tournamentData.filter(item => 
            item.matchType === 'tournament' || 
            item.match_type === 'tournament' ||
            (item.title && item.title.toLowerCase().includes('tournament'))
          );
        }
        
        console.log(`✅ TournamentContext: Loaded ${tournamentData.length} tournaments`);
        setTournaments(tournamentData);
      } else {
        console.log('ℹ️ TournamentContext: No tournaments found or API issue');
        setTournaments([]);
      }
    } catch (err) {
      console.error('❌ TournamentContext fetch error:', err);
      setError(err.message || 'Network error');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Create tournament with proper error handling
  const createTournament = async (tournamentData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 TournamentContext: Creating tournament...', {
        title: tournamentData.title,
        game: tournamentData.game
      });

      // ✅ Check authentication first
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { 
          success: false, 
          error: 'Please login first to create a tournament' 
        };
      }

      // ✅ Prepare data for backend
      const backendData = {
        title: tournamentData.title,
        game: tournamentData.game,
        description: tournamentData.description || '',
        rules: tournamentData.rules || '',
        
        // Financial fields
        entry_fee: Number(tournamentData.entry_fee) || Number(tournamentData.entryFee) || 0,
        total_prize: Number(tournamentData.total_prize) || Number(tournamentData.prizePool) || 0,
        per_kill: Number(tournamentData.per_kill) || Number(tournamentData.perKill) || 0,
        
        // Participants
        max_participants: Number(tournamentData.max_participants) || Number(tournamentData.maxPlayers) || 100,
        current_participants: 0,
        
        // Game settings
        type: tournamentData.type || 'Squad',
        map: tournamentData.map || 'Bermuda',
        match_type: 'tournament',
        
        // Room info
        room_id: tournamentData.room_id || tournamentData.roomId || '',
        room_password: tournamentData.room_password || tournamentData.password || '',
        
        // Timing
        schedule_time: tournamentData.schedule_time || tournamentData.scheduleTime || new Date().toISOString(),
        start_time: tournamentData.start_time || tournamentData.startTime || new Date().toISOString(),
        end_time: tournamentData.end_time || tournamentData.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        
        // Status & Approval
        status: 'pending',
        approval_status: 'pending',
        
        created_by: user?.userId || user?.id || 'admin'
      };

      console.log('📤 Sending to backend:', backendData);

      const result = await tournamentsAPI.create(backendData);
      
      console.log('📥 Create tournament result:', result);
      
      if (result && result.success) {
        console.log('✅ Tournament created successfully');
        await refreshTournaments(); // Refresh the list
        return { 
          success: true, 
          message: 'Tournament created successfully! Waiting for admin approval.',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          error: result?.message || result?.error || 'Create failed' 
        };
      }
    } catch (err) {
      console.error('❌ Create tournament error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update tournament
  const updateTournament = async (tournamentId, updateData) => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.update(tournamentId, updateData);
      
      if (result && result.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament updated successfully' };
      } else {
        return { success: false, error: result?.message || 'Update failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete tournament
  const deleteTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.delete(tournamentId);
      
      if (result && result.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament deleted successfully' };
      } else {
        return { success: false, error: result?.message || 'Delete failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Approve tournament
  const approveTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.update(tournamentId, { 
        status: 'upcoming',
        approval_status: 'approved'
      });
      
      if (result && result.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament approved successfully!' };
      } else {
        return { success: false, error: result?.message || 'Approval failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reject tournament
  const rejectTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.update(tournamentId, { 
        status: 'rejected',
        approval_status: 'rejected'
      });
      
      if (result && result.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament rejected successfully!' };
      } else {
        return { success: false, error: result?.message || 'Rejection failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Join tournament
  const joinTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.join(tournamentId);
      
      if (result && result.success) {
        await refreshTournaments();
        return { success: true, message: 'Successfully joined tournament' };
      } else {
        return { success: false, error: result?.message || 'Join failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get pending tournaments
  const getPendingTournaments = async () => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.getPending();
      
      if (result && result.success) {
        return { 
          success: true, 
          data: result.data,
          count: result.count
        };
      } else {
        return { 
          success: false, 
          error: result?.message || 'Failed to fetch pending tournaments',
          data: []
        };
      }
    } catch (err) {
      return { success: false, error: err.message, data: [] };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Test connection
  const testConnection = async () => {
    try {
      setLoading(true);
      const result = await tournamentsAPI.testConnection();
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clear tournaments
  const clearTournaments = () => {
    setTournaments([]);
  };

  // Load tournaments on component mount
  useEffect(() => {
    refreshTournaments();
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        loading,
        error,
        refreshTournaments,
        createTournament,
        updateTournament,
        deleteTournament,
        approveTournament,
        rejectTournament,
        joinTournament,
        getPendingTournaments,
        testConnection,
        clearTournaments,
        clearError: () => setError(null),
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournaments must be used within a TournamentProvider');
  }
  return context;
};
