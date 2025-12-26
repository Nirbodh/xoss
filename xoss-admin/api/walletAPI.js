// api/walletAPI.js - COMPLETE UPDATED VERSION FOR USER & ADMIN
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your actual backend URL
const API_BASE_URL = 'https://xoss.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Helper to get token
const getToken = async () => {
  try {
    // Try user token first
    const userToken = await AsyncStorage.getItem('token');
    // Try admin token
    const adminToken = await AsyncStorage.getItem('adminToken');
    
    return userToken || adminToken || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const walletAPI = {
  // ==============================
  // ✅ USER FUNCTIONS
  // ==============================

  // Get wallet balance
  getBalance: async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

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
      const token = await getToken();
      if (!token) throw new Error('No token found');

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
  withdrawRequest: async (amount, payment_method, account_details, user_note = '', withdrawal_type = 'manual') => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      console.log('📤 Sending withdrawal request:', { 
        amount, 
        payment_method, 
        account_details,
        user_note,
        withdrawal_type
      });

      const response = await api.post('/api/withdraw/request', {
        amount: parseFloat(amount),
        payment_method,
        account_details,
        user_note,
        withdrawal_type
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
      const token = await getToken();
      if (!token) throw new Error('No token found');

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
      const token = await getToken();
      if (!token) throw new Error('No token found');

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
      const token = await getToken();
      if (!token) throw new Error('No token found');

      const balanceResponse = await walletAPI.getBalance();
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

  // ==============================
  // ✅ ADMIN FUNCTIONS
  // ==============================

  // Get pending withdrawals (ADMIN)
  getPendingWithdrawals: async (page = 1, limit = 20) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      const response = await api.get('/api/withdraw/admin/pending', {
        params: { page, limit },
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin pending withdrawals:', response.data?.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Admin pending withdrawals error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all withdrawals (ADMIN - HISTORY)
  getAdminWithdrawals: async (page = 1, limit = 50) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      const response = await api.get('/api/withdraw/admin/all', {
        params: { page, limit },
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Admin withdrawals history error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get withdrawal analytics (ADMIN)
  getWithdrawalAnalytics: async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      const response = await api.get('/api/withdraw/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Withdrawal analytics error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Approve withdrawal (ADMIN - MANUAL)
  approveWithdrawal: async (withdrawalId, transaction_id = '', admin_notes = '') => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      console.log('✅ Admin: Approving withdrawal:', withdrawalId);

      const response = await api.post(`/api/withdraw/admin/approve/${withdrawalId}`, {
        transaction_id,
        admin_notes
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin approval response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Admin approval error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Reject withdrawal (ADMIN)
  rejectWithdrawal: async (withdrawalId, admin_notes = '') => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      console.log('❌ Admin: Rejecting withdrawal:', withdrawalId);

      const response = await api.post(`/api/withdraw/admin/reject/${withdrawalId}`, {
        admin_notes
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin rejection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Admin rejection error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Toggle auto withdrawal system (ADMIN)
  toggleAutoWithdrawal: async (enabled) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      const response = await api.post('/api/withdraw/admin/toggle-auto', {
        enabled
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Toggle auto error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Process auto withdrawals (ADMIN)
  processAutoWithdrawals: async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token found');

      const response = await api.post('/api/withdraw/admin/process-auto', {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Process auto error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==============================
  // ✅ UTILITY FUNCTIONS
  // ==============================

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
