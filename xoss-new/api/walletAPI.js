// api/walletAPI.js - NEW FILE
import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/wallet`,
});

export const walletAPI = {
  getBalance: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.get('/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Wallet API getBalance error:', error);
      throw error;
    }
  },

  credit: async (amount, description, metadata = {}) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.post('/credit', {
        amount,
        description,
        metadata
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Wallet API credit error:', error);
      throw error;
    }
  },

  getTransactions: async (page = 1, limit = 20) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.get('/transactions', {
        params: { page, limit },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Wallet API transactions error:', error);
      throw error;
    }
  }
};
