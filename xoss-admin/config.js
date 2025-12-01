// config.js - COMPLETELY FIXED
import { Platform } from 'react-native';

// ✅ Smart URL Detection
const getBaseUrl = () => {
  // Development URLs
  const LOCAL_URL = "http://192.168.0.200:5000/api";
  const LOCAL_ALT = "http://192.168.0.100:5000/api";
  const PROD_URL = "https://xoss.onrender.com/api";

  // যদি development mode এ থাকি
  if (__DEV__) {
    console.log('🔧 Development mode detected');
    return LOCAL_URL; // বা LOCAL_ALT
  }

  // Production mode
  console.log('🚀 Production mode detected');
  return PROD_URL;
};

// Export BASE_URL
export const BASE_URL = getBaseUrl();
export const API_BASE_URL = BASE_URL;

// ✅ Environment detection helper
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// ✅ Log the selected URL
console.log('🌐 Selected BASE_URL:', BASE_URL);
console.log('📱 Environment:', isDevelopment ? 'Development' : 'Production');
