// contexts/TournamentContext.js - SIMPLIFIED FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ FIXED: API Configuration
const API_BASE_URL = __DEV__ 
  ? "http://192.168.0.200:5000/api" 
  : "https://xoss.onrender.com/api";

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIXED: Load tournaments from API
  const fetchTournamentsFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌐 Fetching from:', `${API_BASE_URL}/tournaments`);
      
      const response = await fetch(`${API_BASE_URL}/tournaments`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Data received:', data);
      
      if (data.success) {
        setTournaments(data.tournaments || []);
        await saveTournamentsToStorage(data.tournaments || []);
        return { success: true, tournaments: data.tournaments };
      } else {
        throw new Error(data.message || 'Failed to fetch tournaments');
      }
    } catch (error) {
      console.error('❌ API fetch error:', error);
      setError(error.message);
      
      // Fallback to local storage
      await loadTournamentsFromStorage();
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Get ONLY MATCHES for users
  const getTournamentsForUser = () => {
    return tournaments.filter(t => 
      (t.status === 'upcoming' || t.status === 'live') &&
      (t.matchType === 'match' || !t.matchType) // Include both matches and legacy data
    );
  };

  // ✅ FIXED: Get ONLY TOURNAMENTS for users  
  const getTournamentsForUserTournaments = () => {
    return tournaments.filter(t => 
      (t.status === 'upcoming' || t.status === 'live') &&
      t.matchType === 'tournament'
    );
  };

  // Local storage functions
  const loadTournamentsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('tournaments_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTournaments(parsed);
        console.log('✅ Loaded from storage:', parsed.length);
      }
    } catch (error) {
      console.error('❌ Storage load error:', error);
    }
  };

  const saveTournamentsToStorage = async (data) => {
    try {
      await AsyncStorage.setItem('tournaments_data', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Storage save error:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTournamentsFromAPI();
  }, []);

  const refreshTournaments = async () => {
    return await fetchTournamentsFromAPI();
  };

  const joinTournament = async (tournamentId) => {
    // Implement join logic
    return { success: true, message: 'Joined successfully!' };
  };

  const value = {
    // State
    tournaments,
    loading,
    error,
    
    // Actions
    refreshTournaments,
    joinTournament,
    
    // ✅ FIXED: User Functions
    getTournamentsForUser, // শুধু ম্যাচ
    getTournamentsForUserTournaments, // শুধু টুর্নামেন্ট
    
    // Helper functions
    getTournamentById: (id) => tournaments.find(t => t.id === id || t._id === id),
    getTournamentsByGame: (game) => tournaments.filter(t => t.game === game),
    getTournamentsByStatus: (status) => tournaments.filter(t => t.status === status),
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournaments must be used within TournamentProvider');
  }
  return context;
}
