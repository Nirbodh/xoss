// config.js

// Local server (Expo Go দিয়ে test)
const LOCAL_URL = "http://192.168.0.200:5000/api";

// Production server (Render)
const PROD_URL = "https://xoss.onrender.com/api";

// Detect environment
const __DEV__ = process.env.NODE_ENV !== "production";

// BASE_URL automatically select
export const BASE_URL = __DEV__ ? LOCAL_URL : PROD_URL;
