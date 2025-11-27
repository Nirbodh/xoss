// context/AuthContext.js - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ ADD THIS FUNCTION - getToken
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Retrieved token:', token ? 'Found' : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  };

  // Load admin data from storage on app start
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const adminData = await AsyncStorage.getItem('admin_data');
        const token = await getToken(); // ✅ Use the function
        
        if (adminData && token) {
          const parsedAdmin = JSON.parse(adminData);
          setUser(parsedAdmin);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const adminUser = {
        id: 'admin123',
        name: 'Admin User',
        email: 'admin@xoss.com',
        role: 'admin'
      };
      const token = 'admin_temp_token_123';

      await AsyncStorage.setItem('admin_data', JSON.stringify(adminUser));
      await AsyncStorage.setItem('token', token);

      setUser(adminUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      
      return { success: true, user: adminUser, token };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('admin_data');
      await AsyncStorage.removeItem('token');
      
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getToken, // ✅ ADD THIS TO THE VALUE OBJECT
    updateProfile: async (updates) => {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('admin_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
