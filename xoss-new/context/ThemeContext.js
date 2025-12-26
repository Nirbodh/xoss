// context/ThemeContext.js - NEW FILE
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Available themes
  const themes = {
    light: {
      mode: 'light',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#f8f9fa',
        card: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        border: '#e0e0e0',
        success: '#4CAF50',
        error: '#ff4444',
        warning: '#FFA500',
        info: '#2196F3',
        placeholder: '#999999',
      },
      gradients: {
        primary: ['#667eea', '#764ba2'],
        success: ['#4CAF50', '#2E7D32'],
        warning: ['#FFA500', '#FF8A00'],
        error: ['#ff4444', '#d32f2f'],
      }
    },
    dark: {
      mode: 'dark',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#0a0c23',
        card: '#1a1f3d',
        text: '#ffffff',
        textSecondary: '#b0b8ff',
        border: '#2a2f4d',
        success: '#4CAF50',
        error: '#ff4444',
        warning: '#FFA500',
        info: '#2196F3',
        placeholder: '#666666',
      },
      gradients: {
        primary: ['#667eea', '#764ba2'],
        success: ['#4CAF50', '#2E7D32'],
        warning: ['#FFA500', '#FF8A00'],
        error: ['#ff4444', '#d32f2f'],
      }
    },
    system: {
      // Will be set based on system preference
    }
  };

  // Load saved theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme) {
          setTheme(savedTheme);
        } else {
          // Default to system theme
          setTheme('system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setTheme('system');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
  }, []);

  // Get current theme object
  const getCurrentTheme = () => {
    if (theme === 'system') {
      return themes[systemColorScheme] || themes.light;
    }
    return themes[theme] || themes.light;
  };

  // Change theme
  const changeTheme = async (newTheme) => {
    try {
      if (newTheme === 'system') {
        await AsyncStorage.removeItem('app_theme');
      } else {
        await AsyncStorage.setItem('app_theme', newTheme);
      }
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    if (theme === 'light') {
      changeTheme('dark');
    } else if (theme === 'dark') {
      changeTheme('system');
    } else {
      changeTheme('light');
    }
  };

  const value = {
    theme: getCurrentTheme(),
    themeMode: theme,
    isLoading,
    changeTheme,
    toggleTheme,
    availableThemes: ['light', 'dark', 'system']
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
