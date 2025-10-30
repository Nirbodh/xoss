import React, { createContext, useContext, useState, useEffect } from 'react';
import { tournamentsAPI } from '../api/tournamentsAPI';
import { useAuth } from './AuthContext';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch tournaments - FIXED data mapping
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await tournamentsAPI.getAll();
      
      console.log('📥 Admin API Response:', result);
      
      if (result.success && result.data) {
        // ✅ FIXED: Transform backend data to frontend format
        const transformedTournaments = result.data.map(tournament => ({
          id: tournament._id,
          _id: tournament._id,
          title: tournament.title,
          game: tournament.game,
          type: tournament.type,
          map: tournament.map,
          entryFee: tournament.entry_fee,
          prizePool: tournament.total_prize,
          totalPrize: tournament.total_prize,
          perKill: tournament.perKill || 0,
          maxPlayers: tournament.max_participants,
          maxParticipants: tournament.max_participants,
          currentPlayers: tournament.current_participants || 0,
          currentParticipants: tournament.current_participants || 0,
          roomId: tournament.room_code || tournament.roomId,
          password: tournament.room_password || tournament.password,
          description: tournament.description,
          rules: tournament.rules,
          status: tournament.status || 'upcoming',
          scheduleTime: tournament.scheduleTime,
          startTime: tournament.start_time || tournament.scheduleTime,
          endTime: tournament.end_time,
          createdBy: tournament.created_by,
          matchType: tournament.matchType,
          spotsLeft: (tournament.max_participants || 0) - (tournament.current_participants || 0)
        }));
        
        console.log('🔄 Admin Transformed tournaments:', transformedTournaments);
        setTournaments(transformedTournaments);
      } else {
        console.warn('⚠️ No data from API, using empty array');
        setTournaments([]);
      }
    } catch (err) {
      console.error('❌ Admin Fetch error:', err.message);
      setError(err.message);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create tournament - COMPLETELY FIXED
  const createTournament = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIXED: Proper data transformation for backend
      const backendData = {
        // Basic info
        title: formData.title,
        game: formData.game,
        description: formData.description,
        rules: formData.rules,
        
        // Financial info - ✅ FIXED: Proper number conversion
        entry_fee: Number(formData.entryFee) || 0,
        total_prize: Number(formData.prizePool) || 0,
        perKill: Number(formData.perKill) || 0,
        
        // Participants info - ✅ CRITICAL FIX: max_participants
        max_participants: Number(formData.maxPlayers) || 25,
        current_participants: 0,
        
        // Room info
        roomId: formData.roomId,
        room_code: formData.roomId,
        password: formData.password,
        room_password: formData.password,
        
        // Game settings
        map: formData.map,
        type: formData.type,
        matchType: formData.matchType || 'match',
        
        // Status and timing
        status: 'upcoming',
        start_time: formData.scheduleTime,
        end_time: formData.endTime,
        scheduleTime: formData.scheduleTime,
        
        // Creator info - ✅ FIXED: Use string instead of ObjectId
        created_by: user?.userId || 'admin'
      };

      console.log('🔄 Admin Sending to backend:', backendData);

      const result = await tournamentsAPI.create(backendData);
      
      if (result.success && result.data) {
        // Transform new tournament for frontend
        const newTournament = {
          id: result.data._id,
          _id: result.data._id,
          title: result.data.title,
          game: result.data.game,
          type: result.data.type,
          map: result.data.map,
          entryFee: result.data.entry_fee,
          prizePool: result.data.total_prize,
          totalPrize: result.data.total_prize,
          perKill: result.data.perKill,
          maxPlayers: result.data.max_participants,
          currentPlayers: result.data.current_participants,
          roomId: result.data.room_code,
          password: result.data.room_password,
          description: result.data.description,
          rules: result.data.rules,
          status: result.data.status,
          scheduleTime: result.data.scheduleTime,
          startTime: result.data.start_time,
          endTime: result.data.end_time,
          createdBy: result.data.created_by,
          matchType: result.data.matchType,
          spotsLeft: result.data.max_participants - result.data.current_participants
        };

        setTournaments(prev => [newTournament, ...prev]);
        return { success: true, message: 'Tournament created successfully' };
      } else {
        throw new Error(result.message || 'Failed to create tournament');
      }
    } catch (err) {
      console.error('❌ Admin Create error:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete tournament
  const deleteTournament = async (id) => {
    try {
      const result = await tournamentsAPI.delete(id);
      if (result.success) {
        setTournaments(prev => prev.filter(t => t._id !== id && t.id !== id));
        return { success: true, message: 'Tournament deleted successfully' };
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('❌ Admin Delete error:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ✅ Update tournament
  const updateTournament = async (id, data) => {
    try {
      const result = await tournamentsAPI.update(id, data);
      if (result.success && result.data) {
        setTournaments(prev => prev.map(t => 
          t._id === id ? { ...t, ...result.data } : t
        ));
        return { success: true, message: 'Tournament updated successfully' };
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('❌ Admin Update error:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ✅ Refresh tournaments
  const refreshTournaments = fetchTournaments;

  // ✅ Clear error
  const clearError = () => setError(null);

  // Load tournaments when component mounts
  useEffect(() => {
    fetchTournaments();
  }, []);

  return (
    <TournamentContext.Provider value={{
      tournaments,
      fetchTournaments,
      refreshTournaments,
      createTournament,
      deleteTournament,
      updateTournament,
      loading,
      error,
      clearError,
    }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournaments must be used within a TournamentProvider');
  return context;
};
