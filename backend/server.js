// ✅ COMBINED & IMPROVED SERVER.JS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// ✅ Connect MongoDB
connectDB();

// ✅ Middleware
app.use(cors()); // Simple CORS for all origins
app.use(express.json());

// ✅ Database connection check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// ✅ Routes
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/combined', require('./routes/combined'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// ✅ Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Match API is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// ✅ Health Check Route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    success: dbStatus === 1,
    message: dbStatus === 1 ? '🚀 Server is healthy' : '⚠️ Server has issues',
    database: statusMap[dbStatus] || 'Unknown',
    timestamp: new Date().toISOString()
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

// ✅ Graceful Shutdown (Best Practice)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed through app termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed through SIGTERM');
  process.exit(0);
});
