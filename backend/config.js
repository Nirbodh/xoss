// config.js - FIXED VERSION WITH NGROK SUPPORT
import { Platform } from 'react-native';

// ✅ Smart URL Detection with ngrok support
const getBaseUrl = () => {
  // Development URLs
  const LOCAL_URL = "http://192.168.0.104:5000";
  const LOCAL_URL_ALT4 = "http://192.168.0.103:5000";
  const LOCAL_URL_ALT = "http://192.168.0.103:5000";
  const LOCAL_URL_ALT2 = "http://192.168.0.100:5000";
  const LOCAL_URL_ALT3 = "http://192.168.0.200:5000";
  
  // ✅ ngrok URLs - Add your ngrok URLs here when they change
  const NGROK_URL = "https://unescaped-elouise-royally.ngrok-free.dev"; // Current ngrok URL
  const NGROK_URL_ALT = "https://your-ngrok-url.ngrok-free.dev"; // Backup ngrok URL
  
  const PROD_URL = "https://xoss.onrender.com";

  // Development mode
  if (__DEV__) {
    console.log('🔧 Development mode detected');
    
    // ✅ Prioritize ngrok URL when available
    // You can switch between local and ngrok by changing the return value
    return NGROK_URL; // Change to LOCAL_URL for local testing
    
    // Alternatively, you can implement automatic detection:
    // return Platform.OS === 'android' ? NGROK_URL : LOCAL_URL;
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

// ✅ Helper function to manually update URL (call this when ngrok URL changes)
export const updateBaseUrl = (newUrl) => {
  console.log('🔄 Updating BASE_URL to:', newUrl);
  // Note: In a real app, you would want to persist this change
  // For now, you need to update the NGROK_URL constant above
};
