// config.js - XOSS GAMING FINAL CONFIG (Render Only)
import { Platform } from 'react-native';

// ✅ Always use Render Production Server
const RENDER_SERVER_URL = "https://xoss.onrender.com";

// ✅ Simple and reliable URL setup
const getBaseUrl = () => {
  console.log('🚀 Using Render Production Server: ' + RENDER_SERVER_URL);
  return RENDER_SERVER_URL;
};

// ✅ Export URLs
export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`;

// ✅ Environment helpers
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;
export const isUsingRenderServer = true;

// ✅ Log configuration
console.log('================================');
console.log('🎮 XOSS GAMING - CLIENT CONFIG');
console.log('================================');
console.log('🌐 Base URL:', BASE_URL);
console.log('🔌 API URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('⚡ Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🏢 Server: Render (Production)');
console.log('✅ Expo Go: Fully Compatible');
console.log('================================');
