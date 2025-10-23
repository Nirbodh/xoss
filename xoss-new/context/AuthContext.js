// context/AuthContext.js - ENHANCED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const token = await AsyncStorage.getItem('auth_token');
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Mock login - replace with actual API call
      const mockUser = {
        id: 'XOSS_789123',
        username: 'ProPlayer',
        name: 'Robert Fox',
        email: credentials.email || 'robert.fox@example.com',
        phone: '+8801XXXXXXXXX',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        walletBalance: 1250.75,
        level: 15,
        experience: 1250,
        nextLevelExp: 2000,
        joinDate: '2024-01-15',
        totalEarnings: 5250,
        matchesPlayed: 45,
        matchesWon: 25,
        winRate: '55%',
        favoriteGame: 'Free Fire',
        achievements: ['First Win', '5 Wins Streak', 'Team Player'],
        rank: 'Gold III',
        team: 'Bangladesh Warriors',
        isVerified: true,
        referralCode: `XOSS${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };

      const mockToken = 'demo-token-xoss-2024';

      // Save to storage
      await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
      await AsyncStorage.setItem('auth_token', mockToken);

      setUser(mockUser);
      setIsAuthenticated(true);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true, user: mockUser, token: mockToken };
    } catch (error) {
      console.error('Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      const newUser = {
        id: `XOSS_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        username: userData.username,
        name: userData.name || userData.username,
        email: userData.email,
        phone: userData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        walletBalance: 100, // Starting bonus
        level: 1,
        experience: 0,
        nextLevelExp: 100,
        joinDate: new Date().toISOString().split('T')[0],
        totalEarnings: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        winRate: '0%',
        favoriteGame: 'Free Fire',
        achievements: ['Welcome Bonus'],
        rank: 'Bronze V',
        team: null,
        isVerified: false,
        referralCode: `XOSS${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };

      const mockToken = 'demo-token-new-user';

      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      await AsyncStorage.setItem('auth_token', mockToken);

      setUser(newUser);
      setIsAuthenticated(true);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true, user: newUser, token: mockToken };
    } catch (error) {
      console.error('Registration error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('auth_token');
      
      setUser(null);
      setIsAuthenticated(false);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: 'Update failed' };
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return parsedUser;
      }
      return null;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  };

  const value = {
    // State
    user,
    isLoading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    
    // Getters
    getUserLevel: () => user?.level || 1,
    getUserStats: () => ({
      matchesPlayed: user?.matchesPlayed || 0,
      matchesWon: user?.matchesWon || 0,
      winRate: user?.winRate || '0%',
      totalEarnings: user?.totalEarnings || 0
    })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
