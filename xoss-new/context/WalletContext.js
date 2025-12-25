// context/WalletContext.js - COMPLETE FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

// ✅ API URL
const API_URL = 'https://xoss.onrender.com/api';

export function WalletProvider({ children }) {
  const { user, token, isAuthenticated, getUserId } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ REAL: Fetch wallet balance from server
  const fetchWalletBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      console.log('🔐 Not authenticated, loading from storage');
      await loadFromStorage();
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Fetching wallet balance from server...');
      
      // ✅ **FIXED: Correct endpoint - should be /wallet not /wallet/balance**
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
          
          // ✅ Save to AsyncStorage for offline access
          await AsyncStorage.setItem('wallet_balance', newBalance.toString());
          await AsyncStorage.setItem('wallet_data', JSON.stringify({
            balance: newBalance,
            lastUpdated: new Date().toISOString()
          }));
          
          console.log(`✅ Wallet balance updated: ${newBalance}`);
          setError(null);
        } else {
          console.log('❌ Invalid wallet data:', data);
          await loadFromStorage();
        }
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Wallet balance fetch error:', error);
      setError(error.message);
      await loadFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // ✅ REAL: Fetch transactions from server
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated || !token) {
      console.log('🔐 Not authenticated, skipping transactions');
      return;
    }
    
    try {
      console.log('🔄 Fetching transactions from server...');
      
      const response = await fetch(`${API_URL}/wallet/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.transactions) {
          // ✅ Format transactions properly
          const formattedTransactions = data.data.transactions.map(tx => ({
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
          
          // ✅ Save to AsyncStorage
          await AsyncStorage.setItem('wallet_transactions', JSON.stringify(formattedTransactions));
          await AsyncStorage.setItem('transactions_last_fetch', new Date().toISOString());
          
          console.log(`✅ Loaded ${formattedTransactions.length} transactions`);
        } else {
          console.log('❌ Invalid transactions data:', data);
          await loadTransactionsFromStorage();
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

  // ✅ Load wallet data from storage (offline)
  const loadFromStorage = async () => {
    try {
      const walletData = await AsyncStorage.getItem('wallet_data');
      if (walletData) {
        const parsedData = JSON.parse(walletData);
        setBalance(parseFloat(parsedData.balance) || 0);
      } else {
        const balanceData = await AsyncStorage.getItem('wallet_balance');
        if (balanceData) {
          setBalance(parseFloat(balanceData));
        }
      }
    } catch (error) {
      console.error('❌ Error loading local wallet:', error);
      setBalance(0);
    }
  };

  // ✅ Load transactions from storage
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

  // ✅ Refresh wallet (both balance and transactions)
  const refreshWallet = useCallback(async () => {
    console.log('🔄 Refreshing wallet data...');
    await fetchWalletBalance();
    await fetchTransactions();
  }, [fetchWalletBalance, fetchTransactions]);

  // ✅ Add transaction locally (for immediate UI update)
  const addTransaction = useCallback((newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update balance if needed
    if (newTransaction.amount) {
      setBalance(prev => {
        const newBalance = prev + parseFloat(newTransaction.amount);
        AsyncStorage.setItem('wallet_balance', newBalance.toString());
        return newBalance;
      });
    }
  }, []);

  // ✅ Initial load
  useEffect(() => {
    const initializeWallet = async () => {
      if (isAuthenticated && token) {
        await Promise.all([
          fetchWalletBalance(),
          fetchTransactions()
        ]);
      } else {
        await loadFromStorage();
        await loadTransactionsFromStorage();
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [isAuthenticated, token, fetchWalletBalance, fetchTransactions]);

  // ✅ Auto-refresh when auth changes
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshWallet();
    }
  }, [isAuthenticated, token, refreshWallet]);

  // ✅ Calculate recent transactions
  const getRecentTransactions = useCallback((count = 5) => {
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, count);
  }, [transactions]);

  // ✅ Check if user can afford
  const canAfford = useCallback((amount) => {
    return balance >= parseFloat(amount);
  }, [balance]);

  // ✅ Make payment/transfer
  const makePayment = useCallback(async (recipientId, amount, description = '') => {
    if (!token) {
      throw new Error('User not authenticated');
    }

    try {
      console.log(`💸 Making payment of ${amount} to ${recipientId}`);
      
      const response = await fetch(`${API_URL}/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          amount: parseFloat(amount),
          description: description || `Payment to user ${recipientId}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // ✅ Update local balance
          setBalance(result.newBalance || balance - amount);
          
          // ✅ Add transaction to local list
          const newTransaction = {
            id: result.transactionId || Math.random().toString(36).substr(2, 9),
            type: 'debit',
            amount: -parseFloat(amount),
            description: description || `Payment sent`,
            date: new Date(),
            status: 'completed',
            transactionId: result.transactionId || 'N/A',
            category: 'transfer',
            recipientId
          };
          
          addTransaction(newTransaction);
          
          console.log('✅ Payment successful');
          return {
            success: true,
            newBalance: result.newBalance,
            transactionId: result.transactionId
          };
        } else {
          throw new Error(result.message || 'Payment failed');
        }
      } else {
        throw new Error(`Payment failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      throw error;
    }
  }, [token, balance, addTransaction]);

  // ✅ Get wallet statistics
  const getWalletStats = useCallback(() => {
    const stats = {
      totalDeposit: 0,
      totalWithdraw: 0,
      totalWin: 0,
      totalEntry: 0,
      totalTransfer: 0,
      totalTransactions: transactions.length
    };

    transactions.forEach(tx => {
      if (tx.type === 'deposit' || tx.amount > 0) {
        stats.totalDeposit += Math.abs(tx.amount);
      } else if (tx.type === 'withdraw' || tx.amount < 0) {
        stats.totalWithdraw += Math.abs(tx.amount);
      } else if (tx.type === 'win') {
        stats.totalWin += tx.amount;
      } else if (tx.type === 'entry') {
        stats.totalEntry += Math.abs(tx.amount);
      } else if (tx.type === 'transfer') {
        stats.totalTransfer += Math.abs(tx.amount);
      }
    });

    return stats;
  }, [transactions]);

  const value = {
    balance,
    transactions,
    isLoading,
    error,
    refreshWallet,
    getRecentTransactions,
    canAfford,
    makePayment,
    getWalletStats,
    addTransaction
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
