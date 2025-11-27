// context/TournamentContext.js - COMPLETELY FIXED WITH BOTH FIELDS AND APPROVAL
import React, { createContext, useContext, useState, useEffect } from 'react';
import { tournamentsAPI } from '../api/tournamentsAPI';
import { useAuth } from './AuthContext';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching tournaments from REAL API...');

      const res = await tournamentsAPI.getAll();
      console.log('📥 Tournaments API Response:', res);

      if (res && res.success) {
        const tournamentData = res.data?.filter(item => item.matchType === 'tournament') || [];
        setTournaments(tournamentData);
        console.log(`✅ Loaded ${tournamentData.length} tournaments from backend`);
      } else {
        setError(res?.message || 'Failed to load tournaments');
        setTournaments([]);
      }
    } catch (err) {
      console.error('❌ Tournament fetch error:', err);
      setError(err.message || 'Network error');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (tournamentData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Creating tournament with data:', tournamentData);

      // ✅ CRITICAL FIX: SEND BOTH camelCase AND snake_case FIELDS
      const backendData = {
        title: tournamentData.title,
        game: tournamentData.game,
        description: tournamentData.description || '',
        rules: tournamentData.rules || '',
        
        // Financial fields - send both versions
        entry_fee: Number(tournamentData.entryFee) || 0,
        entryFee: Number(tournamentData.entryFee) || 0,
        
        total_prize: Number(tournamentData.prizePool) || 0,
        prizePool: Number(tournamentData.prizePool) || 0,
        
        per_kill: Number(tournamentData.perKill) || 0,
        perKill: Number(tournamentData.perKill) || 0,
        
        // Participants - send both versions
        max_participants: Number(tournamentData.maxPlayers) || 100,
        maxPlayers: Number(tournamentData.maxPlayers) || 100,
        
        current_participants: 0,
        currentPlayers: 0,
        
        // Game settings
        type: tournamentData.type || 'Squad',
        map: tournamentData.map || 'Bermuda',
        match_type: 'tournament',
        matchType: 'tournament',
        
        // Room info
        room_id: tournamentData.roomId || '',
        roomId: tournamentData.roomId || '',
        
        room_password: tournamentData.password || '',
        password: tournamentData.password || '',
        
        // ✅ CRITICAL FIX: SEND BOTH scheduleTime AND schedule_time
        schedule_time: tournamentData.scheduleTime,
        scheduleTime: tournamentData.scheduleTime, // ✅ THIS IS WHAT BACKEND WANTS!
        
        start_time: tournamentData.scheduleTime,
        startTime: tournamentData.scheduleTime,
        
        end_time: tournamentData.endTime,
        endTime: tournamentData.endTime,
        
        // Status & Approval - ✅ SET TO PENDING FOR APPROVAL
        status: 'pending',
        approval_status: 'pending',
        approvalStatus: 'pending',
        
        created_by: user?.userId || 'admin'
      };

      console.log('📤 Sending to backend (WITH BOTH FIELDS):', backendData);

      const result = await tournamentsAPI.create(backendData);
      
      if (result && result.success) {
        console.log('✅ Tournament created successfully in backend (Pending Approval)');
        await refreshTournaments();
        return { 
          success: true, 
          message: 'Tournament created successfully! Waiting for admin approval.',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          error: result?.message || 'Create failed' 
        };
      }
    } catch (err) {
      console.error('❌ Create tournament error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

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

  // ✅ NEW: Approve Tournament Function
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

  // ✅ NEW: Reject Tournament Function
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
        approveTournament, // ✅ NEW
        rejectTournament,  // ✅ NEW
        joinTournament,
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
