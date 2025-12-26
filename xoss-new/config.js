// config.js - ENHANCED VERSION
import { Platform } from 'react-native';

// ✅ Smart Environment Detection
const getEnvironment = () => {
  if (__DEV__) {
    return 'development';
  }
  
  // Production environment detection
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return 'production';
  }
  
  return 'development';
};

// ✅ URL Configuration
const ENVIRONMENTS = {
  development: {
    BASE_URL: "http://192.168.0.100:5000/api",
    WS_URL: "ws://192.168.0.100:5000",
    NAME: "Development",
    DEBUG: true
  },
  production: {
    BASE_URL: "https://xoss.onrender.com/api",
    WS_URL: "wss://xoss.onrender.com",
    NAME: "Production",
    DEBUG: false
  },
  staging: {
    BASE_URL: "https://staging.xoss.onrender.com/api",
    WS_URL: "wss://staging.xoss.onrender.com",
    NAME: "Staging",
    DEBUG: true
  }
};

// Get current environment
const currentEnv = getEnvironment();
const config = ENVIRONMENTS[currentEnv] || ENVIRONMENTS.development;

// Export configuration
export const BASE_URL = config.BASE_URL;
export const API_BASE_URL = BASE_URL;
export const WS_URL = config.WS_URL;
export const ENVIRONMENT = currentEnv;
export const IS_DEBUG = config.DEBUG;
export const IS_DEVELOPMENT = currentEnv === 'development';
export const IS_PRODUCTION = currentEnv === 'production';

// ✅ API Endpoints (for reference)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  
  // Wallet
  WALLET_BALANCE: '/wallet',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  WALLET_TRANSFER: '/wallet/transfer',
  
  // Withdrawal
  WITHDRAW_REQUEST: '/withdraw/request',
  WITHDRAW_HISTORY: '/withdraw/history',
  WITHDRAW_STATS: '/withdraw/stats',
  
  // Deposit
  DEPOSIT_CREATE: '/deposit/create',
  DEPOSIT_HISTORY: '/deposit/history',
  
  // System
  HEALTH: '/health',
  SETTINGS: '/settings'
};

// ✅ Log configuration
console.log('🌐 Environment Configuration:');
console.log(`   Environment: ${config.NAME}`);
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   WebSocket URL: ${WS_URL}`);
console.log(`   Debug Mode: ${IS_DEBUG}`);
console.log(`   Platform: ${Platform.OS} ${Platform.Version}`);

// ✅ Helper functions
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('/')) {
    return `${BASE_URL}${endpoint}`;
  }
  return `${BASE_URL}/${endpoint}`;
};

export const getWsUrl = (path = '') => {
  if (path.startsWith('/')) {
    return `${WS_URL}${path}`;
  }
  return `${WS_URL}/${path}`;
};

// ✅ Check server connectivity
export const checkServerConnectivity = async () => {
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    if (response.ok) {
      return {
        connected: true,
        message: 'Server is reachable',
        response: await response.json()
      };
    } else {
      return {
        connected: false,
        message: `Server responded with ${response.status}`,
        response: null
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: error.message || 'Cannot connect to server',
      response: null
    };
  }
};
