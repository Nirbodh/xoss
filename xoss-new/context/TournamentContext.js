// context/TournamentContext.js - UPDATED FOR NEW API
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import { useAuth } from './AuthContext';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: CORRECT API RESPONSE HANDLING WITH NEW ENDPOINTS
  const refreshTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching tournaments and matches...');
      
      // Fetch tournaments - NO FILTERS
      const tournamentsResponse = await axios.get(`${BASE_URL}/tournaments`);
      console.log('📥 Tournaments response:', tournamentsResponse.data);
      
      // Fetch matches - NO FILTERS  
      const matchesResponse = await axios.get(`${BASE_URL}/matches`);
      console.log('📥 Matches response:', matchesResponse.data);
      
      if (tournamentsResponse.data.success && matchesResponse.data.success) {
        // ✅ CORRECT: tournaments from 'tournaments' property
        const tournamentsData = tournamentsResponse.data.tournaments || [];
        // ✅ CORRECT: matches from 'data' property 
        const matchesData = matchesResponse.data.data || [];
        
        console.log(`✅ Raw data: ${tournamentsData.length} tournaments, ${matchesData.length} matches`);
        
        // Transform tournaments
        const transformedTournaments = tournamentsData.map(item => ({
          id: item._id,
          _id: item._id,
          title: item.title,
          game: item.game,
          matchType: 'tournament',
          type: item.type || 'Squad',
          entryFee: item.entry_fee || item.entryFee || 0,
          prizePool: item.total_prize || item.prizePool || 0,
          maxPlayers: item.max_participants || item.maxPlayers || 50,
          currentPlayers: item.current_participants || item.currentPlayers || 0,
          spotsLeft: (item.max_participants || item.maxPlayers || 50) - (item.current_participants || item.currentPlayers || 0),
          roomId: item.room_id || item.roomId || '',
          password: item.room_password || item.password || '',
          scheduleTime: item.schedule_time || item.scheduleTime,
          status: item.status || 'upcoming',
          approval_status: item.approval_status || 'pending',
          created_by: item.created_by
        }));

        // Transform matches
        const transformedMatches = matchesData.map(item => ({
          id: item._id,
          _id: item._id,
          title: item.title,
          game: item.game,
          matchType: 'match',
          type: item.type || 'Solo',
          entryFee: item.entry_fee || item.entryFee || 0,
          prizePool: item.total_prize || item.prizePool || 0,
          maxPlayers: item.max_participants || item.maxPlayers || 25,
          currentPlayers: item.current_participants || item.currentPlayers || 0,
          spotsLeft: (item.max_participants || item.maxPlayers || 25) - (item.current_participants || item.currentPlayers || 0),
          roomId: item.room_id || item.roomId || '',
          password: item.room_password || item.password || '',
          scheduleTime: item.schedule_time || item.scheduleTime,
          status: item.status || 'upcoming',
          approval_status: item.approval_status || 'pending',
          created_by: item.created_by
        }));

        // Combine all events
        const combinedEvents = [...transformedTournaments, ...transformedMatches];
        
        console.log('🎯 Final data:', {
          totalEvents: combinedEvents.length,
          tournaments: transformedTournaments.length,
          matches: transformedMatches.length
        });
        
        setAllEvents(combinedEvents);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const getTournaments = () => allEvents.filter(event => event.matchType === 'tournament');
  const getMatches = () => allEvents.filter(event => event.matchType === 'match');

  // Create tournament function
  const createTournament = async (tournamentData) => {
    try {
      const response = await axios.post(`${BASE_URL}/tournaments/create`, tournamentData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        await refreshTournaments(); // Refresh the list
      }
      
      return response.data;
    } catch (err) {
      console.error('❌ Create tournament error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to create tournament'
      };
    }
  };

  // Delete tournament function
  const deleteTournament = async (tournamentId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/tournaments/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await refreshTournaments(); // Refresh the list
      }
      
      return response.data;
    } catch (err) {
      console.error('❌ Delete tournament error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to delete tournament'
      };
    }
  };

  useEffect(() => {
    refreshTournaments();
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournaments: allEvents,
        matches: getMatches(),
        tournamentsOnly: getTournaments(),
        refreshTournaments,
        createTournament,
        deleteTournament,
        loading,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournaments must be used within a TournamentProvider');
  return context;
}
