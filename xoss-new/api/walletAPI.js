// api/walletAPI.js - COMPLETE FIXED VERSION
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// ✅ Create optimized axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ✅ Smart Token Manager
const getToken = async () => {
  try {
    // First try user token
    const token = await AsyncStorage.getItem('token');
    if (token) return token;
    
    // Try other possible token keys
    const tokenKeys = ['userToken', 'authToken', 'accessToken'];
    for (const key of tokenKeys) {
      const foundToken = await AsyncStorage.getItem(key);
      if (foundToken) return foundToken;
    }
    
    throw new Error('No token found');
  } catch (error) {
    console.error('🔑 Token error:', error);
    throw error;
  }
};

export const walletAPI = {
  // ==============================
  // ✅ WALLET FUNCTIONS
  // ==============================

  // Get wallet balance
  getBalance: async () => {
    try {
      const token = await getToken();
      
      const response = await api.get('/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Wallet API getBalance error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get transactions
  getTransactions: async (page = 1, limit = 20) => {
    try {
      const token = await getToken();

      const response = await api.get('/wallet/transactions', {
        params: { page, limit },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Wallet API transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==============================
  // ✅ WITHDRAWAL FUNCTIONS (USER)
  // ==============================

  // Withdrawal request
  withdrawRequest: async (amount, payment_method, account_details, user_note = '') => {
    try {
      const token = await getToken();

      console.log('📤 Sending withdrawal request:', { 
        amount, 
        payment_method, 
        account_details 
      });

      const response = await api.post('/withdraw/request', {
        amount: parseFloat(amount),
        payment_method,
        account_details,
        user_note
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Withdrawal response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Withdrawal request error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get withdrawal history
  getWithdrawalHistory: async (page = 1, limit = 20) => {
    try {
      const token = await getToken();

      const response = await api.get('/withdraw/history', {
        params: { page, limit },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Withdrawal history error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get withdrawal stats
  getWithdrawalStats: async () => {
    try {
      const token = await getToken();

      const response = await api.get('/withdraw/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Withdrawal stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==============================
  // ✅ ELIGIBILITY CHECK
  // ==============================

  checkEligibility: async (amount) => {
    try {
      const token = await getToken();
      if (!token) {
        return {
          eligible: false,
          errors: ['Please login first'],
          currentBalance: 0
        };
      }

      // First get balance
      let balance = 0;
      try {
        const balanceResponse = await walletAPI.getBalance();
        balance = balanceResponse.data?.balance || 0;
      } catch (error) {
        console.error('Balance check failed:', error);
        balance = 0;
      }

      const minAmount = 100;
      const maxAmount = 25000;

      const errors = [];

      if (!amount || isNaN(amount)) {
        errors.push('Please enter a valid amount');
      } else if (amount < minAmount) {
        errors.push(`Minimum withdrawal amount is ৳${minAmount}`);
      } else if (amount > maxAmount) {
        errors.push(`Maximum withdrawal amount is ৳${maxAmount}`);
      }

      if (amount > balance) {
        errors.push(`Insufficient balance. Available: ৳${balance}`);
      }

      return {
        eligible: errors.length === 0,
        errors,
        minAmount,
        maxAmount,
        currentBalance: balance,
        canProceed: amount >= minAmount && amount <= maxAmount && amount <= balance
      };
    } catch (error) {
      console.error('Eligibility check error:', error);
      return {
        eligible: false,
        errors: ['Unable to check eligibility. Please try again.'],
        currentBalance: 0
      };
    }
  },

  // ==============================
  // ✅ TEST CONNECTION
  // ==============================

  testConnection: async () => {
    try {
      const response = await api.get('/withdraw/test');
      return response.data;
    } catch (error) {
      console.error('API connection test failed:', error);
      
      // Try alternative endpoints
      const endpoints = ['/health', '/api/health', '/'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          return {
            success: true,
            message: `Connected via ${endpoint}`,
            data: response.data
          };
        } catch (e) {
          continue;
        }
      }
      
      throw new Error('Cannot connect to server');
    }
  }
};
