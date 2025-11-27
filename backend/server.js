// server.js - COMPLETELY FIXED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// ✅ Import Routes
const withdrawalRoutes = require('./routes/withdrawal');

// ✅ Connect MongoDB
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully!');

    // Middleware
    app.use(cors({
      origin: ['http://localhost:3000', 'http://192.168.0.100:3000', 'exp://192.168.0.100:8081'],
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ✅ API Routes - CORRECT ORDER
    console.log('🔄 Loading API routes...');
    
    // Core Routes
    app.use('/api/matches', require('./routes/matchRoutes'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/combined', require('./routes/combined'));

    // User Management Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/wallet', require('./routes/wallet'));

    // ✅ FIXED: Deposit Routes - শুধু একবার যোগ করুন
    app.use('/api/deposits', require('./routes/deposits'));

    // ✅ FIXED: Withdrawal Routes
    app.use('/api/withdraw', withdrawalRoutes);

    // Prize & Result System Routes
    app.use('/api/prize', require('./routes/prizeRoutes'));
    app.use('/api/results', require('./routes/resultRoutes'));

    // Health endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming Server is running!',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: [
          '/api/deposits',
          '/api/deposits/user/:userId',
          '/api/deposits/admin/pending',
          '/api/withdraw/request',
          '/api/wallet'
        ]
      });
    });

    // ✅ Test deposit endpoint
    app.get('/api/deposits/test', (req, res) => {
      res.json({
        success: true,
        message: '✅ Deposits API is working!',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          'GET /api/health',
          'GET /api/deposits/test',
          'POST /api/deposits',
          'GET /api/deposits/user/:userId',
          'GET /api/deposits/admin/pending',
          'POST /api/deposits/admin/approve/:id',
          'POST /api/deposits/admin/reject/:id'
        ]
      });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💰 Deposits API: http://localhost:${PORT}/api/deposits`);
      console.log(`🔍 Test Deposits: http://localhost:${PORT}/api/deposits/test`);
      console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
