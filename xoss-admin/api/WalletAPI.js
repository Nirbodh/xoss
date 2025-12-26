// api/adminWalletAPI.js - FOR ADMIN APP ONLY
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Helper to get admin token
const getAdminToken = async () => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    return adminToken;
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
};

export const adminWalletAPI = {
  // Get pending withdrawals (ADMIN)
  getPendingWithdrawals: async (page = 1, limit = 20) => {
    try {
      const token = await getAdminToken();
      if (!token) throw new Error('No admin token found');

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

  // Get withdrawal analytics (ADMIN)
  getWithdrawalAnalytics: async () => {
    try {
      const token = await getAdminToken();
      if (!token) throw new Error('No admin token found');

      const response = await api.get('/api/withdraw/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Withdrawal analytics error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Approve withdrawal (ADMIN)
  approveWithdrawal: async (withdrawalId, transaction_id = '', admin_notes = '') => {
    try {
      const token = await getAdminToken();
      if (!token) throw new Error('No admin token found');

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
      const token = await getAdminToken();
      if (!token) throw new Error('No admin token found');

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
