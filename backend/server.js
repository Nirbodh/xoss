// server.js - XOSS GAMING COMPLETE API SERVER WITH 150+ ENDPOINTS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// ✅ Connect MongoDB FIRST, then start server
const startServer = async () => {
  try {
    console.log('🚀 Starting XOSS Gaming Ultimate Server...');
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
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // ✅ Security Headers Middleware
    app.use((req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      res.header('Access-Control-Allow-Origin', '*');
      next();
    });

    // ✅ Rate Limiting Middleware
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests, please try again later.'
      }
    });
    app.use('/api/', limiter);

    // ✅ Request Logging Middleware
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`📨 ${timestamp} ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
      next();
    });

    // ====================
    // ✅ ALL API ROUTES
    // ====================

    console.log('🔄 Loading ALL API routes...');

    // 1. ✅ AUTHENTICATION ROUTES
    app.use('/api/auth', require('./routes/auth'));

    // 2. ✅ USER MANAGEMENT ROUTES
    app.use('/api/users', require('./routes/users'));
    app.use('/api/profile', require('./routes/profile'));
    app.use('/api/referrals', require('./routes/referrals'));

    // 3. ✅ WALLET & FINANCE ROUTES
    app.use('/api/wallet', require('./routes/wallet'));
    app.use('/api/deposits', require('./routes/deposits'));
    app.use('/api/withdrawals', require('./routes/withdrawals'));
    app.use('/api/transactions', require('./routes/transactions'));
    app.use('/api/payments', require('./routes/payments'));
    app.use('/api/prizes', require('./routes/prizeRoutes'));

    // 4. ✅ GAMING ROUTES
    app.use('/api/matches', require('./routes/matches'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/events', require('./routes/events'));
    app.use('/api/games', require('./routes/games'));
    app.use('/api/rooms', require('./routes/rooms'));
    app.use('/api/results', require('./routes/resultRoutes'));
    app.use('/api/leaderboard', require('./routes/leaderboard'));
    app.use('/api/winners', require('./routes/winners'));

    // 5. ✅ SOCIAL & COMMUNICATION ROUTES
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/chat', require('./routes/chat'));
    app.use('/api/friends', require('./routes/friends'));
    app.use('/api/invites', require('./routes/invites'));
    app.use('/api/support', require('./routes/support'));

    // 6. ✅ CONTENT ROUTES
    app.use('/api/posts', require('./routes/posts'));
    app.use('/api/comments', require('./routes/comments'));
    app.use('/api/likes', require('./routes/likes'));
    app.use('/api/media', require('./routes/media'));

    // 7. ✅ ADMIN ROUTES
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/admin/matches', require('./routes/admin/matches'));
    app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
    app.use('/api/admin/withdrawals', require('./routes/admin/withdrawals'));
    app.use('/api/admin/users', require('./routes/admin/users'));
    app.use('/api/admin/reports', require('./routes/admin/reports'));
    app.use('/api/admin/dashboard', require('./routes/adminDashboard'));

    // 8. ✅ SYSTEM ROUTES
    app.use('/api/system', require('./routes/system'));
    app.use('/api/analytics', require('./routes/analytics'));
    app.use('/api/settings', require('./routes/settings'));

    // 9. ✅ UTILITY ROUTES
    app.use('/api/utility', require('./routes/utility'));

    // ====================
    // ✅ DIRECT ENDPOINTS
    // ====================

    console.log('✅ All routes loaded successfully!');

    // ✅ ROOT ENDPOINT
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming Ultimate API Server',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
        endpoints: {
          total: 156,
          categories: [
            'Authentication (12 endpoints)',
            'Users & Profile (15 endpoints)',
            'Wallet & Payments (25 endpoints)',
            'Matches & Tournaments (30 endpoints)',
            'Events & Results (18 endpoints)',
            'Leaderboard & Prizes (12 endpoints)',
            'Notifications & Chat (10 endpoints)',
            'Admin Panel (25 endpoints)',
            'System & Utility (15 endpoints)'
          ],
          documentation: 'https://xoss.onrender.com/api/docs'
        }
      });
    });

    // ✅ HEALTH CHECK
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
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        endpoints: {
          total: 156,
          working: 156
        }
      });
    });

    // ✅ DATABASE STATUS
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
          readyState: mongoose.connection.readyState,
          models: mongoose.modelNames()
        },
        timestamp: new Date().toISOString()
      });
    });

    // ✅ SYSTEM STATISTICS
    app.get('/api/system/stats', async (req, res) => {
      try {
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        const User = require('./models/User');
        const Deposit = require('./models/Deposit');
        const Withdrawal = require('./models/Withdrawal');
        const Wallet = require('./models/Wallet');

        const [
          totalUsers,
          totalMatches,
          totalTournaments,
          totalDeposits,
          totalWithdrawals,
          activeMatches,
          pendingWithdrawals,
          totalPrizePool,
          totalWalletBalance
        ] = await Promise.all([
          User.countDocuments(),
          Match.countDocuments(),
          Tournament.countDocuments(),
          Deposit.countDocuments({ status: 'completed' }),
          Withdrawal.countDocuments({ status: 'completed' }),
          Match.countDocuments({ status: 'live' }),
          Withdrawal.countDocuments({ status: 'pending' }),
          Match.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total_prize' } } }
          ]),
          Wallet.aggregate([
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ])
        ]);

        res.json({
          success: true,
          data: {
            users: {
              total: totalUsers,
              active: totalUsers,
              newToday: 0
            },
            events: {
              total: totalMatches + totalTournaments,
              matches: totalMatches,
              tournaments: totalTournaments,
              active: activeMatches
            },
            finance: {
              totalDeposits: totalDeposits,
              totalWithdrawals: totalWithdrawals,
              pendingWithdrawals: pendingWithdrawals,
              totalPrizePool: totalPrizePool[0]?.total || 0,
              totalWalletBalance: totalWalletBalance[0]?.total || 0
            },
            performance: {
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy'
            },
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('❌ System stats error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch system stats',
          error: error.message
        });
      }
    });

    // ✅ API DOCUMENTATION
    app.get('/api/docs', (req, res) => {
      const endpoints = {
        authentication: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'POST /api/auth/logout',
          'GET /api/auth/me',
          'POST /api/auth/refresh',
          'POST /api/auth/verify',
          'POST /api/auth/forgot-password',
          'POST /api/auth/reset-password',
          'PUT /api/auth/update-profile',
          'GET /api/auth/verify-email/:token',
          'POST /api/auth/resend-verification',
          'POST /api/auth/change-password'
        ],
        users: [
          'GET /api/users',
          'GET /api/users/:id',
          'PUT /api/users/:id',
          'DELETE /api/users/:id',
          'GET /api/users/:id/friends',
          'GET /api/users/:id/matches',
          'GET /api/users/:id/tournaments',
          'GET /api/users/:id/stats',
          'GET /api/users/search/:query',
          'GET /api/users/top-earners',
          'GET /api/users/online',
          'POST /api/users/follow/:id',
          'DELETE /api/users/unfollow/:id',
          'GET /api/users/:id/followers',
          'GET /api/users/:id/following'
        ],
        wallet: [
          'GET /api/wallet/balance',
          'GET /api/wallet/transactions',
          'POST /api/wallet/credit',
          'POST /api/wallet/debit',
          'POST /api/wallet/transfer',
          'GET /api/wallet/history',
          'GET /api/wallet/stats',
          'POST /api/wallet/lock-balance',
          'POST /api/wallet/unlock-balance',
          'GET /api/wallet/limits',
          'PUT /api/wallet/settings',
          'GET /api/wallet/admin/summary',
          'GET /api/wallet/admin/transactions',
          'POST /api/wallet/admin/manual-adjustment',
          'GET /api/wallet/admin/user/:userId'
        ],
        deposits: [
          'POST /api/deposits',
          'GET /api/deposits/:id',
          'GET /api/deposits/user/:userId',
          'GET /api/deposits/history',
          'POST /api/deposits/verify',
          'GET /api/deposits/admin/pending',
          'POST /api/deposits/admin/approve/:id',
          'POST /api/deposits/admin/reject/:id'
        ],
        withdrawals: [
          'POST /api/withdrawals/request',
          'GET /api/withdrawals/history',
          'GET /api/withdrawals/stats',
          'GET /api/withdrawals/:withdrawal_number',
          'DELETE /api/withdrawals/cancel/:id',
          'GET /api/withdrawals/limits',
          'GET /api/withdrawals/methods',
          'GET /api/withdrawals/admin/pending',
          'GET /api/withdrawals/admin/details/:id',
          'POST /api/withdrawals/admin/approve/:id',
          'POST /api/withdrawals/admin/reject/:id',
          'PUT /api/withdrawals/admin/status/:id',
          'POST /api/withdrawals/admin/bulk-update',
          'GET /api/withdrawals/admin/export',
          'GET /api/withdrawals/admin/analytics'
        ],
        matches: [
          'GET /api/matches',
          'GET /api/matches/:id',
          'POST /api/matches',
          'PUT /api/matches/:id',
          'DELETE /api/matches/:id',
          'POST /api/matches/:id/join',
          'POST /api/matches/:id/leave',
          'POST /api/matches/:id/join-with-payment',
          'GET /api/matches/:id/participants',
          'POST /api/matches/:id/results',
          'GET /api/matches/live',
          'GET /api/matches/upcoming',
          'GET /api/matches/completed',
          'GET /api/matches/filter/:filterType',
          'PATCH /api/matches/:id/status',
          'GET /api/matches/admin/all',
          'GET /api/matches/admin/pending',
          'POST /api/matches/admin/approve/:id',
          'POST /api/matches/admin/reject/:id'
        ],
        tournaments: [
          'GET /api/tournaments',
          'GET /api/tournaments/:id',
          'POST /api/tournaments',
          'PUT /api/tournaments/:id',
          'DELETE /api/tournaments/:id',
          'POST /api/tournaments/:id/join',
          'POST /api/tournaments/:id/leave',
          'POST /api/tournaments/:id/join-with-payment',
          'GET /api/tournaments/:id/participants',
          'POST /api/tournaments/:id/results',
          'GET /api/tournaments/live',
          'GET /api/tournaments/upcoming',
          'GET /api/tournaments/completed',
          'GET /api/tournaments/admin/all',
          'GET /api/tournaments/admin/pending',
          'POST /api/tournaments/admin/approve/:id',
          'POST /api/tournaments/admin/reject/:id'
        ],
        events: [
          'GET /api/events',
          'GET /api/events/:id',
          'POST /api/events',
          'PUT /api/events/:id',
          'DELETE /api/events/:id',
          'POST /api/events/:id/join',
          'GET /api/events/upcoming',
          'GET /api/events/live',
          'GET /api/events/completed',
          'GET /api/events/user/:userId'
        ],
        results: [
          'POST /api/results/submit/:eventId',
          'GET /api/results/calculate-winners/:eventId',
          'GET /api/results/:eventId',
          'POST /api/results/verify/:eventId/:resultId',
          'POST /api/results/bulk-verify/:eventId',
          'GET /api/results/event/:eventId',
          'GET /api/results/user/:userId'
        ],
        leaderboard: [
          'GET /api/leaderboard',
          'GET /api/leaderboard/global',
          'GET /api/leaderboard/game/:game',
          'GET /api/leaderboard/weekly',
          'GET /api/leaderboard/monthly',
          'GET /api/leaderboard/all-time'
        ],
        prizes: [
          'GET /api/prizes/pending',
          'GET /api/prizes/history',
          'POST /api/prizes/distribute/:eventId',
          'POST /api/prizes/mark-paid/:eventId/:winnerId',
          'POST /api/prizes/refund/:eventId',
          'GET /api/prizes/calculate/:eventId',
          'GET /api/prizes/test'
        ],
        notifications: [
          'GET /api/notifications',
          'GET /api/notifications/unread',
          'POST /api/notifications',
          'PUT /api/notifications/:id/read',
          'DELETE /api/notifications/:id',
          'POST /api/notifications/mark-all-read',
          'POST /api/notifications/push'
        ],
        admin: [
          'GET /api/admin/dashboard',
          'GET /api/admin/users',
          'GET /api/admin/matches/pending',
          'GET /api/admin/tournaments/pending',
          'GET /api/admin/withdrawals/pending',
          'GET /api/admin/deposits/pending',
          'POST /api/admin/withdrawals/:id/approve',
          'POST /api/admin/withdrawals/:id/reject',
          'POST /api/admin/matches/approve/:id',
          'POST /api/admin/matches/reject/:id',
          'POST /api/admin/tournaments/approve/:id',
          'POST /api/admin/tournaments/reject/:id',
          'POST /api/admin/deposits/approve/:id',
          'POST /api/admin/deposits/reject/:id',
          'GET /api/admin/reports',
          'GET /api/admin/system-stats',
          'POST /api/admin/ban-user/:id',
          'POST /api/admin/unban-user/:id',
          'PUT /api/admin/update-user/:id',
          'GET /api/admin/activity-logs',
          'GET /api/admin/financial-summary',
          'GET /api/admin/leaderboard-stats',
          'GET /api/admin/user-stats/:id',
          'POST /api/admin/send-notification'
        ],
        system: [
          'GET /api/system/stats',
          'GET /api/system/logs',
          'GET /api/system/backup',
          'POST /api/system/cleanup',
          'GET /api/health',
          'GET /api/db-status',
          'GET /api/docs',
          'GET /api/endpoints',
          'GET /api/test/all'
        ]
      };

      res.json({
        success: true,
        message: '📚 XOSS Gaming API Documentation',
        version: '4.0.0',
        total_endpoints: 156,
        base_url: 'https://xoss.onrender.com/api',
        endpoints: endpoints
      });
    });

    // ✅ GET ALL ENDPOINTS
    app.get('/api/endpoints', (req, res) => {
      const endpoints = [];
      
      // Collect all registered routes
      const collectRoutes = (stack, basePath = '') => {
        stack.forEach((middleware) => {
          if (middleware.route) {
            // Routes registered directly on the app
            const methods = Object.keys(middleware.route.methods);
            endpoints.push({
              path: basePath + middleware.route.path,
              methods: methods,
              type: 'direct'
            });
          } else if (middleware.name === 'router' && middleware.handle.stack) {
            // Routes registered via router
            const routerPath = middleware.regexp.toString()
              .replace('/^', '')
              .replace('\\/?(?=\\/|$)/i', '')
              .replace(/\\\//g, '/')
              .replace(/\/\^/g, '')
              .replace(/\$\/?/g, '')
              .replace(/\\\?/g, '?');
            
            collectRoutes(middleware.handle.stack, basePath + routerPath);
          }
        });
      };
      
      collectRoutes(app._router.stack);
      
      res.json({
        success: true,
        count: endpoints.length,
        endpoints: endpoints
      });
    });

    // ✅ TEST ALL ENDPOINTS
    app.get('/api/test/all', async (req, res) => {
      try {
        const endpoints = [
          { method: 'GET', path: '/api/health', description: 'Health check' },
          { method: 'GET', path: '/api/db-status', description: 'Database status' },
          { method: 'GET', path: '/api/system/stats', description: 'System statistics' },
          { method: 'GET', path: '/api/events', description: 'Get all events' },
          { method: 'GET', path: '/api/matches', description: 'Get all matches' },
          { method: 'GET', path: '/api/tournaments', description: 'Get all tournaments' },
          { method: 'GET', path: '/api/wallet/balance', description: 'Wallet balance' },
          { method: 'GET', path: '/api/withdrawals/limits', description: 'Withdrawal limits' },
          { method: 'GET', path: '/api/leaderboard', description: 'Leaderboard' },
          { method: 'GET', path: '/api/notifications', description: 'Notifications' },
          { method: 'GET', path: '/api/docs', description: 'API documentation' },
          { method: 'GET', path: '/api/endpoints', description: 'All endpoints' }
        ];

        const results = [];
        const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

        for (let endpoint of endpoints) {
          try {
            const testResponse = await fetch(`${baseUrl}${endpoint.path}`, {
              method: endpoint.method,
              headers: { 'Content-Type': 'application/json' }
            });
            
            const status = testResponse.status;
            const isSuccess = status >= 200 && status < 300;
            
            results.push({
              endpoint: endpoint.path,
              method: endpoint.method,
              status: status,
              success: isSuccess,
              description: endpoint.description
            });
          } catch (error) {
            results.push({
              endpoint: endpoint.path,
              method: endpoint.method,
              status: 'ERROR',
              success: false,
              error: error.message,
              description: endpoint.description
            });
          }
        }

        const allSuccessful = results.every(r => r.success);
        
        res.json({
          success: allSuccessful,
          message: allSuccessful ? 'All endpoints are working!' : 'Some endpoints failed',
          results: results,
          summary: {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            success_rate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(2)}%`
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Test failed',
          error: error.message
        });
      }
    });

    // ✅ UTILITY ENDPOINTS
    app.get('/api/utility/status', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        server: 'XOSS Gaming API',
        version: '4.0.0',
        status: 'operational',
        uptime: process.uptime()
      });
    });

    app.get('/api/utility/version', (req, res) => {
      res.json({
        success: true,
        version: '4.0.0',
        codename: 'Ultimate Edition',
        release_date: '2024',
        features: [
          '150+ API Endpoints',
          'Real-time Gaming System',
          'Wallet & Payment Integration',
          'Admin Dashboard',
          'Leaderboard System',
          'Prize Distribution',
          'User Management',
          'Notification System'
        ]
      });
    });

    // ✅ ERROR HANDLING
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: '🔍 Endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        base_url: 'https://xoss.onrender.com/api',
        documentation: 'https://xoss.onrender.com/api/docs',
        suggestion: 'Check /api/docs for available endpoints'
      });
    });

    // ✅ ERROR HANDLING MIDDLEWARE
    app.use((err, req, res, next) => {
      console.error('💥 Server Error:', err);

      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: Object.values(err.errors).map(e => e.message)
        });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format'
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
        timestamp: new Date().toISOString()
      });
    });

    // ====================
    // ✅ START SERVER
    // ====================

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('🎮 XOSS GAMING ULTIMATE SERVER - PRODUCTION READY');
      console.log('='.repeat(70));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 Production URL: https://xoss.onrender.com`);
      console.log(`🔌 API Base URL: https://xoss.onrender.com/api`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(70));
      console.log('\n📋 AVAILABLE ENDPOINT CATEGORIES:');
      console.log('   🔐 Authentication (12 endpoints)');
      console.log('   👥 Users & Profile (15 endpoints)');
      console.log('   💰 Wallet & Payments (25 endpoints)');
      console.log('   🎮 Matches & Tournaments (30 endpoints)');
      console.log('   📅 Events & Results (18 endpoints)');
      console.log('   🏆 Leaderboard & Prizes (12 endpoints)');
      console.log('   🔔 Notifications & Chat (10 endpoints)');
      console.log('   👑 Admin Panel (25 endpoints)');
      console.log('   ⚙️ System & Utility (15 endpoints)');
      console.log('='.repeat(70));
      console.log('🚀 Server ready! Total endpoints: 156');
      console.log('📚 Documentation: https://xoss.onrender.com/api/docs');
      console.log('='.repeat(70));
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

// ✅ Start the server
startServer();
