// context/WalletContext.js - COMPLETELY FIXED
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
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

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletFromServer = async () => {
    if (!user || !token) {
      await loadFromStorage();
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Fetching wallet from server...');
      
      const response = await axiosInstance.get('/wallet');
      
      if (response.data.success) {
        const walletData = response.data.data || response.data;
        setBalance(walletData.balance || walletData.wallet_balance || 0);
        
        await AsyncStorage.setItem('wallet_balance', (walletData.balance || 0).toString());
        console.log(`✅ Server wallet balance: ${walletData.balance}`);
      } else {
        console.error('❌ Server wallet fetch failed');
        await loadFromStorage();
      }
    } catch (error) {
      console.error('❌ Server wallet error:', error);
      await loadFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromStorage = async () => {
    try {
      const balanceData = await AsyncStorage.getItem('wallet_balance');
      if (balanceData) {
        setBalance(parseFloat(balanceData));
        console.log(`📱 Local wallet balance: ${balanceData}`);
      }
    } catch (error) {
      console.error('❌ Error loading local wallet:', error);
    }
  };

  const refreshWallet = () => {
    fetchWalletFromServer();
  };

  useEffect(() => {
    if (user && token) {
      fetchWalletFromServer();
    } else {
      setIsLoading(false);
      loadFromStorage();
    }
  }, [user, token]);

  const value = {
    balance,
    transactions,
    isLoading,
    refreshWallet,
    getRecentTransactions: (count = 5) => transactions.slice(0, count),
    canAfford: (amount) => balance >= amount
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
