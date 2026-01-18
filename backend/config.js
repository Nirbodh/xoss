// config.js - FIXED WITH INTEGRATED FORMATTER FUNCTIONS
import { Platform } from 'react-native';

// ✅ Production API URL
const PRODUCTION_URL = "https://xoss.onrender.com";

// ✅ Export URLs
export const BASE_URL = PRODUCTION_URL;
export const API_BASE_URL = `${PRODUCTION_URL}/api`;

// ✅ INTEGRATED FORMATTER FUNCTIONS
export const toBackendFormat = (frontendData) => {
  console.log('🔄 Converting frontend to backend format:', frontendData);
  
  const backendData = {
    // Game data
    game_uid: frontendData.gameUID || frontendData.game_uid,
    game_name: frontendData.gameName || frontendData.game_name,
    player_id: frontendData.playerId || frontendData.player_id || frontendData.userId,
    
    // Match data
    entry_fee: frontendData.entryFee || frontendData.entry_fee,
    total_prize: frontendData.totalPrize || frontendData.total_prize,
    max_participants: frontendData.maxParticipants || frontendData.max_participants,
    
    // Payment data
    amount: frontendData.amount,
    payment_method: frontendData.paymentMethod || frontendData.payment_method,
    
    // Account details for withdrawal
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

export const toFrontendFormat = (backendData) => {
  console.log('🔄 Converting backend to frontend format:', backendData);
  
  const frontendData = {
    // Game data
    gameUID: backendData.game_uid,
    gameName: backendData.game_name,
    playerId: backendData.player_id || backendData.user_id,
    
    // Match data
    entryFee: backendData.entry_fee,
    totalPrize: backendData.total_prize,
    maxParticipants: backendData.max_participants,
    currentParticipants: backendData.current_participants,
    
    // Room data
    roomId: backendData.room_id,
    roomPassword: backendData.room_password,
    
    // Wallet data
    balance: extractBalance(backendData),
    
    // Withdrawal data
    withdrawalNumber: backendData.withdrawal_number,
    paymentMethod: backendData.payment_method,
    accountDetails: backendData.account_details,
    status: backendData.status
  };
  
  console.log('✅ Frontend format:', frontendData);
  return frontendData;
};

export const extractBalance = (response) => {
  console.log('💰 Extracting balance from:', response);
  
  if (!response) return 0;
  
  // Try multiple possible fields
  const balanceSources = [
    response?.data?.user?.wallet_balance,
    response?.data?.wallet?.balance,
    response?.data?.balance,
    response?.balance,
    response?.user?.wallet_balance,
    response?.wallet?.balance
  ];
  
  for (const source of balanceSources) {
    if (source !== undefined && source !== null) {
      const balance = parseFloat(source);
      if (!isNaN(balance)) {
        console.log(`✅ Balance found: ${balance}`);
        return balance;
      }
    }
  }
  
  console.log('⚠️ No balance found, defaulting to 0');
  return 0;
};

export const formatJoinData = (gameUID, gameName, playerId) => {
  return toBackendFormat({
    gameUID,
    gameName,
    playerId
  });
};

export const formatWithdrawalData = (amount, paymentMethod, accountDetails, userNote) => {
  return toBackendFormat({
    amount,
    paymentMethod,
    accountDetails,
    userNote
  });
};

// ✅ API Endpoints (for reference)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  PROFILE: '/api/auth/me',
  
  // Wallet
  WALLET_BALANCE: '/api/wallet/balance',
  WALLET_TRANSACTIONS: '/api/wallet/transactions',
  WALLET_DEPOSIT: '/api/wallet/deposit',
  WALLET_TRANSFER: '/api/wallet/transfer',
  
  // Withdrawal
  WITHDRAWAL_REQUEST: '/api/withdrawal/request',
  WITHDRAWAL_HISTORY: '/api/withdrawal/history',
  WITHDRAWAL_STATS: '/api/withdrawal/stats',
  
  // Matches
  MATCHES: '/api/matches',
  JOIN_MATCH: (id) => `/api/matches/${id}/join`,
  JOIN_MATCH_WITH_PAYMENT: (id) => `/api/matches/${id}/join-with-payment`,
  
  // Tournaments
  TOURNAMENTS: '/api/tournaments',
  JOIN_TOURNAMENT: (id) => `/api/tournaments/${id}/join`,
  JOIN_TOURNAMENT_WITH_PAYMENT: (id) => `/api/tournaments/${id}/join-with-payment`,
};

console.log('================================');
console.log('🎮 XOSS GAMING - PRODUCTION');
console.log('================================');
console.log('🌐 Base URL:', BASE_URL);
console.log('🔌 API URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('✅ Formatter functions loaded');
console.log('================================');

// ✅ Helper for API calls
export const makeApiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 API Call: ${url}`, options.method || 'GET');
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    console.log(`📊 Response (${response.status}):`, data);
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      message: data.message || (response.ok ? 'Success' : 'Error')
    };
  } catch (error) {
    console.error('❌ API Error:', error);
    return {
      success: false,
      message: 'Network error: ' + error.message,
      error: error
    };
  }
};
