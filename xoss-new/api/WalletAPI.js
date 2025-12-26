// api/userWalletAPI.js - FOR USER APP ONLY
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Helper to get user token
const getUserToken = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    return userToken;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
};

export const userWalletAPI = {
  // Get wallet balance
  getBalance: async () => {
    try {
      const token = await getUserToken();
      if (!token) throw new Error('No user token found');

      const response = await api.get('/api/wallet', {
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
      const token = await getUserToken();
      if (!token) throw new Error('No user token found');

      const response = await api.get('/api/wallet/transactions', {
        params: { page, limit },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Wallet API transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Withdrawal request (USER)
  withdrawRequest: async (amount, payment_method, account_details, user_note = '') => {
    try {
      const token = await getUserToken();
      if (!token) throw new Error('No user token found');

      console.log('📤 Sending withdrawal request:', { 
        amount, 
        payment_method, 
        account_details,
        user_note 
      });

      const response = await api.post('/api/withdraw/request', {
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

  // Get withdrawal history (USER)
  getWithdrawalHistory: async (page = 1, limit = 20) => {
    try {
      const token = await getUserToken();
      if (!token) throw new Error('No user token found');

      const response = await api.get('/api/withdraw/history', {
        params: { page, limit },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Withdrawal history error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get withdrawal stats (USER)
  getWithdrawalStats: async () => {
    try {
      const token = await getUserToken();
      if (!token) throw new Error('No user token found');

      const response = await api.get('/api/withdraw/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Withdrawal stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Check withdrawal eligibility
  checkEligibility: async (amount) => {
    try {
      const token = await getUserToken();
      if (!token) throw new Error('No user token found');

      const balanceResponse = await userWalletAPI.getBalance();
      const balance = balanceResponse.data?.balance || 0;
      
      const minAmount = 100;
      const maxAmount = 25000;

      const errors = [];

      if (amount < minAmount) {
        errors.push(`Minimum withdrawal amount is ৳${minAmount}`);
      }

      if (amount > maxAmount) {
        errors.push(`Maximum withdrawal amount is ৳${maxAmount}`);
      }

      if (amount > balance) {
        errors.push('Insufficient balance');
      }

      return {
        eligible: errors.length === 0,
        errors,
        minAmount,
        maxAmount,
        currentBalance: balance
      };
    } catch (error) {
      console.error('Eligibility check error:', error);
      return {
        eligible: false,
        errors: ['Unable to check eligibility'],
        currentBalance: 0
      };
    }
  },

  // Test API connection
  testConnection: async () => {
    try {
      const response = await api.get('/api/withdraw/test');
      return response.data;
    } catch (error) {
      console.error('API connection test failed:', error);
      throw error;
    }
  }
};
