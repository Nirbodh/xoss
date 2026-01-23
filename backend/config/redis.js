// config/redis.js
const Redis = require("ioredis");

if (!process.env.REDIS_URL) {
  console.warn("⚠️ REDIS_URL is not set");
}

const redis = new Redis(process.env.REDIS_URL);

// Connection logs
redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

module.exports = redis;
