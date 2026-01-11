// config.js - COMPLETELY FIXED VERSION
import { Platform } from 'react-native';

// ✅ Smart URL Detection - IP সঠিক করার জন্য
const getBaseUrl = () => {
  // ✅ CORRECTED LOCAL IP - সার্ভার যেই IP তে চলছে
  const LOCAL_URL = "http://192.168.0.100:5000"; // ✅ সার্ভারের সঠিক IP
  const LOCAL_URL_ALT = "http://192.168.0.104:5000";
  const LOCAL_URL_ALT2 = "http://192.168.0.103:5000";
  const LOCAL_URL_ALT3 = "http://192.168.0.200:5000";
  
  // ✅ CURRENT NGROK URL - আপনার বর্তমান ngrok URL
  const NGROK_URL = "https://unescaped-elouise-royally.ngrok-free.dev";
  
  const PROD_URL = "https://xoss.onrender.com";

  // Development mode
  if (__DEV__) {
    console.log('🔧 Development mode detected');
    
    // ✅ OPTION 1: সরাসরি ngrok ব্যবহার (আইপি পরিবর্তন হলে সমস্যা হবে না)
    // return NGROK_URL;
    
    // ✅ OPTION 2: Dynamic IP ডিটেকশন (Android Emulator এর জন্য)
    if (Platform.OS === 'android') {
      console.log('📱 Android detected, using ngrok URL');
      return NGROK_URL;
    } else if (Platform.OS === 'ios') {
      console.log('📱 iOS detected, using local URL');
      return LOCAL_URL;
    } else {
      console.log('💻 Web/Other detected, using ngrok URL');
      return NGROK_URL;
    }
    
    // ✅ OPTION 3: Always ngrok (সবচেয়ে ভালো)
    // return NGROK_URL;
  }

  // Production mode
  console.log('🚀 Production mode detected');
  return PROD_URL;
};

// Export BASE_URL
export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`;

// ✅ Environment detection helper
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// ✅ Log the selected URL
console.log('🌐 Selected BASE_URL:', BASE_URL);
console.log('🌐 Selected API_BASE_URL:', API_BASE_URL);
console.log('📱 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('📱 Platform:', Platform.OS);
