// context/AuthContext.js - EMERGENCY VERSION (যদি না থাকে)
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 'admin123',
    name: 'Admin User',
    email: 'admin@xoss.com',
    role: 'admin'
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsAuthenticated(true);
    return { success: true, user };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    return { success: true };
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile: async (updates) => {
      setUser(prev => ({ ...prev, ...updates }));
      return { success: true, user: { ...user, ...updates } };
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
