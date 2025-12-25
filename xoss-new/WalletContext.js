// context/WalletContext.js - COMPLETE REAL-TIME FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const WalletContext = createContext();
const API_URL = 'https://xoss.onrender.com/api';

export function WalletProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // REAL-TIME: Polling interval for updates
  const POLLING_INTERVAL = 15000; // 15 seconds

  // FIXED: Fetch wallet balance with proper error handling
  const fetchWalletBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      console.log('🔐 Not authenticated, loading from storage');
      await loadCachedBalance();
      return;
    }
    
    try {
      console.log('🔄 Fetching wallet balance from server...');
      
      const response = await fetch(`${API_URL}/wallet`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.balance !== undefined) {
          const newBalance = parseFloat(data.data.balance);
          setBalance(newBalance);
          
          // Save to AsyncStorage
          await AsyncStorage.setItem('wallet_balance', newBalance.toString());
          await AsyncStorage.setItem('wallet_last_update', new Date().toISOString());
          
          console.log(`✅ Wallet balance updated: ৳${newBalance}`);
          setError(null);
          setLastUpdate(new Date());
        } else {
          console.log('❌ Invalid wallet data:', data);
          await loadCachedBalance();
        }
      } else {
        console.log(`❌ Wallet API failed: ${response.status}`);
        await loadCachedBalance();
      }
    } catch (error) {
      console.error('❌ Wallet balance fetch error:', error);
      setError(error.message);
      await loadCachedBalance();
    }
  }, [isAuthenticated, token]);

  // FIXED: Fetch transactions with real-time updates
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated || !token) {
      console.log('🔐 Not authenticated, skipping transactions');
      return;
    }
    
    try {
      console.log('🔄 Fetching transactions from server...');
      
      const response = await fetch(`${API_URL}/wallet/transactions?limit=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.transactions) {
          const formattedTransactions = data.data.transactions.map(tx => ({
            id: tx._id || tx.id,
            type: tx.type || 'deposit',
            amount: parseFloat(tx.amount) || 0,
            description: tx.description || 'Transaction',
            date: new Date(tx.createdAt || tx.date),
            status: tx.status || 'completed',
            transactionId: tx.reference_id || tx._id,
            method: tx.method || 'system'
          }));
          
          setTransactions(formattedTransactions);
          await AsyncStorage.setItem('wallet_transactions', JSON.stringify(formattedTransactions));
          
          console.log(`✅ Transactions loaded: ${formattedTransactions.length}`);
        }
      } else {
        console.log(`❌ Transactions API failed: ${response.status}`);
        await loadTransactionsFromStorage();
      }
    } catch (error) {
      console.error('❌ Transactions fetch error:', error);
      await loadTransactionsFromStorage();
    }
  }, [isAuthenticated, token]);

  // Load cached balance
  const loadCachedBalance = async () => {
    try {
      const cached = await AsyncStorage.getItem('wallet_balance');
      if (cached) {
        const balanceValue = parseFloat(cached) || 0;
        setBalance(balanceValue);
        console.log('📦 Loaded cached balance:', balanceValue);
      }
    } catch (error) {
      console.error('❌ Cache load error:', error);
    }
  };

  // Load transactions from storage
  const loadTransactionsFromStorage = async () => {
    try {
      const transactionsData = await AsyncStorage.getItem('wallet_transactions');
      if (transactionsData) {
        const parsedTransactions = JSON.parse(transactionsData);
        setTransactions(parsedTransactions);
      }
    } catch (error) {
      console.error('❌ Error loading local transactions:', error);
    }
  };

  // REAL-TIME: Force refresh wallet
  const refreshWallet = useCallback(async () => {
    console.log('🔄 Force refreshing wallet...');
    setIsLoading(true);
    
    try {
      await Promise.all([
        fetchWalletBalance(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWalletBalance, fetchTransactions]);

  // Add transaction locally
  const addTransaction = useCallback((newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    
    if (newTransaction.amount) {
      const amount = parseFloat(newTransaction.amount);
      setBalance(prev => {
        const newBalance = newTransaction.type === 'credit' || newTransaction.type === 'deposit'
          ? prev + amount 
          : prev - amount;
        
        AsyncStorage.setItem('wallet_balance', newBalance.toString());
        return newBalance;
      });
    }
  }, []);

  // Manually update balance
  const updateBalance = useCallback((newBalance) => {
    const balanceValue = parseFloat(newBalance) || 0;
    setBalance(balanceValue);
    AsyncStorage.setItem('wallet_balance', balanceValue.toString());
    console.log(`✅ Manual balance update: ৳${balanceValue}`);
  }, []);

  // Get recent transactions
  const getRecentTransactions = useCallback((limit = 5) => {
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }, [transactions]);

  // Check if user can afford
  const canAfford = useCallback((amount) => {
    return balance >= parseFloat(amount);
  }, [balance]);

  // Initial load
  useEffect(() => {
    const initializeWallet = async () => {
      if (isAuthenticated && token) {
        await Promise.all([
          fetchWalletBalance(),
          fetchTransactions()
        ]);
      } else {
        await loadCachedBalance();
        await loadTransactionsFromStorage();
      }
      setIsLoading(false);
    };

    initializeWallet();
  }, [isAuthenticated, token]);

  // REAL-TIME POLLING: Check for updates every 15 seconds
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    const intervalId = setInterval(() => {
      console.log('⏰ Auto-refreshing wallet...');
      fetchWalletBalance();
      fetchTransactions();
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, token, fetchWalletBalance, fetchTransactions]);

  const value = {
    balance,
    transactions,
    isLoading,
    error,
    lastUpdate,
    refreshWallet,
    updateBalance,
    addTransaction,
    getRecentTransactions,
    canAfford,
    fetchWalletBalance,
    fetchTransactions
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
