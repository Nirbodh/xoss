// config.js - XOSS GAMING APP CONFIG
import { Platform } from 'react-native';

// ✅ Smart URL Detection
const getBaseUrl = () => {
  // Always use production URL
  const PROD_URL = "https://xoss.onrender.com/api";
  
  // Development mode - also use production for testing
  if (__DEV__) {
    console.log('🔧 Development mode - Using production API');
    return PROD_URL;
  }

  // Production mode
  console.log('🚀 Production mode');
  return PROD_URL;
};

// Export BASE_URL
export const BASE_URL = getBaseUrl();
export const API_BASE_URL = BASE_URL;

// ✅ Environment detection helper
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// ✅ API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  LOGOUT: `${BASE_URL}/auth/logout`,
  PROFILE: `${BASE_URL}/auth/me`,
  
  // User
  USER_DASHBOARD: (userId) => `${BASE_URL}/users/${userId}/dashboard`,
  USER_PROFILE: (userId) => `${BASE_URL}/users/${userId}`,
  
  // Events
  ALL_EVENTS: `${BASE_URL}/events`,
  ACTIVE_EVENTS: `${BASE_URL}/events?status=active`,
  UPCOMING_EVENTS: `${BASE_URL}/events?status=upcoming`,
  
  // Matches
  MATCHES: `${BASE_URL}/matches`,
  JOIN_MATCH: (matchId) => `${BASE_URL}/matches/${matchId}/join`,
  
  // Tournaments
  TOURNAMENTS: `${BASE_URL}/tournaments`,
  REGISTER_TOURNAMENT: (tournamentId) => `${BASE_URL}/tournaments/${tournamentId}/register`,
  
  // Wallet & Payments
  WALLET_BALANCE: (userId) => `${BASE_URL}/wallet/balance/${userId}`,
  DEPOSIT: `${BASE_URL}/deposits`,
  WITHDRAW_REQUEST: `${BASE_URL}/withdraw/request`,
  TRANSACTION_HISTORY: (userId) => `${BASE_URL}/transactions/${userId}`,
  
  // Leaderboard
  LEADERBOARD: `${BASE_URL}/leaderboard`,
  WEEKLY_LEADERBOARD: `${BASE_URL}/leaderboard?type=weekly`,
  
  // Notifications
  NOTIFICATIONS: (userId) => `${BASE_URL}/notifications/${userId}`,
  
  // Referrals
  REFERRALS: (userId) => `${BASE_URL}/referrals/${userId}`,
  
  // Support
  SUPPORT_TICKET: `${BASE_URL}/support/ticket`,
  
  // System
  HEALTH: `${BASE_URL}/health`,
  DB_STATUS: `${BASE_URL}/db-status`,
  SYSTEM_STATS: `${BASE_URL}/system/stats`,
  
  // Games
  GAME_STATS: `${BASE_URL}/games/stats`,
};

// ✅ Game Types
export const GAME_TYPES = {
  FREEFIRE: 'freefire',
  PUBG: 'pubg',
  COD: 'cod',
  VALORANT: 'valorant',
  BGMI: 'bgmi'
};

// ✅ Match Types
export const MATCH_TYPES = {
  SOLO: 'Solo',
  DUO: 'Duo',
  SQUAD: 'Squad',
  CUSTOM: 'Custom'
};

// ✅ Payment Methods
export const PAYMENT_METHODS = {
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  BANK: 'bank'
};

// ✅ Transaction Types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  MATCH_ENTRY: 'match_entry',
  TOURNAMENT_ENTRY: 'tournament_entry',
  WINNING: 'winning',
  BONUS: 'bonus',
  REFUND: 'refund',
  REFERRAL: 'referral'
};

// ✅ Status Types
export const STATUS_TYPES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  CANCELLED: 'cancelled'
};

// ✅ Log the selected URL
console.log('🌐 Selected BASE_URL:', BASE_URL);
console.log('📱 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🎮 XOSS Gaming App Config Loaded');
