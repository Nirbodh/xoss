// config.js - XOSS GAMING COMPLETE API CONFIG (REACT NATIVE)
import { Platform } from 'react-native';

// ✅ Production API URL
const PRODUCTION_URL = "https://xoss.onrender.com";

// ✅ Export URLs
export const BASE_URL = PRODUCTION_URL;
export const API_BASE_URL = `${PRODUCTION_URL}/api`;

// ✅ COMPLETE API ENDPOINTS (156 Endpoints)
export const API_ENDPOINTS = {
  // ============ AUTHENTICATION (12) ============
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY: '/api/auth/verify',
    UPDATE_PROFILE: '/api/auth/update-profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    RESEND_VERIFICATION: '/api/auth/resend-verification'
  },
  
  // ============ USERS (15) ============
  USERS: {
    BASE: '/api/users',
    GET_USER: (id) => `/api/users/${id}`,
    UPDATE_USER: (id) => `/api/users/${id}`,
    DELETE_USER: (id) => `/api/users/${id}`,
    USER_STATS: (id) => `/api/users/${id}/stats`,
    USER_FRIENDS: (id) => `/api/users/${id}/friends`,
    USER_MATCHES: (id) => `/api/users/${id}/matches`,
    USER_TOURNAMENTS: (id) => `/api/users/${id}/tournaments`,
    SEARCH_USERS: (query) => `/api/users/search/${query}`,
    TOP_EARNERS: '/api/users/top-earners',
    ONLINE_USERS: '/api/users/online',
    FOLLOW_USER: (id) => `/api/users/follow/${id}`,
    UNFOLLOW_USER: (id) => `/api/users/unfollow/${id}`,
    FOLLOWERS: (id) => `/api/users/${id}/followers`,
    FOLLOWING: (id) => `/api/users/${id}/following`
  },
  
  // ============ WALLET (15) ============
  WALLET: {
    BALANCE: '/api/wallet/balance',
    TRANSACTIONS: '/api/wallet/transactions',
    CREDIT: '/api/wallet/credit',
    DEBIT: '/api/wallet/debit',
    TRANSFER: '/api/wallet/transfer',
    HISTORY: '/api/wallet/history',
    STATS: '/api/wallet/stats',
    LOCK_BALANCE: '/api/wallet/lock-balance',
    UNLOCK_BALANCE: '/api/wallet/unlock-balance',
    LIMITS: '/api/wallet/limits',
    SETTINGS: '/api/wallet/settings',
    ADMIN_SUMMARY: '/api/wallet/admin/summary',
    ADMIN_TRANSACTIONS: '/api/wallet/admin/transactions',
    ADMIN_MANUAL_ADJUSTMENT: '/api/wallet/admin/manual-adjustment',
    ADMIN_USER_WALLET: (userId) => `/api/wallet/admin/user/${userId}`
  },
  
  // ============ DEPOSITS (8) ============
  DEPOSITS: {
    CREATE: '/api/deposits',
    GET_DEPOSIT: (id) => `/api/deposits/${id}`,
    USER_DEPOSITS: (userId) => `/api/deposits/user/${userId}`,
    HISTORY: '/api/deposits/history',
    VERIFY: '/api/deposits/verify',
    ADMIN_PENDING: '/api/deposits/admin/pending',
    ADMIN_APPROVE: (id) => `/api/deposits/admin/approve/${id}`,
    ADMIN_REJECT: (id) => `/api/deposits/admin/reject/${id}`
  },
  
  // ============ WITHDRAWALS (15) ============
  WITHDRAWALS: {
    REQUEST: '/api/withdrawals/request',
    HISTORY: '/api/withdrawals/history',
    STATS: '/api/withdrawals/stats',
    GET_BY_NUMBER: (number) => `/api/withdrawals/${number}`,
    CANCEL: (id) => `/api/withdrawals/cancel/${id}`,
    LIMITS: '/api/withdrawals/limits',
    METHODS: '/api/withdrawals/methods',
    ADMIN_PENDING: '/api/withdrawals/admin/pending',
    ADMIN_DETAILS: (id) => `/api/withdrawals/admin/details/${id}`,
    ADMIN_APPROVE: (id) => `/api/withdrawals/admin/approve/${id}`,
    ADMIN_REJECT: (id) => `/api/withdrawals/admin/reject/${id}`,
    ADMIN_UPDATE_STATUS: (id) => `/api/withdrawals/admin/status/${id}`,
    ADMIN_BULK_UPDATE: '/api/withdrawals/admin/bulk-update',
    ADMIN_EXPORT: '/api/withdrawals/admin/export',
    ADMIN_ANALYTICS: '/api/withdrawals/admin/analytics'
  },
  
  // ============ MATCHES (20) ============
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
    COMPLETED: '/api/matches/completed',
    FILTER: (filterType) => `/api/matches/filter/${filterType}`,
    UPDATE_STATUS: (id) => `/api/matches/${id}/status`,
    ADMIN_ALL: '/api/matches/admin/all',
    ADMIN_PENDING: '/api/matches/admin/pending',
    ADMIN_APPROVE: (id) => `/api/matches/admin/approve/${id}`,
    ADMIN_REJECT: (id) => `/api/matches/admin/reject/${id}`,
    DEBUG: '/api/matches/debug-collections'
  },
  
  // ============ TOURNAMENTS (16) ============
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
    COMPLETED: '/api/tournaments/completed',
    ADMIN_ALL: '/api/tournaments/admin/all',
    ADMIN_PENDING: '/api/tournaments/admin/pending',
    ADMIN_APPROVE: (id) => `/api/tournaments/admin/approve/${id}`,
    ADMIN_REJECT: (id) => `/api/tournaments/admin/reject/${id}`
  },
  
  // ============ EVENTS (10) ============
  EVENTS: {
    BASE: '/api/events',
    GET_EVENT: (id) => `/api/events/${id}`,
    CREATE: '/api/events',
    UPDATE: (id) => `/api/events/${id}`,
    DELETE: (id) => `/api/events/${id}`,
    JOIN_EVENT: (id) => `/api/events/${id}/join`,
    UPCOMING: '/api/events/upcoming',
    LIVE: '/api/events/live',
    COMPLETED: '/api/events/completed',
    USER_EVENTS: (userId) => `/api/events/user/${userId}`
  },
  
  // ============ RESULTS (7) ============
  RESULTS: {
    SUBMIT: (eventId) => `/api/results/submit/${eventId}`,
    CALCULATE_WINNERS: (eventId) => `/api/results/calculate-winners/${eventId}`,
    GET_EVENT_RESULTS: (eventId) => `/api/results/${eventId}`,
    VERIFY: (eventId, resultId) => `/api/results/verify/${eventId}/${resultId}`,
    BULK_VERIFY: (eventId) => `/api/results/bulk-verify/${eventId}`,
    EVENT_RESULTS: (eventId) => `/api/results/event/${eventId}`,
    USER_RESULTS: (userId) => `/api/results/user/${userId}`
  },
  
  // ============ LEADERBOARD (6) ============
  LEADERBOARD: {
    BASE: '/api/leaderboard',
    GLOBAL: '/api/leaderboard/global',
    GAME: (game) => `/api/leaderboard/game/${game}`,
    WEEKLY: '/api/leaderboard/weekly',
    MONTHLY: '/api/leaderboard/monthly',
    ALL_TIME: '/api/leaderboard/all-time'
  },
  
  // ============ PRIZES (7) ============
  PRIZES: {
    PENDING: '/api/prizes/pending',
    HISTORY: '/api/prizes/history',
    DISTRIBUTE: (eventId) => `/api/prizes/distribute/${eventId}`,
    MARK_PAID: (eventId, winnerId) => `/api/prizes/mark-paid/${eventId}/${winnerId}`,
    REFUND: (eventId) => `/api/prizes/refund/${eventId}`,
    CALCULATE: (eventId) => `/api/prizes/calculate/${eventId}`,
    TEST: '/api/prizes/test'
  },
  
  // ============ NOTIFICATIONS (7) ============
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    UNREAD: '/api/notifications/unread',
    CREATE: '/api/notifications',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    DELETE: (id) => `/api/notifications/${id}`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    PUSH: '/api/notifications/push'
  },
  
  // ============ ADMIN (25) ============
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
    SYSTEM_STATS: '/api/admin/system-stats',
    
    // User Management
    BAN_USER: (id) => `/api/admin/ban-user/${id}`,
    UNBAN_USER: (id) => `/api/admin/unban-user/${id}`,
    UPDATE_USER: (id) => `/api/admin/update-user/${id}`,
    
    // Analytics
    ACTIVITY_LOGS: '/api/admin/activity-logs',
    FINANCIAL_SUMMARY: '/api/admin/financial-summary',
    LEADERBOARD_STATS: '/api/admin/leaderboard-stats',
    USER_STATS: (id) => `/api/admin/user-stats/${id}`,
    
    // Notifications
    SEND_NOTIFICATION: '/api/admin/send-notification'
  },
  
  // ============ SYSTEM (9) ============
  SYSTEM: {
    HEALTH: '/api/health',
    DB_STATUS: '/api/db-status',
    STATS: '/api/system/stats',
    BACKUP: '/api/system/backup',
    CLEANUP: '/api/system/cleanup',
    LOGS: '/api/system/logs',
    DOCS: '/api/docs',
    ENDPOINTS: '/api/endpoints',
    TEST_ALL: '/api/test/all'
  },
  
  // ============ UTILITY (6) ============
  UTILITY: {
    STATUS: '/api/utility/status',
    VERSION: '/api/utility/version',
    TEST_ALL: '/api/test/all',
    MIGRATE: '/api/migrate/add-results-fields',
    TEST_COMPLETED_MATCH: '/api/test/completed-match',
    DIRECT_UPDATE: (eventId) => `/api/direct/update-results/${eventId}`
  }
};

// ✅ HELPER FUNCTIONS
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
    
    // Account details
    account_details: frontendData.accountDetails || frontendData.account_details,
    account_name: frontendData.accountName || frontendData.account_name,
    account_number: frontendData.accountNumber || frontendData.account_number,
    bank_name: frontendData.bankName || frontendData.bank_name,
    branch_name: frontendData.branchName || frontendData.branch_name,
    
    // Notes
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
    formattedDate: formatDate(backendData.createdAt || backendData.updatedAt)
  };
  
  console.log('✅ Frontend format:', frontendData);
  return frontendData;
};

// ✅ UTILITY FUNCTIONS
export const extractBalance = (response) => {
  if (!response) return 0;
  
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
        return balance;
      }
    }
  }
  
  return 0;
};

export const formatCurrency = (amount, currency = '৳') => {
  if (amount === undefined || amount === null) return `${currency}0.00`;
  const formatted = parseFloat(amount).toFixed(2);
  return `${currency}${formatted}`;
};

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

export const isEventLive = (event) => {
  if (!event || !event.start_time || !event.end_time) return false;
  const now = new Date();
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  return now >= start && now <= end;
};

export const isEventUpcoming = (event) => {
  if (!event || !event.start_time) return false;
  const now = new Date();
  const start = new Date(event.start_time);
  return now < start;
};

export const isEventCompleted = (event) => {
  if (!event || !event.end_time) return false;
  const now = new Date();
  const end = new Date(event.end_time);
  return now > end;
};

// ✅ API HELPERS
export const getFullUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

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
    
    return {
      success: false,
      status: 0,
      message: 'Network error: ' + error.message,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        isNetworkError: !error.response
      },
      timestamp: new Date().toISOString()
    };
  }
};

export const makeAuthenticatedCall = async (endpoint, token, options = {}) => {
  return makeApiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};

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

// ✅ CONFIGURATION
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  DEBUG: true,
  CACHE_DURATION: 5 * 60 * 1000,
  VERSION: '4.0.0'
};

// ✅ INITIAL LOG
console.log('================================');
console.log('🎮 XOSS GAMING - COMPLETE PRODUCTION');
console.log('================================');
console.log('🌐 Base URL:', BASE_URL);
console.log('🔌 API URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('📊 API Version:', API_CONFIG.VERSION);
console.log('📋 Total Endpoints: 156');
console.log('✅ All endpoints configured');
console.log('================================');
