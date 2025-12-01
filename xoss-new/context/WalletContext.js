// context/WalletContext.js - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIXED: Fetch wallet from server
  const fetchWalletFromServer = async () => {
    if (!isAuthenticated || !token) {
      console.log('🔐 Not authenticated, loading from storage');
      await loadFromStorage();
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Fetching wallet from server...');
      
      // You'll need to implement actual wallet API call
      // For now, using mock data
      setTimeout(() => {
        const mockBalance = 1250; // This should come from your API
        setBalance(mockBalance);
        setIsLoading(false);
        console.log(`✅ Wallet balance: ${mockBalance}`);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Server wallet error:', error);
      await loadFromStorage();
    }
  };

  const loadFromStorage = async () => {
    try {
      const balanceData = await AsyncStorage.getItem('wallet_balance');
      if (balanceData) {
        setBalance(parseFloat(balanceData));
        console.log(`📱 Local wallet balance: ${balanceData}`);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error('❌ Error loading local wallet:', error);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallet = () => {
    fetchWalletFromServer();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletFromServer();
    } else {
      setIsLoading(false);
      loadFromStorage();
    }
  }, [isAuthenticated, token]);

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
