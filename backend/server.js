// server.js - XOSS GAMING PROFESSIONAL SERVER
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// ✅ Connect MongoDB FIRST, then start server
const startServer = async () => {
  try {
    console.log('🚀 Starting XOSS Gaming Server...');
    console.log('🔗 Connecting to MongoDB...');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully!');

    console.log('🛠️ Setting up server middleware...');

    // ✅ Professional Middleware Stack
    app.use(cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // ✅ Security Headers Middleware
    app.use((req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      next();
    });

    // ✅ Database Health Check Middleware
    app.use((req, res, next) => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database connection unstable');
        return res.status(503).json({
          success: false,
          message: 'Database connection temporarily unavailable',
          timestamp: new Date().toISOString(),
          retryAfter: 30
        });
      }
      next();
    });

    // ✅ Request Logging Middleware
    app.use((req, res, next) => {
      console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });

    // ✅ API Routes - Organized by Feature
    console.log('🔄 Loading API routes...');

    // Core Routes
    app.use('/api/matches', require('./routes/matches'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/combined', require('./routes/combined'));

    // User Management Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/wallet', require('./routes/wallet'));

    // ✅ Payment System Routes
    app.use('/api/deposits', require('./routes/deposits'));
    app.use('/api/withdraw', require('./routes/withdrawal'));

    // Prize & Result System Routes
    app.use('/api/prize', require('./routes/prizeRoutes'));
    app.use('/api/results', require('./routes/resultRoutes'));

    // ✅ HEALTH & STATUS ENDPOINTS
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming API Server',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
          '/api/health',
          '/api/events',
          '/api/matches',
          '/api/tournaments',
          '/api/auth/login',
          '/api/withdraw/request',
          '/api/deposits'
        ]
      });
    });

    app.get('/api/health', (req, res) => {
      const dbStatus = mongoose.connection.readyState;
      const statusMap = {
        0: '🔴 Disconnected',
        1: '🟢 Connected',
        2: '🟡 Connecting',
        3: '🟠 Disconnecting'
      };
      res.json({
        success: dbStatus === 1,
        status: dbStatus === 1 ? 'healthy' : 'degraded',
        message: dbStatus === 1 ? '🚀 Server is operating normally' : '⚠️ Service degradation detected',
        database: statusMap[dbStatus] || '⚫ Unknown',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/api/deposits',
          '/api/deposits/user/:userId',
          '/api/deposits/admin/pending',
          '/api/withdraw/request',
          '/api/wallet'
        ]
      });
    });

    app.get('/api/db-status', (req, res) => {
      const dbStatus = mongoose.connection.readyState;
      const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      res.json({
        success: dbStatus === 1,
        database: {
          status: statusMap[dbStatus],
          connectionState: dbStatus,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState
        },
        timestamp: new Date().toISOString()
      });
    });

    // ✅ TEST ENDPOINTS
    app.get('/api/deposits/test', (req, res) => {
      res.json({
        success: true,
        message: '✅ Deposits API is working!',
        timestamp: new Date().toISOString()
      });
    });

    // ✅ WALLET TEST ENDPOINT
    app.get('/api/wallet/test/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { Wallet } = require('./models/Wallet');
        
        const wallet = await Wallet.findOrCreate(userId);
        
        res.json({
          success: true,
          message: 'Wallet test successful',
          wallet: {
            user_id: wallet.user_id,
            balance: wallet.balance,
            available_balance: wallet.available_balance,
            locked_balance: wallet.locked_balance
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Wallet test failed',
          error: error.message
        });
      }
    });

    // ✅ ERROR HANDLING MIDDLEWARE
    app.use((err, req, res, next) => {
      console.error('💥 Unhandled Error:', err);

      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          error: Object.values(err.errors).map(e => e.message)
        });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format',
          error: `Invalid ${err.path}: ${err.value}`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
      });
    });

    // ✅ 404 HANDLER
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: '🔍 Endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          'GET /',
          'GET /api/health',
          'GET /api/db-status',
          'GET /api/events',
          'GET /api/matches',
          'GET /api/tournaments',
          'POST /api/matches/join/:id/payment',
          'GET /api/wallet/test/:userId'
        ]
      });
    });

    // ✅ START SERVER
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎮 XOSS GAMING SERVER - WALLET FIXED VERSION');
      console.log('='.repeat(60));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(60));
      console.log('\n📋 IMPORTANT ENDPOINTS:');
      console.log('🎮 Match Joining with Payment:');
      console.log('   POST /api/matches/join/:id/payment');
      console.log('\n💳 Wallet Testing:');
      console.log('   GET /api/wallet/test/:userId');
      console.log('\n🔧 System:');
      console.log('   GET /api/health');
      console.log('   GET /api/db-status');
      console.log('='.repeat(60));
      console.log('🚀 Server ready to handle requests!');
    });

    // ✅ GRACEFUL SHUTDOWN HANDLERS
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('✅ HTTP server closed.');
        try {
          await mongoose.connection.close();
          console.log('✅ MongoDB connection closed.');
          console.log('👋 Graceful shutdown completed.');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⏰ Shutdown timeout, forcing exit...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ✅ Start the professional server
startServer();
