// api/walletAPI.js - COMPLETELY FIXED WITH INTEGRATED FORMATTER
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  API_BASE_URL, 
  extractBalance,
  formatWithdrawalData 
} from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  } catch (error) {
    console.error('🔑 Token error:', error);
    throw error;
  }
};

// Add token to all requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    return config;
  }
});

// ✅ INTERNAL FORMATTER FUNCTIONS
const toBackendFormat = (frontendData) => {
  console.log('🔄 Converting to backend format:', frontendData);
  
  const backendData = {
    game_uid: frontendData.gameUID || frontendData.game_uid,
    game_name: frontendData.gameName || frontendData.game_name,
    player_id: frontendData.playerId || frontendData.player_id,
    amount: frontendData.amount,
    payment_method: frontendData.paymentMethod || frontendData.payment_method,
    account_details: frontendData.accountDetails || frontendData.account_details,
    user_note: frontendData.userNote || frontendData.user_note
  };
  
  // Remove undefined fields
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined) {
      delete backendData[key];
    }
  });
  
  console.log('✅ Backend format:', backendData);
  return backendData;
};

export const walletAPI = {
  // ✅ GET WALLET BALANCE
  getBalance: async () => {
    try {
      console.log('💰 Fetching wallet balance...');
      
      const response = await api.get('/api/wallet/balance');
      console.log('📊 Balance response:', response.data);
      
      const balance = extractBalance(response.data);
      
      return {
        success: true,
        balance: balance,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Get balance error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        balance: 0,
        message: error.response?.data?.message || 'Failed to fetch balance'
      };
    }
  },

  // ✅ GET TRANSACTIONS
  getTransactions: async (page = 1, limit = 20) => {
    try {
      console.log('📋 Fetching transactions...');
      
      const response = await api.get('/api/wallet/transactions', {
        params: { page, limit }
      });
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('❌ Get transactions error:', error);
      
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch transactions'
      };
    }
  },

  // ✅ REQUEST WITHDRAWAL
  withdrawRequest: async (withdrawalData) => {
    try {
      console.log('💸 Withdrawal request:', withdrawalData);
      
      // Format data for backend
      const formattedData = toBackendFormat(withdrawalData);
      
      console.log('📤 Sending withdrawal:', formattedData);
      
      const response = await api.post('/api/withdrawal/request', formattedData);
      console.log('✅ Withdrawal response:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Withdrawal error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        message: error.response?.data?.message || 'Withdrawal request failed',
        error: error.response?.data
      };
    }
  },

  // ✅ GET WITHDRAWAL HISTORY
  getWithdrawalHistory: async (page = 1, limit = 20) => {
    try {
      console.log('📜 Fetching withdrawal history...');
      
      const response = await api.get('/api/withdrawal/history', {
        params: { page, limit }
      });
      
      return {
        success: true,
        data: response.data.data?.withdrawals || [],
        pagination: response.data.data?.pagination
      };
    } catch (error) {
      console.error('❌ Withdrawal history error:', error);
      
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch withdrawal history'
      };
    }
  },

  // ✅ GET WITHDRAWAL STATS
  getWithdrawalStats: async () => {
    try {
      console.log('📊 Fetching withdrawal stats...');
      
      const response = await api.get('/api/withdrawal/stats');
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Withdrawal stats error:', error);
      
      return {
        success: false,
        data: {},
        message: error.response?.data?.message || 'Failed to fetch withdrawal stats'
      };
    }
  },

  // ✅ DEPOSIT MONEY
  deposit: async (amount, method) => {
    try {
      console.log('💰 Deposit request:', { amount, method });
      
      const response = await api.post('/api/wallet/deposit', {
        amount: parseFloat(amount),
        method: method
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Deposit error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Deposit failed'
      };
    }
  },

  // ✅ TRANSFER MONEY
  transfer: async (recipientId, amount, description = '') => {
    try {
      console.log('💸 Transfer request:', { recipientId, amount });
      
      const response = await api.post('/api/wallet/transfer', {
        recipient_id: recipientId,
        amount: parseFloat(amount),
        description: description
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Transfer error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Transfer failed'
      };
    }
  },

  // ✅ CHECK ELIGIBILITY FOR WITHDRAWAL
  checkEligibility: async (amount) => {
    try {
      console.log('🔍 Checking eligibility for:', amount);
      
      const balanceResponse = await walletAPI.getBalance();
      const currentBalance = balanceResponse.balance || 0;
      const parsedAmount = parseFloat(amount);
      
      const errors = [];
      const minAmount = 100;
      const maxAmount = 50000;
      
      if (!amount || isNaN(parsedAmount)) {
        errors.push('Please enter a valid amount');
      } else if (parsedAmount < minAmount) {
        errors.push(`Minimum withdrawal is ৳${minAmount}`);
      } else if (parsedAmount > maxAmount) {
        errors.push(`Maximum withdrawal is ৳${maxAmount}`);
      }
      
      if (parsedAmount > currentBalance) {
        errors.push(`Insufficient balance. Available: ৳${currentBalance.toFixed(2)}`);
      }
      
      return {
        eligible: errors.length === 0,
        errors: errors,
        currentBalance: currentBalance,
        minAmount: minAmount,
        maxAmount: maxAmount
      };
    } catch (error) {
      console.error('❌ Eligibility check error:', error);
      
      return {
        eligible: false,
        errors: ['Eligibility check failed'],
        currentBalance: 0,
        minAmount: 100,
        maxAmount: 50000
      };
    }
  },

  // ✅ TEST API CONNECTION
  testConnection: async () => {
    try {
      console.log('🔌 Testing API connection...');
      
      const response = await api.get('/api/health');
      
      return {
        success: true,
        message: 'API connected successfully',
        data: response.data
      };
    } catch (error) {
      console.error('❌ API test failed:', error);
      
      return {
        success: false,
        message: 'Cannot connect to server'
      };
    }
  },

  // ✅ CLEAR CACHE
  clearCache: async () => {
    try {
      await AsyncStorage.removeItem('wallet_balance');
      await AsyncStorage.removeItem('wallet_transactions');
      await AsyncStorage.removeItem('wallet_last_updated');
      
      return {
        success: true,
        message: 'Cache cleared'
      };
    } catch (error) {
      console.error('❌ Clear cache error:', error);
      
      return {
        success: false,
        message: error.message
      };
    }
  },

  // ✅ FORMAT JOIN DATA (for matches/tournaments)
  formatJoinData: (gameUID, gameName, playerId) => {
    return toBackendFormat({
      gameUID,
      gameName,
      playerId
    });
  }
};
