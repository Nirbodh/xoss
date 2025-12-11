// context/TournamentContext.js - COMPLETELY FIXED & OPTIMIZED
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'https://xoss.onrender.com/api';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
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

  // ✅ FIXED: Load tournaments directly from /api/tournaments
  const refreshTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 TournamentContext: Fetching tournaments...');

      const api = await createApiClient();
      
      // ✅ DIRECT CALL to tournaments endpoint
      const response = await api.get('/tournaments');
      
      console.log('📥 TournamentContext API Response:', {
        success: response.data?.success,
        count: response.data?.tournaments?.length || response.data?.data?.length || 0,
        message: response.data?.message
      });
      
      if (response.data && response.data.success) {
        let tournamentData = [];
        
        if (Array.isArray(response.data.tournaments)) {
          tournamentData = response.data.tournaments;
        } else if (Array.isArray(response.data.data)) {
          tournamentData = response.data.data;
        } else if (Array.isArray(response.data)) {
          tournamentData = response.data;
        }
        
        // ✅ Filter for tournaments only (safety check)
        tournamentData = tournamentData.filter(item => 
          item.matchType === 'tournament' || 
          item.match_type === 'tournament' ||
          (item.title && item.title.toLowerCase().includes('tournament'))
        );
        
        console.log(`✅ TournamentContext: Loaded ${tournamentData.length} tournaments`);
        setTournaments(tournamentData);
      } else {
        console.log('ℹ️ TournamentContext: No tournaments found');
        setTournaments([]);
      }
    } catch (err) {
      console.error('❌ TournamentContext fetch error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Network error');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Simple tournament creation
  const createTournament = async (tournamentData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 TournamentContext: Creating tournament...', tournamentData);

      const api = await createApiClient();
      
      // ✅ Simple data structure for backend
      const payload = {
        title: tournamentData.title,
        game: tournamentData.game,
        description: tournamentData.description || '',
        rules: tournamentData.rules || '',
        entry_fee: Number(tournamentData.entryFee) || 0,
        total_prize: Number(tournamentData.prizePool) || 0,
        per_kill: Number(tournamentData.perKill) || 0,
        max_participants: Number(tournamentData.maxPlayers) || 100,
        type: tournamentData.type || 'Squad',
        map: tournamentData.map || 'Bermuda',
        match_type: 'tournament',
        room_id: tournamentData.roomId || '',
        room_password: tournamentData.password || '',
        schedule_time: tournamentData.scheduleTime,
        start_time: tournamentData.startTime || tournamentData.scheduleTime,
        end_time: tournamentData.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        approval_status: 'pending'
      };

      console.log('📤 Sending tournament payload:', payload);
      
      const response = await api.post('/tournaments/create', payload);
      
      console.log('📥 Create tournament response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Tournament created successfully');
        await refreshTournaments(); // Refresh list
        return { 
          success: true, 
          message: 'Tournament created successfully!',
          data: response.data.tournament || response.data.data
        };
      } else {
        return { 
          success: false, 
          error: response.data?.message || 'Create failed' 
        };
      }
    } catch (err) {
      console.error('❌ Create tournament error:', err.response?.data || err.message);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Create failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update tournament
  const updateTournament = async (tournamentId, updateData) => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.put(`/tournaments/${tournamentId}`, updateData);
      
      if (response.data && response.data.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament updated successfully' };
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

  // ✅ Delete tournament
  const deleteTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.delete(`/tournaments/${tournamentId}`);
      
      if (response.data && response.data.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament deleted successfully' };
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

  // ✅ Approve tournament
  const approveTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.post(`/tournaments/admin/approve/${tournamentId}`);
      
      if (response.data && response.data.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament approved successfully!' };
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

  // ✅ Reject tournament
  const rejectTournament = async (tournamentId, reason = 'No reason provided') => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.post(`/tournaments/admin/reject/${tournamentId}`, {
        rejectionReason: reason
      });
      
      if (response.data && response.data.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament rejected successfully!' };
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

  // ✅ Get pending tournaments
  const getPendingTournaments = async () => {
    try {
      setLoading(true);
      const api = await createApiClient();
      
      const response = await api.get('/tournaments/admin/pending');
      
      if (response.data && response.data.success) {
        return { 
          success: true, 
          data: response.data.tournaments || response.data.data || [],
          count: response.data.count || response.data.tournaments?.length || 0
        };
      } else {
        return { 
          success: false, 
          error: response.data?.message || 'Failed to fetch pending tournaments',
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

  // ✅ Test connection
  const testConnection = async () => {
    try {
      const api = await createApiClient();
      const response = await api.get('/health');
      return { 
        success: true, 
        message: 'Server is connected and healthy',
        data: response.data 
      };
    } catch (err) {
      return { 
        success: false, 
        error: 'Server connection failed: ' + (err.message || 'Unknown error')
      };
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
