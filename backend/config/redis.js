// config/redis.js - COMPLETELY FIXED VERSION
const Redis = require("ioredis");

// Validate Redis URL
const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn("⚠️ REDIS_URL is not set, using localhost");
    return {
      host: 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Retrying Redis connection in ${delay}ms...`);
        return delay;
      }
    };
  }
  
  console.log("🔗 Redis URL found:", redisUrl.substring(0, 50) + "...");
  
  // If using rediss:// (SSL), add SSL options
  if (redisUrl.startsWith('rediss://')) {
    return {
      url: redisUrl,
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      }
    };
  }
  
  // For redis:// (non-SSL)
  return {
    url: redisUrl,
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 3000);
      return delay;
    }
  };
};

const redisConfig = getRedisConfig();
const redis = new Redis(redisConfig);

// Enhanced connection logs
redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
  console.log(`📊 Redis Status: ${redis.status}`);
});

redis.on("ready", () => {
  console.log("✅ Redis is ready to accept commands");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
  console.error("Error details:", err.code);
  
  // If SSL error, suggest using non-SSL
  if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' || 
      err.message.includes('SSL') || 
      err.message.includes('wrong version number')) {
    console.error("\n🔧 SSL ERROR DETECTED!");
    console.error("Try using 'redis://' instead of 'rediss://' in your REDIS_URL");
    console.error("Or disable SSL by removing TLS options");
  }
});

redis.on("close", () => {
  console.log("🔌 Redis connection closed");
});

redis.on("reconnecting", (delay) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms...`);
});

// Test Redis connection on startup
const testRedisConnection = async () => {
  try {
    const startTime = Date.now();
    await redis.ping();
    const endTime = Date.now();
    console.log(`🏓 Redis ping successful (${endTime - startTime}ms)`);
    return true;
  } catch (error) {
    console.error("❌ Redis ping failed:", error.message);
    return false;
  }
};

// Run test after 2 seconds
setTimeout(() => {
  testRedisConnection();
}, 2000);

module.exports = redis;
