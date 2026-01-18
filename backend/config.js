// config.js - ENHANCED WITH MORE ENDPOINTS & UTILITIES
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
    player_id: frontendData.playerId || frontendData.player_id || frontendData.userId || frontendData.user_id,
    
    // Match/Tournament data
    entry_fee: frontendData.entryFee || frontendData.entry_fee,
    total_prize: frontendData.totalPrize || frontendData.total_prize,
    max_participants: frontendData.maxParticipants || frontendData.max_participants,
    current_participants: frontendData.currentParticipants || frontendData.current_participants,
    
    // Payment data
    amount: frontendData.amount,
    payment_method: frontendData.paymentMethod || frontendData.payment_method,
    transaction_id: frontendData.transactionId || frontendData.transaction_id,
    
    // Account details for withdrawal
    account_details: frontendData.accountDetails || frontendData.account_details,
    account_name: frontendData.accountName || frontendData.account_name,
    account_number: frontendData.accountNumber || frontendData.account_number,
    bank_name: frontendData.bankName || frontendData.bank_name,
    branch_name: frontendData.branchName || frontendData.branch_name,
    
    // User notes
    user_note: frontendData.userNote || frontendData.user_note,
    admin_note: frontendData.adminNote || frontendData.admin_note,
    
    // Event data
    title: frontendData.title,
    description: frontendData.description,
    game: frontendData.game,
    type: frontendData.type,
    schedule_time: frontendData.scheduleTime || frontendData.schedule_time,
    start_time: frontendData.startTime || frontendData.start_time,
    end_time: frontendData.endTime || frontendData.end_time,
    room_id: frontendData.roomId || frontendData.room_id,
    room_password: frontendData.roomPassword || frontendData.room_password,
    
    // User data
    name: frontendData.name,
    email: frontendData.email,
    phone: frontendData.phone,
    password: frontendData.password,
    
    // Filter data
    status: frontendData.status,
    approval_status: frontendData.approvalStatus || frontendData.approval_status,
    page: frontendData.page,
    limit: frontendData.limit
  };
  
  // Remove undefined/null/empty fields
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined || backendData[key] === null || backendData[key] === '') {
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
    
    // Match/Tournament data
    entryFee: backendData.entry_fee,
    totalPrize: backendData.total_prize,
    maxParticipants: backendData.max_participants,
    currentParticipants: backendData.current_participants,
    availableSlots: (backendData.max_participants || 0) - (backendData.current_participants || 0),
    
    // Room data
    roomId: backendData.room_id,
    roomPassword: backendData.room_password,
    
    // Wallet data
    balance: extractBalance(backendData),
    formattedBalance: formatCurrency(extractBalance(backendData)),
    
    // Withdrawal data
    withdrawalNumber: backendData.withdrawal_number,
    withdrawalId: backendData._id || backendData.id,
    paymentMethod: backendData.payment_method,
    accountDetails: backendData.account_details,
    status: backendData.status,
    formattedStatus: formatStatus(backendData.status),
    
    // Event data
    id: backendData._id || backendData.id,
    title: backendData.title,
    description: backendData.description,
    game: backendData.game,
    type: backendData.type,
    scheduleTime: backendData.schedule_time,
    startTime: backendData.start_time,
    endTime: backendData.end_time,
    isLive: isEventLive(backendData),
    isUpcoming: isEventUpcoming(backendData),
    isCompleted: isEventCompleted(backendData),
    status: backendData.status,
    approvalStatus: backendData.approval_status,
    
    // User data
    userId: backendData._id || backendData.user_id,
    userName: backendData.name || backendData.username,
    userEmail: backendData.email,
    userPhone: backendData.phone,
    userRole: backendData.role,
    userAvatar: backendData.avatar || backendData.profile_image,
    
    // Timestamps
    createdAt: backendData.createdAt,
    updatedAt: backendData.updatedAt,
    formattedDate: formatDate(backendData.createdAt || backendData.updatedAt),
    
    // Additional data
    participants: backendData.participants || [],
    participantsCount: backendData.participants?.length || 0,
    winners: backendData.winners || [],
    results: backendData.results || [],
    calculatedWinners: backendData.calculatedWinners || [],
    resultStatus: backendData.resultStatus || 'pending',
    prizeStatus: backendData.prizeStatus || 'pending'
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
    response?.wallet?.balance,
    response?.data?.data?.balance,
    response?.data?.wallet_balance
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

// ✅ NEW: Format currency
export const formatCurrency = (amount, currency = '৳') => {
  if (amount === undefined || amount === null) return `${currency}0.00`;
  const formatted = parseFloat(amount).toFixed(2);
  return `${currency}${formatted}`;
};

// ✅ NEW: Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ✅ NEW: Format status
export const formatStatus = (status) => {
  const statusMap = {
    'pending': '⏳ Pending',
    'approved': '✅ Approved',
    'rejected': '❌ Rejected',
    'completed': '🏁 Completed',
    'live': '🔴 Live',
    'upcoming': '📅 Upcoming',
    'cancelled': '🚫 Cancelled',
    'processing': '🔄 Processing',
    'success': '✅ Success',
    'failed': '❌ Failed'
  };
  return statusMap[status] || status;
};

// ✅ NEW: Check if event is live
export const isEventLive = (event) => {
  if (!event || !event.start_time || !event.end_time) return false;
  const now = new Date();
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  return now >= start && now <= end;
};

// ✅ NEW: Check if event is upcoming
export const isEventUpcoming = (event) => {
  if (!event || !event.start_time) return false;
  const now = new Date();
  const start = new Date(event.start_time);
  return now < start;
};

// ✅ NEW: Check if event is completed
export const isEventCompleted = (event) => {
  if (!event || !event.end_time) return false;
  const now = new Date();
  const end = new Date(event.end_time);
  return now > end;
};

export const formatJoinData = (gameUID, gameName, playerId) => {
  return toBackendFormat({
    gameUID,
    gameName,
    playerId
  });
};

export const formatWithdrawalData = (amount, paymentMethod, accountDetails, userNote = '') => {
  return toBackendFormat({
    amount,
    paymentMethod,
    accountDetails,
    userNote
  });
};

// ✅ NEW: Format deposit data
export const formatDepositData = (amount, method, transactionId = '') => {
  return toBackendFormat({
    amount,
    payment_method: method,
    transaction_id: transactionId
  });
};

// ✅ NEW: Format match/tournament creation data
export const formatEventData = (eventData) => {
  return toBackendFormat(eventData);
};

// ✅ NEW: Format user registration data
export const formatUserData = (name, email, password, phone = '') => {
  return toBackendFormat({
    name,
    email,
    password,
    phone
  });
};

// ✅ COMPLETE API ENDPOINTS (Updated with all endpoints)
export const API_ENDPOINTS = {
  // ============ AUTHENTICATION ============
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY: '/api/auth/verify'
  },
  
  // ============ USERS ============
  USERS: {
    BASE: '/api/users',
    GET_USER: (id) => `/api/users/${id}`,
    UPDATE_USER: (id) => `/api/users/${id}`,
    DELETE_USER: (id) => `/api/users/${id}`,
    USER_STATS: (id) => `/api/users/${id}/stats`,
    USER_FRIENDS: (id) => `/api/users/${id}/friends`,
    USER_MATCHES: (id) => `/api/users/${id}/matches`,
    USER_TOURNAMENTS: (id) => `/api/users/${id}/tournaments`
  },
  
  // ============ WALLET ============
  WALLET: {
    BALANCE: '/api/wallet/balance',
    TRANSACTIONS: '/api/wallet/transactions',
    DEPOSIT: '/api/wallet/deposit',
    WITHDRAW: '/api/wallet/withdraw',
    TRANSFER: '/api/wallet/transfer',
    HISTORY: '/api/wallet/history',
    STATS: '/api/wallet/stats'
  },
  
  // ============ DEPOSITS ============
  DEPOSITS: {
    BASE: '/api/deposits',
    CREATE: '/api/deposits',
    GET_DEPOSIT: (id) => `/api/deposits/${id}`,
    USER_DEPOSITS: (userId) => `/api/deposits/user/${userId}`,
    HISTORY: '/api/deposits/history',
    VERIFY: '/api/deposits/verify'
  },
  
  // ============ WITHDRAWALS ============
  WITHDRAWALS: {
    BASE: '/api/withdrawals',
    REQUEST: '/api/withdrawals',
    GET_WITHDRAWAL: (id) => `/api/withdrawals/${id}`,
    USER_WITHDRAWALS: (userId) => `/api/withdrawals/user/${userId}`,
    HISTORY: '/api/withdrawals/history',
    STATS: '/api/withdrawals/stats',
    PENDING: '/api/withdrawals/pending'
  },
  
  // ============ MATCHES ============
  MATCHES: {
    BASE: '/api/matches',
    GET_MATCH: (id) => `/api/matches/${id}`,
    CREATE: '/api/matches',
    UPDATE: (id) => `/api/matches/${id}`,
    DELETE: (id) => `/api/matches/${id}`,
    JOIN: (id) => `/api/matches/${id}/join`,
    JOIN_WITH_PAYMENT: (id) => `/api/matches/${id}/join-with-payment`,
    LEAVE: (id) => `/api/matches/${id}/leave`,
    PARTICIPANTS: (id) => `/api/matches/${id}/participants`,
    RESULTS: (id) => `/api/matches/${id}/results`,
    LIVE: '/api/matches/live',
    UPCOMING: '/api/matches/upcoming',
    COMPLETED: '/api/matches/completed'
  },
  
  // ============ TOURNAMENTS ============
  TOURNAMENTS: {
    BASE: '/api/tournaments',
    GET_TOURNAMENT: (id) => `/api/tournaments/${id}`,
    CREATE: '/api/tournaments',
    UPDATE: (id) => `/api/tournaments/${id}`,
    DELETE: (id) => `/api/tournaments/${id}`,
    JOIN: (id) => `/api/tournaments/${id}/join`,
    JOIN_WITH_PAYMENT: (id) => `/api/tournaments/${id}/join-with-payment`,
    LEAVE: (id) => `/api/tournaments/${id}/leave`,
    PARTICIPANTS: (id) => `/api/tournaments/${id}/participants`,
    RESULTS: (id) => `/api/tournaments/${id}/results`,
    LIVE: '/api/tournaments/live',
    UPCOMING: '/api/tournaments/upcoming',
    COMPLETED: '/api/tournaments/completed'
  },
  
  // ============ EVENTS (Combined) ============
  EVENTS: {
    BASE: '/api/events',
    GET_EVENT: (id) => `/api/events/${id}`,
    JOIN_EVENT: (id) => `/api/events/${id}/join`,
    UPCOMING: '/api/events/upcoming',
    LIVE: '/api/events/live',
    COMPLETED: '/api/events/completed',
    USER_EVENTS: (userId) => `/api/events/user/${userId}`
  },
  
  // ============ RESULTS ============
  RESULTS: {
    BASE: '/api/results',
    CREATE: '/api/results',
    GET_RESULT: (id) => `/api/results/${id}`,
    EVENT_RESULTS: (eventId) => `/api/results/event/${eventId}`,
    USER_RESULTS: (userId) => `/api/results/user/${userId}`,
    UPDATE: (id) => `/api/results/${id}`,
    VERIFY: (id) => `/api/results/${id}/verify`
  },
  
  // ============ LEADERBOARD ============
  LEADERBOARD: {
    BASE: '/api/leaderboard',
    GLOBAL: '/api/leaderboard/global',
    GAME: (game) => `/api/leaderboard/game/${game}`,
    WEEKLY: '/api/leaderboard/weekly',
    MONTHLY: '/api/leaderboard/monthly',
    ALL_TIME: '/api/leaderboard/all-time'
  },
  
  // ============ NOTIFICATIONS ============
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    UNREAD: '/api/notifications/unread',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    DELETE: (id) => `/api/notifications/${id}`
  },
  
  // ============ ADMIN ============
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    
    // Matches
    MATCHES_PENDING: '/api/admin/matches/pending',
    MATCH_APPROVE: (id) => `/api/admin/matches/approve/${id}`,
    MATCH_REJECT: (id) => `/api/admin/matches/reject/${id}`,
    
    // Tournaments
    TOURNAMENTS_PENDING: '/api/admin/tournaments/pending',
    TOURNAMENT_APPROVE: (id) => `/api/admin/tournaments/approve/${id}`,
    TOURNAMENT_REJECT: (id) => `/api/admin/tournaments/reject/${id}`,
    
    // Withdrawals
    WITHDRAWALS_PENDING: '/api/admin/withdrawals/pending',
    WITHDRAWAL_APPROVE: (id) => `/api/admin/withdrawals/approve/${id}`,
    WITHDRAWAL_REJECT: (id) => `/api/admin/withdrawals/reject/${id}`,
    
    // Deposits
    DEPOSITS_PENDING: '/api/admin/deposits/pending',
    DEPOSIT_APPROVE: (id) => `/api/admin/deposits/approve/${id}`,
    DEPOSIT_REJECT: (id) => `/api/admin/deposits/reject/${id}`,
    
    // Reports
    REPORTS: '/api/admin/reports',
    SYSTEM_STATS: '/api/admin/system-stats'
  },
  
  // ============ SYSTEM ============
  SYSTEM: {
    HEALTH: '/api/health',
    DB_STATUS: '/api/db-status',
    STATS: '/api/system/stats',
    BACKUP: '/api/system/backup',
    CLEANUP: '/api/system/cleanup',
    LOGS: '/api/system/logs',
    ENDPOINTS: '/api/endpoints',
    DOCS: '/api/docs'
  },
  
  // ============ UTILITY ============
  UTILITY: {
    TEST_ALL: '/api/test/all',
    MIGRATE: '/api/migrate/add-results-fields',
    TEST_COMPLETED_MATCH: '/api/test/completed-match',
    DIRECT_UPDATE: (eventId) => `/api/direct/update-results/${eventId}`,
    BULK_VERIFY: (eventId) => `/api/bulk/verify-results/${eventId}`
  }
};

// ✅ NEW: Get full URL
export const getFullUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// ✅ IMPROVED: Helper for API calls with better error handling
export const makeApiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn('⚠️ Non-JSON response:', text);
      data = { message: text };
    }
    
    console.log(`📊 Response (${response.status}):`, data);
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      message: data.message || (response.ok ? 'Success' : `Error ${response.status}`),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Network error details
    const errorDetails = {
      name: error.name,
      message: error.message,
      code: error.code,
      isNetworkError: !error.response
    };
    
    return {
      success: false,
      status: 0,
      message: 'Network error: ' + error.message,
      error: errorDetails,
      timestamp: new Date().toISOString()
    };
  }
};

// ✅ NEW: API call with token
export const makeAuthenticatedCall = async (endpoint, token, options = {}) => {
  return makeApiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};

// ✅ NEW: Batch API calls
export const makeBatchCalls = async (calls) => {
  console.log(`🔄 Making ${calls.length} batch API calls`);
  
  const results = await Promise.all(
    calls.map(async (call) => {
      try {
        return await makeApiCall(call.endpoint, call.options);
      } catch (error) {
        return {
          success: false,
          error: error.message,
          endpoint: call.endpoint
        };
      }
    })
  );
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Batch completed: ${successCount}/${calls.length} successful`);
  
  return {
    success: successCount === calls.length,
    results: results,
    stats: {
      total: calls.length,
      successful: successCount,
      failed: calls.length - successCount
    }
  };
};

// ✅ NEW: Validate API response
export const validateResponse = (response, expectedFields = []) => {
  if (!response || !response.success) {
    return {
      isValid: false,
      error: response?.message || 'Invalid response'
    };
  }
  
  if (expectedFields.length > 0) {
    const missingFields = expectedFields.filter(field => !response.data?.[field]);
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing fields: ${missingFields.join(', ')}`
      };
    }
  }
  
  return {
    isValid: true,
    data: response.data
  };
};

// ✅ NEW: API configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  DEBUG: true,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  VERSION: '3.0.0'
};

console.log('================================');
console.log('🎮 XOSS GAMING - ENHANCED PRODUCTION');
console.log('================================');
console.log('🌐 Base URL:', BASE_URL);
console.log('🔌 API URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('📊 API Version:', API_CONFIG.VERSION);
console.log('✅ Formatter functions loaded:', {
  toBackendFormat: true,
  toFrontendFormat: true,
  formatCurrency: true,
  formatDate: true,
  formatStatus: true,
  makeApiCall: true,
  makeAuthenticatedCall: true,
  makeBatchCalls: true
});
console.log('📋 Total endpoints:', Object.keys(API_ENDPOINTS).reduce((acc, category) => {
  const endpoints = API_ENDPOINTS[category];
  if (typeof endpoints === 'object') {
    return acc + Object.keys(endpoints).length;
  }
  return acc + 1;
}, 0));
console.log('================================');
