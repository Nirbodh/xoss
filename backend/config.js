// config.js - ALWAYS USE PRODUCTION API
import { Platform } from 'react-native';

// ✅ সরাসরি Production URL - কোনো Condition নেই
const PRODUCTION_URL = "https://xoss.onrender.com";

// ✅ Export URLs
export const BASE_URL = PRODUCTION_URL;
export const API_BASE_URL = `${PRODUCTION_URL}/api`;

// ✅ Log configuration
console.log('================================');
console.log('🎮 XOSS GAMING - PRODUCTION API');
console.log('================================');
console.log('🌐 Base URL:', BASE_URL);
console.log('🔌 API URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('⚡ API Source: Production (Always)');
console.log('✅ No Local IP - Using Production API Directly');
console.log('================================');

// ✅ Helper function for API calls
export const makeApiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 API Call: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('❌ API Error:', error);
    return {
      success: false,
      message: 'Network error',
      error: error.message,
    };
  }
};
