// context/WalletContext.js - ENHANCED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(1250.75);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        AsyncStorage.getItem('wallet_balance'),
        AsyncStorage.getItem('wallet_transactions')
      ]);

      if (balanceData) {
        setBalance(parseFloat(balanceData));
      }

      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMoney = async (amount, method = 'Card', description = 'Deposit') => {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      const newBalance = balance + amount;
      const transaction = {
        id: `txn_${Date.now()}`,
        type: 'credit',
        amount,
        method,
        description,
        date: new Date().toISOString(),
        status: 'completed',
        balanceAfter: newBalance
      };

      setBalance(newBalance);
      setTransactions(prev => [transaction, ...prev]);

      await Promise.all([
        AsyncStorage.setItem('wallet_balance', newBalance.toString()),
        AsyncStorage.setItem('wallet_transactions', JSON.stringify([transaction, ...transactions]))
      ]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true, newBalance, transaction };
    } catch (error) {
      console.error('Add money error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  };

  const withdrawMoney = async (amount, method = 'Bank Transfer', description = 'Withdrawal') => {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      const newBalance = balance - amount;
      const transaction = {
        id: `txn_${Date.now()}`,
        type: 'debit',
        amount,
        method,
        description,
        date: new Date().toISOString(),
        status: 'pending', // Withdrawals are typically pending
        balanceAfter: newBalance
      };

      setBalance(newBalance);
      setTransactions(prev => [transaction, ...prev]);

      await Promise.all([
        AsyncStorage.setItem('wallet_balance', newBalance.toString()),
        AsyncStorage.setItem('wallet_transactions', JSON.stringify([transaction, ...transactions]))
      ]);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return { success: true, newBalance, transaction };
    } catch (error) {
      console.error('Withdraw money error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  };

  const makePayment = async (amount, recipient, description = 'Payment') => {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      const newBalance = balance - amount;
      const transaction = {
        id: `txn_${Date.now()}`,
        type: 'debit',
        amount,
        recipient,
        description,
        date: new Date().toISOString(),
        status: 'completed',
        balanceAfter: newBalance
      };

      setBalance(newBalance);
      setTransactions(prev => [transaction, ...prev]);

      await Promise.all([
        AsyncStorage.setItem('wallet_balance', newBalance.toString()),
        AsyncStorage.setItem('wallet_transactions', JSON.stringify([transaction, ...transactions]))
      ]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true, newBalance, transaction };
    } catch (error) {
      console.error('Payment error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  };

  const getTransactionHistory = async (limit = 50) => {
    try {
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  };

  const getTransactionStats = () => {
    const totalDeposits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDeposits,
      totalWithdrawals,
      netBalance: totalDeposits - totalWithdrawals,
      transactionCount: transactions.length
    };
  };

  const value = {
    // State
    balance,
    transactions,
    isLoading,
    
    // Actions
    addMoney,
    withdrawMoney,
    makePayment,
    getTransactionHistory,
    
    // Getters
    getTransactionStats,
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
