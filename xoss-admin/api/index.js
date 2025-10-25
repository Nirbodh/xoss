// admin - api/index.js (FINAL)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Render backend URL
const API_BASE_URL = 'https://xoss.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('xoss_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Token retrieval error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.log('API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      AsyncStorage.removeItem('xoss_token');
    }

    return Promise.reject(
      error.response?.data || {
        success: false,
        message: 'Network error occurred',
      }
    );
  }
);

// Auth API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (updates) => api.put('/auth/profile', updates),
};

// Users API methods
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, updates) => api.put(`/users/${id}`, updates),
  delete: (id) => api.delete(`/users/${id}`),
};

// Tournaments API methods
export const tournamentsAPI = {
  getAll: () => api.get('/tournaments'),
  create: (tournament) => api.post('/tournaments', tournament),
  update: (id, updates) => api.put(`/tournaments/${id}`, updates),
  delete: (id) => api.delete(`/tournaments/${id}`),
};

export default api;
