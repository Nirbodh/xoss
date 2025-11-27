// api/tournamentsAPI.js - ORIGINAL WORKING VERSION
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

axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const tournamentsAPI = {
  // ✅ GET all events (matches + tournaments)
  getAll: async () => {
    try {
      const res = await axiosInstance.get('/combined');
      
      if (res.data && res.data.success) {
        // Map all data to consistent frontend format
        const unifiedData = res.data.data.map(item => mapToFrontend(item));
        return { 
          success: true, 
          data: unifiedData,
          count: unifiedData.length 
        };
      }
      return { success: false, message: 'Failed to fetch data' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch tournaments' };
    }
  },

  // ✅ CREATE event (match or tournament)
  create: async (payload, token) => {
    try {
      const backendData = mapToBackend(payload);
      const endpoint = payload.matchType === 'tournament' ? '/tournaments/create' : '/matches';
      
      const res = await axiosInstance.post(endpoint, backendData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      return res.data;
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to create event',
        error: error.response?.data?.message || error.message 
      };
    }
  },

  // Other methods (getById, update, delete, join) with consistent mapping...
};

export default tournamentsAPI;
