// context/AuthContext.js - COMPLETE AUTH SYSTEM
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { setAuthToken, clearAuthToken } from '../api/matchesAPI';
import { setTournamentToken, clearTournamentToken } from '../api/tournamentsAPI';

const BASE_URL = 'https://xoss.onrender.com/api';
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ FIXED: Token interceptor
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ AuthContext: Token attached to request');
    }
  } catch (error) {
    console.log('❌ Token interceptor error:', error);
  }
  return config;
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔄 Loading user from storage...');
      const userData = await AsyncStorage.getItem('user');
      const userToken = await AsyncStorage.getItem('token');
      
      if (userData && userToken) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setToken(userToken);
        setIsAuthenticated(true);
        
        // ✅ CRITICAL: Set token in all API modules
        setAuthToken(userToken);
        setTournamentToken(userToken);
        
        console.log('✅ User loaded from storage:', parsedUser.email);
      } else {
        console.log('❌ No user data found in storage');
        setIsAuthenticated(false);
        clearAuthToken();
        clearTournamentToken();
      }
    } catch (error) {
      console.log('❌ Error loading auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ REGISTER FUNCTION
  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration with:', userData.email);
      
      const response = await axiosInstance.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone
      });

      console.log('📥 Registration response:', response.data);

      if (response.data && response.data.success) {
        const { user: newUser, token: userToken } = response.data;
        
        // Save to storage
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        await AsyncStorage.setItem('token', userToken);

        // Update state
        setUser(newUser);
        setToken(userToken);
        setIsAuthenticated(true);
        
        // Set token in all API modules
        setAuthToken(userToken);
        setTournamentToken(userToken);
        
        console.log('✅ Registration successful');
        return { 
          success: true, 
          message: 'Registration successful!',
          user: newUser, 
          token: userToken 
        };
      } else {
        return { 
          success: false, 
          error: response.data?.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  // ✅ LOGIN FUNCTION
  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with:', credentials.email);
      
      const response = await axiosInstance.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      console.log('📥 Login response:', response.data);

      if (response.data && response.data.success) {
        const { user: userData, token: userToken } = response.data;
        
        // Save to storage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', userToken);

        // Update state
        setUser(userData);
        setToken(userToken);
        setIsAuthenticated(true);
        
        // ✅ CRITICAL: Set token in all API modules
        setAuthToken(userToken);
        setTournamentToken(userToken);
        
        console.log('✅ Login successful, token synced');
        return { 
          success: true, 
          message: 'Login successful!',
          user: userData, 
          token: userToken 
        };
      } else {
        return { 
          success: false, 
          error: response.data?.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  // ✅ LOGOUT FUNCTION
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');

      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      // Clear token from all API modules
      clearAuthToken();
      clearTournamentToken();
      
      console.log('✅ Logout successful, tokens cleared');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.log('❌ Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ GET USER INFO
  const getUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await axiosInstance.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        const userData = response.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      } else {
        return { success: false, error: response.data?.message };
      }
    } catch (error) {
      console.log('❌ Get user info failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  // ✅ REFRESH TOKEN
  const refreshToken = async () => {
    try {
      const userToken = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      console.log('🔄 Token refresh check:', {
        hasToken: !!userToken,
        hasUserData: !!userData
      });
      
      if (userToken && userData) {
        setToken(userToken);
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        
        // Update token in all API modules
        setAuthToken(userToken);
        setTournamentToken(userToken);
        
        console.log('✅ Token refreshed and synced');
        return true;
      }
      
      clearAuthToken();
      clearTournamentToken();
      return false;
    } catch (error) {
      console.log('❌ Error refreshing token:', error);
      return false;
    }
  };

  // ✅ GET CURRENT TOKEN
  const getCurrentToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.log('❌ Error getting current token:', error);
      return null;
    }
  };

  // ✅ CHECK TOKEN VALIDITY
  const checkTokenValidity = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { valid: false, message: 'No token found' };
      }

      const response = await axiosInstance.get('/auth/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return { 
        valid: response.data?.success || false, 
        message: response.data?.message 
      };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        register,
        login,
        logout,
        getUserInfo,
        refreshToken,
        getCurrentToken,
        checkTokenValidity,
        checkAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
