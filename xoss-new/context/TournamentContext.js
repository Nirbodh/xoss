import React, { createContext, useContext, useState, useEffect } from 'react';
import { tournamentsAPI } from '../api/tournamentsAPI';
import { useAuth } from './AuthContext';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const { user, token } = useAuth() || {};
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ REAL API: Combined tournaments + matches fetch
  const refreshTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 User App: Fetching COMBINED tournaments + matches...');

      const res = await tournamentsAPI.getAll();
      console.log('📥 Combined API Response:', res);

      if (res && res.success) {
        const combinedData = res.data || [];
        console.log('🎯 Combined data received:', combinedData.length);

        const normalized = combinedData.map(item => {
          const maxParticipants = item.max_participants || item.maxPlayers || 50;
          const currentParticipants = item.current_participants || item.currentPlayers || 0;

          return {
            id: item._id || item.id,
            _id: item._id || item.id,
            title: item.title || 'Untitled Match',
            game: item.game || 'freefire',
            type: item.type || 'Solo',
            map: item.map || 'Bermuda',
            prizePool: item.total_prize || item.prizePool || 0,
            totalPrize: item.total_prize || item.totalPrize || 0,
            entryFee: item.entry_fee || 0,
            perKill: item.perKill || 0,
            maxPlayers: maxParticipants,
            maxParticipants: maxParticipants,
            currentPlayers: currentParticipants,
            currentParticipants: currentParticipants,
            scheduleTime: item.scheduleTime || item.start_time,
            startTime: item.start_time || item.scheduleTime,
            endTime: item.end_time,
            roomId: item.roomId || item.room_code,
            password: item.password || item.room_password,
            status: item.status || 'upcoming',
            matchType: item.matchType || 'match',
            description: item.description,
            rules: item.rules,
            created_by: item.created_by,
            spotsLeft: maxParticipants - currentParticipants,
            registered: false,
            source: item.source || 'combined' // match/tournament/combined
          };
        });

        console.log('✅ Normalized data:', normalized.length, 'items');
        setTournaments(normalized);
      } else {
        setError(res?.message || 'Failed to load tournaments and matches');
        setTournaments([]);
      }
    } catch (err) {
      console.error('❌ TournamentContext Error:', err);
      setError(err.message || 'Network error');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Debug API function
  const debugTournamentsAPI = async () => {
    try {
      console.log('🔍 Debugging Combined API...');
      const res = await tournamentsAPI.getAll();
      console.log('📊 Combined API Debug Response:', res);
      
      if (res && res.success && res.data) {
        const tournamentsCount = res.data.filter(item => item.matchType === 'tournament').length;
        const matchesCount = res.data.filter(item => item.matchType === 'match').length;
        
        console.log(`🏆 Tournaments: ${tournamentsCount}, ⚡ Matches: ${matchesCount}, 📊 Total: ${res.data.length}`);
      }
    } catch (error) {
      console.error('❌ Debug API error:', error);
    }
  };

  const createTournament = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        title: data.title,
        game: data.game,
        type: data.type,
        map: data.map,
        entry_fee: Number(data.entryFee) || 0,
        total_prize: Number(data.prizePool) || 0,
        max_participants: Number(data.maxPlayers) || 50,
        perKill: Number(data.perKill) || 0,
        scheduleTime: data.scheduleTime,
        start_time: data.scheduleTime,
        end_time: data.endTime,
        roomId: data.roomId,
        room_code: data.roomId,
        password: data.password,
        room_password: data.password,
        description: data.description,
        rules: data.rules,
        status: 'upcoming',
        matchType: data.matchType || 'match',
        created_by: data.created_by || user?.id || 'admin'
      };

      const res = await tournamentsAPI.create(payload, token);
      if (res && res.success) {
        await refreshTournaments();
        return { success: true, message: 'Tournament created successfully' };
      } else {
        return { success: false, error: res?.message || 'Create failed' };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);
      const tournament = tournaments.find(t => t._id === tournamentId || t.id === tournamentId);
      
      if (!tournament) throw new Error('Tournament not found');
      
      const current = Number(tournament.currentParticipants || tournament.currentPlayers || 0);
      const max = Number(tournament.maxParticipants || tournament.maxPlayers || 50);
      
      if (current >= max) throw new Error('No spots left');

      const res = await tournamentsAPI.join(tournamentId, token);
      if (res && res.success) {
        await refreshTournaments();
        return { success: true, message: 'Successfully joined tournament' };
      } else {
        return { success: false, error: res?.message || 'Join failed' };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getTournamentsByGame = (gameId) => {
    return tournaments.filter(t => (t.game || '').toLowerCase() === (gameId || '').toLowerCase());
  };

  const clearError = () => setError(null);

  useEffect(() => {
    refreshTournaments();
  }, []);

  const value = {
    tournaments,
    loading,
    error,
    refreshTournaments,
    createTournament,
    joinTournament,
    getTournamentsByGame,
    clearError,
    fetchTournaments: refreshTournaments,
    debugTournamentsAPI
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournaments must be used within a TournamentProvider');
  return context;
}
