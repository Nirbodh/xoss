// config/redis.js - FIXED FOR REDIS LABS WITH ioredis
const Redis = require("ioredis");

console.log("🔄 Initializing Redis for Redis Labs...");

let redisClient = null;
const memoryCache = new Map();

try {
  if (process.env.REDIS_URL) {
    console.log("🔗 Redis URL found");
    
    // SSL fix for Redis Labs
    const isSSL = process.env.REDIS_URL.startsWith('rediss://');
    
    const options = {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 2) return null;
        return Math.min(times * 500, 2000);
      }
    };
    
    // Add TLS options for SSL
    if (isSSL) {
      options.tls = {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined // Skip hostname verification
      };
    }
    
    redisClient = new Redis(process.env.REDIS_URL, options);
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
    });
    
    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
    });
    
  } else {
    console.log('📝 Redis URL not set, using memory cache');
  }
} catch (error) {
  console.error('❌ Redis init error:', error.message);
}

module.exports = {
  async get(key) {
    const memoryValue = memoryCache.get(key);
    if (memoryValue !== undefined) return memoryValue;
    
    if (redisClient && redisClient.status === 'ready') {
      try {
        const value = await redisClient.get(key);
        if (value) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      } catch (error) {
        // Silent fail
      }
    }
    
    return null;
  },
  
  async set(key, value, ttl = 3600) {
    memoryCache.set(key, value);
    
    if (redisClient && redisClient.status === 'ready') {
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl > 0) {
          await redisClient.setex(key, ttl, stringValue);
        } else {
          await redisClient.set(key, stringValue);
        }
      } catch (error) {
        // Silent fail
      }
    }
    
    return 'OK';
  },
  
  async del(key) {
    memoryCache.delete(key);
    
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
      } catch (error) {
        // Silent fail
      }
    }
    
    return 1;
  },
  
  isConnected() {
    return redisClient && redisClient.status === 'ready';
  }
};
