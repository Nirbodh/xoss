// context/WalletContext.js - ENHANCED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { walletAPI } from '../api/walletAPI';
import * as Haptics from 'expo-haptics';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDeposit: 0,
    totalWithdraw: 0,
    totalWin: 0,
    totalEntry: 0,
    totalTransfer: 0
  });

  // ✅ Load cached data
  const loadCachedData = async () => {
    try {
      const cachedBalance = await AsyncStorage.getItem('wallet_balance');
      const cachedTransactions = await AsyncStorage.getItem('wallet_transactions');
      const cachedStats = await AsyncStorage.getItem('wallet_stats');
      const cachedLastUpdated = await AsyncStorage.getItem('wallet_last_updated');

      if (cachedBalance) {
        setBalance(parseFloat(cachedBalance));
      }
      if (cachedTransactions) {
        setTransactions(JSON.parse(cachedTransactions));
      }
      if (cachedStats) {
        setStats(JSON.parse(cachedStats));
      }
      if (cachedLastUpdated) {
        setLastUpdated(new Date(cachedLastUpdated));
      }
    } catch (error) {
      console.error('❌ Error loading cached data:', error);
    }
  };

  // ✅ Fetch wallet balance (optimized)
  const fetchWalletBalance = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated && !forceRefresh) {
      await loadCachedData();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Fetching wallet balance...');
      
      const response = await walletAPI.getBalance();
      
      if (response.success && response.data?.balance !== undefined) {
        const newBalance = parseFloat(response.data.balance);
        setBalance(newBalance);
        
        // Cache the balance
        await AsyncStorage.setItem('wallet_balance', newBalance.toString());
        await AsyncStorage.setItem('wallet_last_updated', new Date().toISOString());
        
        console.log(`✅ Balance updated: ${newBalance}`);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch balance');
      }
    } catch (error) {
      console.error('❌ Wallet balance fetch error:', error);
      setError(error.message);
      await loadCachedData();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // ✅ Fetch transactions (optimized)
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, using cached transactions');
      return;
    }
    
    try {
      console.log('🔄 Fetching transactions...');
      
      const response = await walletAPI.getTransactions();
      
      if (response.success && response.data?.transactions) {
        const formattedTransactions = response.data.transactions.map(tx => ({
          id: tx._id || tx.id || Math.random().toString(36).substr(2, 9),
          type: tx.type || (tx.amount > 0 ? 'credit' : 'debit'),
          amount: parseFloat(tx.amount) || 0,
          description: tx.description || tx.note || 'Transaction',
          date: new Date(tx.createdAt || tx.date || new Date()),
          status: tx.status || 'completed',
          transactionId: tx.transactionId || tx._id || 'N/A',
          category: tx.category || 'general',
          reference: tx.reference || ''
        }));
        
        setTransactions(formattedTransactions);
        
        // Cache transactions
        await AsyncStorage.setItem('wallet_transactions', JSON.stringify(formattedTransactions));
        
        console.log(`✅ Loaded ${formattedTransactions.length} transactions`);
      }
    } catch (error) {
      console.error('❌ Transactions fetch error:', error);
      await loadCachedData();
    }
  }, [isAuthenticated]);

  // ✅ Fetch withdrawal history
  const fetchWithdrawalHistory = useCallback(async () => {
    try {
      const response = await walletAPI.getWithdrawalHistory();
      if (response.success && response.data?.withdrawals) {
        setWithdrawals(response.data.withdrawals);
      }
    } catch (error) {
      console.error('❌ Withdrawal history fetch error:', error);
    }
  }, []);

  // ✅ Calculate statistics
  const calculateStats = useCallback((txList) => {
    const newStats = {
      totalDeposit: 0,
      totalWithdraw: 0,
      totalWin: 0,
      totalEntry: 0,
      totalTransfer: 0
    };

    txList.forEach(tx => {
      const amount = Math.abs(tx.amount);
      switch (tx.type) {
        case 'deposit':
        case 'credit':
          newStats.totalDeposit += amount;
          break;
        case 'withdraw':
        case 'debit':
          newStats.totalWithdraw += amount;
          break;
        case 'win':
          newStats.totalWin += amount;
          break;
        case 'entry':
          newStats.totalEntry += amount;
          break;
        case 'transfer':
          newStats.totalTransfer += amount;
          break;
      }
    });

    setStats(newStats);
    AsyncStorage.setItem('wallet_stats', JSON.stringify(newStats));
  }, []);

  // ✅ Refresh all wallet data
  const refreshWallet = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    console.log('🔄 Refreshing all wallet data...');
    setIsLoading(true);
    
    try {
      await Promise.all([
        fetchWalletBalance(true),
        fetchTransactions(),
        fetchWithdrawalHistory()
      ]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('❌ Wallet refresh error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWalletBalance, fetchTransactions, fetchWithdrawalHistory]);

  // ✅ Make a payment/transfer
  const makePayment = useCallback(async (recipientId, amount, description = '') => {
    try {
      if (!isAuthenticated) {
        throw new Error('Please login to make payments');
      }

      const parsedAmount = parseFloat(amount);
      if (parsedAmount > balance) {
        throw new Error('Insufficient balance');
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await walletAPI.transferMoney(
        recipientId, 
        parsedAmount, 
        description
      );

      if (response.success) {
        // Update balance immediately
        const newBalance = balance - parsedAmount;
        setBalance(newBalance);
        await AsyncStorage.setItem('wallet_balance', newBalance.toString());
        
        // Add transaction to list
        const newTransaction = {
          id: response.data?.transactionId || Math.random().toString(36).substr(2, 9),
          type: 'transfer',
          amount: -parsedAmount,
          description: description || `Payment to ${recipientId}`,
          date: new Date(),
          status: 'completed',
          transactionId: response.data?.transactionId,
          category: 'transfer',
          recipientId
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, newBalance, transaction: newTransaction };
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [balance, isAuthenticated]);

  // ✅ Request withdrawal
  const requestWithdrawal = useCallback(async (amount, paymentMethod, accountDetails, note = '') => {
    try {
      const parsedAmount = parseFloat(amount);
      if (parsedAmount > balance) {
        throw new Error('Insufficient balance');
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await walletAPI.withdrawRequest(
        parsedAmount,
        paymentMethod,
        accountDetails,
        note
      );

      if (response.success) {
        // Update balance
        const newBalance = balance - parsedAmount;
        setBalance(newBalance);
        await AsyncStorage.setItem('wallet_balance', newBalance.toString());
        
        // Add to withdrawal list
        const newWithdrawal = {
          id: response.data?.withdrawal?._id || Math.random().toString(36).substr(2, 9),
          amount: parsedAmount,
          payment_method: paymentMethod,
          account_details: accountDetails,
          status: 'pending',
          date: new Date(),
          note
        };
        
        setWithdrawals(prev => [newWithdrawal, ...prev]);
        
        // Add transaction
        const newTransaction = {
          id: newWithdrawal.id,
          type: 'withdraw',
          amount: -parsedAmount,
          description: `${paymentMethod.toUpperCase()} Withdrawal`,
          date: new Date(),
          status: 'pending',
          transactionId: newWithdrawal.id,
          category: 'withdrawal'
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, withdrawal: newWithdrawal, newBalance };
      } else {
        throw new Error(response.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [balance]);

  // ✅ Get recent transactions
  const getRecentTransactions = useCallback((count = 5) => {
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, count);
  }, [transactions]);

  // ✅ Check if user can afford an amount
  const canAfford = useCallback((amount) => {
    return balance >= parseFloat(amount);
  }, [balance]);

  // ✅ Get pending withdrawals
  const getPendingWithdrawals = useCallback(() => {
    return withdrawals.filter(w => w.status === 'pending');
  }, [withdrawals]);

  // Initialize wallet
  useEffect(() => {
    const initializeWallet = async () => {
      if (isAuthenticated) {
        await Promise.all([
          fetchWalletBalance(),
          fetchTransactions(),
          fetchWithdrawalHistory()
        ]);
      } else {
        await loadCachedData();
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [isAuthenticated, fetchWalletBalance, fetchTransactions, fetchWithdrawalHistory]);

  // Recalculate stats when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      calculateStats(transactions);
    }
  }, [transactions, calculateStats]);

  const value = {
    balance,
    transactions,
    withdrawals,
    isLoading,
    error,
    lastUpdated,
    stats,
    refreshWallet,
    fetchWalletBalance,
    fetchTransactions,
    fetchWithdrawalHistory,
    getRecentTransactions,
    canAfford,
    makePayment,
    requestWithdrawal,
    getPendingWithdrawals,
    clearCache: walletAPI.clearCache
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
