// config/environment.js
const ENV = {
  development: {
    API_BASE_URL: 'http://192.168.0.100:5000/api',
    SOCKET_URL: 'http://192.168.0.100:5000'
  },
  production: {
    API_BASE_URL: 'https://yourdomain.com/api',
    SOCKET_URL: 'https://xoss.onrender.com'
  }
};

const getEnvVars = (env = process.env.NODE_ENV) => {
  if (env === 'production') {
    return ENV.production;
  }
  return ENV.development;
};

export default getEnvVars;
// config/environment.js - PERFECT
const ENV = {
  development: {
    API_BASE_URL: 'http://192.168.0.100:5000/api',
    SOCKET_URL: 'http://192.168.0.100:5000'
  },
  production: {
    API_BASE_URL: 'https://xoss.onrender.com/api',
    SOCKET_URL: 'https://xoss.onrender.com'
  }
};

const getEnvVars = (env = process.env.NODE_ENV) => {
  if (env === 'production') {
    return ENV.production;
  }
  return ENV.development;
};

export default getEnvVars;
