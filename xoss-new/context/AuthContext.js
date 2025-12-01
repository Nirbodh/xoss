// context/AuthContext.js - COMPLETELY FIXED
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://xoss.onrender.com/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Check authentication status on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔄 Checking authentication state...');
      
      const userData = await AsyncStorage.getItem('user');
      const userToken = await AsyncStorage.getItem('token');
      
      if (userData && userToken) {
        const parsedUser = JSON.parse(userData);
        
        // ✅ Verify token is still valid by making a test API call
        try {
          const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          
          if (response.data.success) {
            setUser(parsedUser);
            setToken(userToken);
            setIsAuthenticated(true);
            console.log('✅ User authenticated from storage:', parsedUser.email);
          } else {
            // Token is invalid, clear storage
            await clearAuthData();
          }
        } catch (error) {
          console.log('❌ Token validation failed:', error.message);
          await clearAuthData();
        }
      } else {
        console.log('❌ No authentication data found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('❌ Error checking auth state:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log('❌ Error clearing auth data:', error);
    }
  };

  // ✅ FIXED: Login function with proper error handling
  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with:', credentials.email);
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.success) {
        const { user: userData, token: userToken } = response.data;
        
        // ✅ Store both user data and token
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', userToken);

        setUser(userData);
        setToken(userToken);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful');
        return { success: true, user: userData, token: userToken };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  // ✅ FIXED: Registration function
  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration with:', userData.email);
      
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone
      });

      if (response.data.success) {
        const { user: newUser, token: userToken } = response.data;
        
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        await AsyncStorage.setItem('token', userToken);

        setUser(newUser);
        setToken(userToken);
        setIsAuthenticated(true);
        
        console.log('✅ Registration successful');
        return { success: true, user: newUser, token: userToken };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  // ✅ FIXED: Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await clearAuthData();
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.log('❌ Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ Get user ID safely
  const getUserId = () => {
    return user?.id || user?._id || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        getUserId,
        login,
        register,
        logout,
        refreshAuth: checkAuthState // Add this to refresh auth state
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
