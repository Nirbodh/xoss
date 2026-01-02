// config.js - FIXED VERSION
import { Platform } from 'react-native';

// ✅ Smart URL Detection
const getBaseUrl = () => {
  // Development URLs - WITHOUT /api at the end
  const LOCAL_URL = "http://192.168.0.103:5000"; // ✅ NO /api here
  const LOCAL_URL_ALT = "http://192.168.0.200:5000";
  const LOCAL_URL_ALT2 = "http://192.168.0.100:5000";
  const PROD_URL = "https://xoss.onrender.com";

  // Development mode
  if (__DEV__) {
    console.log('🔧 Development mode detected');
    return LOCAL_URL;
  }

  // Production mode
  console.log('🚀 Production mode detected');
  return PROD_URL;
};

// Export BASE_URL
export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`; // ✅ Add /api here separately

// ✅ Environment detection helper
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// ✅ Log the selected URL
console.log('🌐 Selected BASE_URL:', BASE_URL);
console.log('🌐 Selected API_BASE_URL:', API_BASE_URL);
console.log('📱 Environment:', isDevelopment ? 'Development' : 'Production');
