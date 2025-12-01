// api/tournamentsAPI.js - COMPLETE FIXED VERSION
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://xoss.onrender.com/api';
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ UNIFIED DATA MAPPING: Frontend → Backend
const mapToBackend = (frontendData) => ({
  // Basic info
  title: frontendData.title,
  game: frontendData.game,
  description: frontendData.description,
  rules: frontendData.rules,
  
  // Financial - ✅ CONSISTENT BACKEND FIELDS
  entry_fee: Number(frontendData.entryFee) || 0,
  total_prize: Number(frontendData.prizePool) || 0,
  per_kill: Number(frontendData.perKill) || 0,
  
  // Participants - ✅ CONSISTENT BACKEND FIELDS
  max_participants: Number(frontendData.maxPlayers) || 50,
  current_participants: Number(frontendData.currentPlayers) || 0,
  
  // Game settings
  type: frontendData.type || 'Solo',
  map: frontendData.map || 'Bermuda',
  match_type: frontendData.matchType || 'match',
  
  // Room info
  room_id: frontendData.roomId || '',
  room_password: frontendData.password || '',
  
  // Timing
  start_time: frontendData.startTime || frontendData.scheduleTime,
  end_time: frontendData.endTime,
  schedule_time: frontendData.scheduleTime,
  
  // Status
  status: frontendData.status || 'pending',
  approval_status: frontendData.approvalStatus || 'pending'
});

// ✅ UNIFIED DATA MAPPING: Backend → Frontend
const mapToFrontend = (backendData) => ({
  id: backendData._id || backendData.id,
  _id: backendData._id || backendData.id,
  
  // Basic info
  title: backendData.title,
  game: backendData.game,
  description: backendData.description,
  rules: backendData.rules,
  
  // Financial - ✅ CONSISTENT FRONTEND FIELDS
  prizePool: backendData.total_prize || backendData.prizePool || 0,
  entryFee: backendData.entry_fee || backendData.entryFee || 0,
  perKill: backendData.per_kill || backendData.perKill || 0,
  
  // Participants - ✅ CONSISTENT FRONTEND FIELDS
  maxPlayers: backendData.max_participants || backendData.maxPlayers || 50,
  currentPlayers: backendData.current_participants || backendData.currentPlayers || 0,
  maxParticipants: backendData.max_participants || backendData.maxPlayers || 50,
  currentParticipants: backendData.current_participants || backendData.currentPlayers || 0,
  
  // Game settings
  type: backendData.type,
  map: backendData.map,
  matchType: backendData.match_type || backendData.matchType || 'match',
  
  // Room info
  roomId: backendData.room_id || backendData.roomId,
  password: backendData.room_password || backendData.password,
  
  // Timing
  scheduleTime: backendData.schedule_time || backendData.scheduleTime,
  startTime: backendData.start_time || backendData.startTime,
  endTime: backendData.end_time || backendData.endTime,
  
  // Status
  status: backendData.status,
  approvalStatus: backendData.approval_status || backendData.approvalStatus,
  
  // Calculated fields
  spotsLeft: (backendData.max_participants || backendData.maxPlayers || 50) - 
            (backendData.current_participants || backendData.currentPlayers || 0),
  registered: backendData.registered || false
});

// ✅ FIXED: Request interceptor with proper token handling
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached to request:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No token found for request');
    }
    
    return config;
  } catch (error) {
    console.log('❌ Token interceptor error:', error);
    return config;
  }
});

// ✅ FIXED: Response interceptor to handle token errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔐 Token expired or invalid');
      try {
        await AsyncStorage.multiRemove(['user', 'token']);
      } catch (clearError) {
        console.log('❌ Error clearing auth data:', clearError);
      }
    }
    return Promise.reject(error);
  }
);

export const tournamentsAPI = {
  // ✅ GET all events (matches + tournaments) - REAL API CALL
  getAll: async () => {
    try {
      console.log('🔄 Fetching tournaments from backend...');
      const res = await axiosInstance.get('/combined');
      
      console.log('📥 Backend response:', res.data);
      
      if (res.data && res.data.success) {
        const unifiedData = res.data.data.map(item => mapToFrontend(item));
        console.log(`✅ Loaded ${unifiedData.length} events from backend`);
        return { 
          success: true, 
          data: unifiedData,
          count: unifiedData.length 
        };
      }
      return { success: false, message: 'Failed to fetch data from backend' };
    } catch (error) {
      console.log('❌ Fetch tournaments error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: 'Failed to fetch tournaments',
        error: error.response?.data?.message || error.message 
      };
    }
  },

  // ✅ CREATE event (match or tournament) - REAL API CALL
  create: async (payload) => {
    try {
      console.log('🎯 Creating event with payload:', payload);
      
      const backendData = mapToBackend(payload);
      const endpoint = payload.matchType === 'tournament' ? '/tournaments/create' : '/matches';
      
      console.log('📤 Sending to backend endpoint:', endpoint);
      console.log('📦 Backend data:', backendData);
      
      const res = await axiosInstance.post(endpoint, backendData);
      
      console.log('✅ Backend response:', res.data);
      console.log('✅ Event created successfully in database');
      return res.data;
    } catch (error) {
      console.log('❌ Create event error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: 'Failed to create event',
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  },

  // ✅ GET by ID
  getById: async (id) => {
    try {
      const res = await axiosInstance.get(`/matches/${id}`);
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
};

export default tournamentsAPI;
