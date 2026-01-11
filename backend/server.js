// server.js - XOSS GAMING PROFESSIONAL SERVER WITH NGROK SUPPORT
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// ✅ Import All Routes
const withdrawalRoutes = require('./routes/withdrawal');

// ✅ Function to get current ngrok URL
const getCurrentNgrokUrl = () => {
  // This function can be extended to dynamically fetch ngrok URL
  // For now, it returns common ngrok patterns
  return [
    'https://unescaped-elouise-royally.ngrok-free.dev',
    'https://*.ngrok-free.dev',
    'https://*.ngrok.io'
  ];
};

// ✅ Connect MongoDB FIRST, then start server
const startServer = async () => {
  try {
    console.log('🚀 Starting XOSS Gaming Server...');
    console.log('🔗 Connecting to MongoDB...');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully!');

    console.log('🛠️ Setting up server middleware...');

    // ✅ IMPROVED CORS FOR NGROK SUPPORT
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://192.168.0.100:19006',
      'http://192.168.0.103:19006',
      'http://192.168.0.104:19006',
      'http://192.168.0.200:19006',
      'https://xoss.onrender.com',
      // Add current ngrok URLs
      ...getCurrentNgrokUrl()
    ];

    app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          // Log blocked origins for debugging
          console.log('🚫 CORS blocked origin:', origin);
          callback(null, true); // For testing, allow all. Change to callback(new Error('Not allowed by CORS')) for production
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
    }));

    // ✅ Handle preflight requests
    app.options('*', cors());

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // ✅ Security Headers Middleware - Updated for ngrok
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      
      // Handle ngrok browser warning header
      if (req.headers['ngrok-skip-browser-warning']) {
        res.header('ngrok-skip-browser-warning', 'true');
      }
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
      console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No Origin'} - ${new Date().toISOString()}`);
      next();
    });

    // ✅ API Routes - Organized by Feature
    console.log('🔄 Loading API routes...');

    // Core Routes
    app.use('/api/matches', require('./routes/matchRoutes'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/combined', require('./routes/combined'));

    // User Management Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/wallet', require('./routes/wallet'));

    // ✅ Payment System Routes
    app.use('/api/deposits', require('./routes/deposits'));
    app.use('/api/withdraw', withdrawalRoutes);

    // Prize & Result System Routes
    app.use('/api/prize', require('./routes/prizeRoutes'));
    app.use('/api/results', require('./routes/resultRoutes'));

    // ✅ NGROK INFO ENDPOINT
    app.get('/api/ngrok-info', (req, res) => {
      res.json({
        success: true,
        message: 'Current ngrok configuration',
        ngrokUrls: getCurrentNgrokUrl(),
        serverTime: new Date().toISOString(),
        clientIp: req.ip,
        clientHeaders: {
          origin: req.headers.origin,
          host: req.headers.host,
          'user-agent': req.headers['user-agent']
        }
      });
    });

    // ✅ HEALTH & STATUS ENDPOINTS
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming API Server',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        ngrokSupported: true,
        endpoints: {
          health: '/api/health',
          ngrokInfo: '/api/ngrok-info',
          dbStatus: '/api/db-status'
        }
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
        ngrok: {
          supported: true,
          info: 'Use /api/ngrok-info for ngrok details'
        },
        endpoints: [
          '/api/deposits',
          '/api/deposits/user/:userId',
          '/api/deposits/admin/pending',
          '/api/withdraw/request',
          '/api/wallet'
        ]
      });
    });

    // ... [All your existing endpoints remain unchanged] ...

    // ✅ START SERVER
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎮 XOSS GAMING SERVER - NGROK SUPPORT EDITION');
      console.log('='.repeat(60));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`🌐 Network: http://192.168.0.100:${PORT}`);
      console.log(`🌐 ngrok URLs supported:`, getCurrentNgrokUrl());
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(60));
      console.log('\n📋 PROFESSIONAL ENDPOINTS:');
      console.log('🔧 System & Health:');
      console.log(`   📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   🌐 ngrok Info: http://localhost:${PORT}/api/ngrok-info`);
      console.log(`   🗄️ DB Status: http://localhost:${PORT}/api/db-status`);
      console.log('\n💰 Payment System:');
      console.log(`   💰 Deposit Test: http://localhost:${PORT}/api/deposits/test`);
      console.log(`   💸 Withdrawals: http://localhost:${PORT}/api/withdraw/request`);
      console.log('='.repeat(60));
      console.log('🚀 Server ready to handle requests from any IP!');
      console.log('📱 When ngrok URL changes, update config.js with new ngrok URL');
      console.log('='.repeat(60));
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

// ✅ Start the professional merged server
startServer();
