// context/AuthContext.js - COMPLETELY FIXED
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://xoss.onrender.com/api';
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        console.log('✅ User loaded from storage:', parsedUser.email);
      } else {
        console.log('❌ No user data found in storage');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('❌ Error loading auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with:', credentials.email);
      
      const response = await axiosInstance.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.success) {
        const { user: userData, token: userToken } = response.data;
        
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
      console.log('❌ Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration with:', userData.email);
      
      const response = await axiosInstance.post('/auth/register', {
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
      console.log('❌ Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');

      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.log('❌ Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

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
