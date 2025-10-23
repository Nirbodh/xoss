// context/LeaderboardContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const LeaderboardContext = createContext();

export const LeaderboardProvider = ({ children }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly'); // daily, weekly, monthly, alltime

  // 🎯 Leaderboard timeframes
  const TIMEFRAMES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALLTIME: 'alltime'
  };

  // 🎯 Load leaderboard data
  useEffect(() => {
    loadLeaderboardData();
  }, [timeframe]);

  // 🎯 Load all leaderboard data
  const loadLeaderboardData = async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        loadLeaderboard(),
        loadUserRank(),
        loadUserStats()
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 Load leaderboard from API/storage
  const loadLeaderboard = async () => {
    try {
      // Try to load from storage first
      const storedKey = `leaderboard_${timeframe}`;
      const stored = await AsyncStorage.getItem(storedKey);
      
      if (stored) {
        setLeaderboard(JSON.parse(stored));
      }

      // Always try to fetch fresh data
      await fetchLeaderboardFromAPI();
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Load mock data as fallback
      loadMockLeaderboard();
    }
  };

  // 🎯 Fetch leaderboard from API
  const fetchLeaderboardFromAPI = async () => {
    try {
      // Simulate API call
      // const response = await api.get(`/leaderboard/${timeframe}`);
      // const data = await response.json();
      
      // Use mock data for now
      const mockData = generateMockLeaderboard();
      setLeaderboard(mockData);
      
      // Save to storage
      await AsyncStorage.setItem(`leaderboard_${timeframe}`, JSON.stringify(mockData));
    } catch (error) {
      throw new Error('API fetch failed');
    }
  };

  // 🎯 Load user rank
  const loadUserRank = async () => {
    try {
      // Simulate API call for user rank
      // const response = await api.get('/leaderboard/user/rank');
      // setUserRank(response.data.rank);
      
      // Mock rank for now
      const mockRank = Math.floor(Math.random() * 100) + 1;
      setUserRank(mockRank);
    } catch (error) {
      console.error('Failed to load user rank:', error);
    }
  };

  // 🎯 Load user stats
  const loadUserStats = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_stats');
      if (stored) {
        setUserStats(JSON.parse(stored));
      } else {
        // Load mock stats
        const mockStats = {
          matchesPlayed: 47,
          matchesWon: 25,
          winRate: 53.2,
          totalEarnings: 5250,
          currentStreak: 3,
          bestStreak: 8,
          averageKills: 5.2,
          favoriteGame: 'Free Fire',
          rank: 'Gold III',
          points: 2450
        };
        setUserStats(mockStats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  // 🎯 Refresh leaderboard
  const refreshLeaderboard = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await fetchLeaderboardFromAPI();
      await loadUserRank();
      setLastUpdated(new Date());
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // 🎯 Generate mock leaderboard data
  const generateMockLeaderboard = () => {
    const games = ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'Ludo King'];
    const countries = ['BD', 'IN', 'PK', 'US', 'UK'];
    
    return Array.from({ length: 50 }, (_, index) => ({
      id: `player-${index + 1}`,
      rank: index + 1,
      username: `Player${index + 1}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      earnings: Math.floor(Math.random() * 10000) + 1000,
      matchesPlayed: Math.floor(Math.random() * 100) + 10,
      winRate: Math.floor(Math.random() * 40) + 10,
      favoriteGame: games[Math.floor(Math.random() * games.length)],
      isOnline: Math.random() > 0.7,
      isPro: index < 5,
      trend: index < 15 ? 'up' : index > 35 ? 'down' : 'same',
      points: 5000 - (index * 75) + Math.floor(Math.random() * 100)
    })).sort((a, b) => b.points - a.points)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  };

  // 🎯 Change timeframe
  const changeTimeframe = (newTimeframe) => {
    if (Object.values(TIMEFRAMES).includes(newTimeframe)) {
      setTimeframe(newTimeframe);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // 🎯 Get top players
  const getTopPlayers = (count = 3) => {
    return leaderboard.slice(0, count);
  };

  // 🎯 Get player by rank
  const getPlayerByRank = (rank) => {
    return leaderboard.find(player => player.rank === rank);
  };

  // 🎯 Search players
  const searchPlayers = (query) => {
    return leaderboard.filter(player =>
      player.username.toLowerCase().includes(query.toLowerCase())
    );
  };

  // 🎯 Update user stats after match
  const updateUserStatsAfterMatch = async (matchResult) => {
    try {
      const {
        won = false,
        earnings = 0,
        kills = 0,
        position = 0
      } = matchResult;

      setUserStats(prev => {
        if (!prev) return prev;

        const newStats = {
          ...prev,
          matchesPlayed: prev.matchesPlayed + 1,
          matchesWon: prev.matchesWon + (won ? 1 : 0),
          totalEarnings: prev.totalEarnings + earnings,
          winRate: ((prev.matchesWon + (won ? 1 : 0)) / (prev.matchesPlayed + 1)) * 100,
          currentStreak: won ? prev.currentStreak + 1 : 0,
          bestStreak: won ? Math.max(prev.bestStreak, prev.currentStreak + 1) : prev.bestStreak,
          averageKills: ((prev.averageKills * prev.matchesPlayed) + kills) / (prev.matchesPlayed + 1)
        };

        // Save to storage
        AsyncStorage.setItem('user_stats', JSON.stringify(newStats));
        return newStats;
      });

      // Refresh leaderboard to reflect new stats
      setTimeout(() => {
        refreshLeaderboard();
      }, 1000);

    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  };

  // 🎯 Get timeframe display name
  const getTimeframeDisplayName = () => {
    const names = {
      [TIMEFRAMES.DAILY]: 'Today',
      [TIMEFRAMES.WEEKLY]: 'This Week',
      [TIMEFRAMES.MONTHLY]: 'This Month',
      [TIMEFRAMES.ALLTIME]: 'All Time'
    };
    return names[timeframe];
  };

  // 🎯 Get user position in leaderboard
  const getUserLeaderboardPosition = useCallback(() => {
    return leaderboard.findIndex(player => player.id === 'current-user') + 1 || userRank;
  }, [leaderboard, userRank]);

  const value = {
    // State
    leaderboard,
    userRank: getUserLeaderboardPosition(),
    userStats,
    isLoading,
    lastUpdated,
    timeframe,
    
    // Constants
    TIMEFRAMES,
    
    // Actions
    refreshLeaderboard,
    changeTimeframe,
    updateUserStatsAfterMatch,
    searchPlayers,
    
    // Getters
    getTopPlayers,
    getPlayerByRank,
    getTimeframeDisplayName
  };

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within LeaderboardProvider');
  }
  return context;
};

export default LeaderboardContext;
