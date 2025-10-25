// context/TournamentContext.js - FIXED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';

const TournamentContext = createContext();

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournaments must be used within a TournamentProvider');
  }
  return context;
};

export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: Get only matches (matchType = 'match')
  const getTournamentsForUser = () => {
    return tournaments.filter(t => t.matchType === 'match');
  };

  // ✅ FIXED: Get only tournaments (matchType = 'tournament') 
  const getTournamentsForUserTournaments = () => {
    return tournaments.filter(t => t.matchType === 'tournament');
  };

  // ✅ FIXED: Get by game
  const getTournamentsByGame = (game) => {
    return tournaments.filter(t => t.game === game);
  };

  // ✅ FIXED: Refresh tournaments
  const refreshTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with your actual API call
      const response = await fetch('/api/tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (err) {
      setError('Failed to load tournaments');
      console.error('Tournament refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Join tournament
  const joinTournament = async (tournamentId) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setTournaments(prev => prev.map(t => 
          t._id === tournamentId 
            ? { ...t, currentParticipants: t.currentParticipants + 1, registered: true }
            : t
        ));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  // ✅ FIXED: Create tournament
  const createTournament = async (tournamentData) => {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournamentData),
      });
      const result = await response.json();
      
      if (result.success) {
        setTournaments(prev => [result.tournament, ...prev]);
        return { success: true, tournament: result.tournament };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  // ✅ FIXED: Update tournament
  const updateTournament = async (tournamentId, updateData) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      
      if (result.success) {
        setTournaments(prev => prev.map(t => 
          t._id === tournamentId ? { ...t, ...updateData } : t
        ));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  // ✅ FIXED: Delete tournament
  const deleteTournament = async (tournamentId) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setTournaments(prev => prev.filter(t => t._id !== tournamentId));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  // Load tournaments on mount
  useEffect(() => {
    refreshTournaments();
  }, []);

  const value = {
    tournaments,
    loading,
    error,
    refreshTournaments,
    joinTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    getTournamentsForUser,
    getTournamentsForUserTournaments,
    getTournamentsByGame
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
