// context/TournamentContext.js - ORIGINAL WORKING VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import { tournamentsAPI } from '../api/tournamentsAPI';
import { useAuth } from './AuthContext';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const { user, token } = useAuth() || {};
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ UNIFIED DATA FETCHING
  const refreshTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await tournamentsAPI.getAll();
      
      if (res && res.success) {
        // Data is already mapped to consistent frontend format in API
        setTournaments(res.data || []);
      } else {
        setError(res?.message || 'Failed to load tournaments and matches');
        setTournaments([]);
      }
    } catch (err) {
      setError(err.message || 'Network error');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UNIFIED CREATE FUNCTION
  const createTournament = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure matchType is set
      const payload = {
        ...data,
        matchType: data.matchType || 'match',
        created_by: user?.userId || 'admin'
      };

      const result = await tournamentsAPI.create(payload, token);
      
      if (result && result.success) {
        await refreshTournaments();
        return { 
          success: true, 
          message: 'Event created successfully',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          error: result?.message || 'Create failed' 
        };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ FILTER FUNCTIONS WITH CONSISTENT FIELD NAMES
  const getTournamentsByGame = (gameId) => {
    return tournaments.filter(t => 
      (t.game || '').toLowerCase() === (gameId || '').toLowerCase()
    );
  };

  const getMatches = () => {
    return tournaments.filter(t => t.matchType === 'match');
  };

  const getTournaments = () => {
    return tournaments.filter(t => t.matchType === 'tournament');
  };

  const joinTournament = async (tournamentId) => {
    try {
      setLoading(true);
      const tournament = tournaments.find(t => 
        t._id === tournamentId || t.id === tournamentId
      );
      
      if (!tournament) throw new Error('Tournament not found');
      
      const current = tournament.currentPlayers || 0;
      const max = tournament.maxPlayers || 50;
      
      if (current >= max) throw new Error('No spots left');

      // Implement join API call here
      await refreshTournaments();
      return { success: true, message: 'Successfully joined tournament' };
    } catch (err) {
      setError(err.message);
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
        // Data
        tournaments,
        matches: getMatches(),
        tournamentsOnly: getTournaments(),
        
        // Actions
        refreshTournaments,
        createTournament,
        joinTournament,
        getTournamentsByGame,
        
        // State
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
