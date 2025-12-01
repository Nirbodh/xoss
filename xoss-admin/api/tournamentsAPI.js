// api/tournamentsAPI.js - FIXED URL AND TOKEN
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config'; // ✅ Import Config

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// ✅ AUTH INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    try {
      // ✅ FIX: Changed 'auth_token' to 'token'
      const token = await AsyncStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Token Error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const tournamentsAPI = {
  // ✅ GET ALL
  getAll: async () => {
    try {
      // Trying combined endpoint first
      const res = await api.get('/combined');
      if (res.data && res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: 'Failed to fetch data' };
    } catch (error) {
      // Fallback
      try {
        console.log("🔄 Fallback to /tournaments endpoint");
        const res = await api.get('/tournaments');
        return { success: true, data: res.data.tournaments || [] };
      } catch (e) {
        return { success: false, message: 'Network error connecting to ' + BASE_URL };
      }
    }
  },

  // ✅ CREATE
  create: async (payload) => {
    try {
      // Determine endpoint based on matchType
      const endpoint = payload.matchType === 'tournament' ? '/tournaments/create' : '/matches';
      const res = await api.post(endpoint, payload);
      return res.data;
    } catch (error) {
      console.error("Create API Error:", error.response?.data || error.message);
      return { 
        success: false, 
        message: 'Failed to create event', 
        error: error.response?.data?.message || error.message 
      };
    }
  },

  // ✅ JOIN
  join: async (id) => {
    try {
      const res = await api.post(`/tournaments/${id}/join`);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ✅ UPDATE
  update: async (id, data) => {
    try {
      const res = await api.put(`/tournaments/${id}`, data);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ✅ DELETE
  delete: async (id) => {
    try {
      const res = await api.delete(`/tournaments/${id}`);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
};

export default tournamentsAPI;
