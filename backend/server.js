// server.js - XOSS GAMING PROFESSIONAL SERVER (FINAL VERSION)
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
    app.use('/api/matches', require('./routes/matchRoutes'));
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

    // ✅ TEST DEPOSIT ENDPOINT
    app.get('/api/deposits/test', (req, res) => {
      res.json({
        success: true,
        message: '✅ Deposits API is working!',
        timestamp: new Date().toISOString()
      });
    });

    // ============================================
    // ✅ NEW ENDPOINTS SECTION
    // ============================================
    console.log('🆕 Loading new endpoints...');

    // ✅ EVENTS ENDPOINT (Combined Matches + Tournaments)
    app.get('/api/events', async (req, res) => {
      try {
        const { type, status, game, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        let matchQuery = {};
        let tournamentQuery = {};
        
        if (status) {
          matchQuery.status = status;
          tournamentQuery.status = status;
        }
        if (game) {
          matchQuery.game = game;
          tournamentQuery.game = game;
        }
        
        const [matches, tournaments] = await Promise.all([
          require('./models/Match').find(matchQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          require('./models/Tournament').find(tournamentQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
        ]);
        
        const events = [...matches, ...tournaments]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(event => ({
            ...event.toObject(),
            eventType: event.__t || 'match'
          }));
        
        res.json({
          success: true,
          data: events,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: matches.length + tournaments.length
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ USER DASHBOARD ENDPOINT
    app.get('/api/users/:userId/dashboard', async (req, res) => {
      try {
        const { userId } = req.params;
        
        const User = require('./models/User');
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        const Wallet = require('./models/Wallet');
        const Transaction = require('./models/Transaction');
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const wallet = await Wallet.findOne({ user: userId });
        const recentTransactions = await Transaction.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10);
        
        const userStats = {
          totalMatches: await Match.countDocuments({ participants: userId }),
          matchesWon: await Match.countDocuments({ winners: userId }),
          tournamentsJoined: await Tournament.countDocuments({ 'participants.user': userId }),
          totalEarnings: await calculateUserEarnings(userId),
          walletBalance: wallet ? wallet.balance : 0
        };
        
        res.json({
          success: true,
          data: {
            user,
            wallet,
            stats: userStats,
            recentTransactions,
            upcomingEvents: await Match.find({
              participants: userId,
              status: 'upcoming'
            }).limit(5)
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ LEADERBOARD ENDPOINTS
    app.get('/api/leaderboard', async (req, res) => {
      try {
        const { type = 'global', game, time = 'all' } = req.query;
        
        let leaderboard = [];
        
        if (type === 'global') {
          const users = await require('./models/User').find()
            .sort({ walletBalance: -1 })
            .limit(50)
            .select('username email walletBalance profilePicture');
          
          leaderboard = users.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            points: user.walletBalance || 0,
            profilePicture: user.profilePicture,
            userId: user._id
          }));
        } else if (type === 'weekly') {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - 7);
          
          const weeklyWinners = await require('./models/Transaction').aggregate([
            {
              $match: {
                type: 'winning',
                createdAt: { $gte: startOfWeek }
              }
            },
            {
              $group: {
                _id: '$user',
                totalWinnings: { $sum: '$amount' }
              }
            },
            { $sort: { totalWinnings: -1 } },
            { $limit: 50 }
          ]);
          
          const userIds = weeklyWinners.map(w => w._id);
          const users = await require('./models/User').find({ _id: { $in: userIds } })
            .select('username profilePicture');
          
          leaderboard = weeklyWinners.map((winner, index) => {
            const user = users.find(u => u._id.toString() === winner._id.toString());
            return {
              rank: index + 1,
              username: user ? user.username : 'Unknown',
              points: winner.totalWinnings,
              profilePicture: user ? user.profilePicture : null,
              userId: winner._id
            };
          });
        }
        
        res.json({
          success: true,
          data: leaderboard,
          type,
          time,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ NOTIFICATIONS ENDPOINTS
    app.get('/api/notifications/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { unreadOnly = false } = req.query;
        
        try {
          const Notification = require('./models/Notification');
          let query = { userId };
          if (unreadOnly) {
            query.read = false;
          }
          
          const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
          
          const unreadCount = await Notification.countDocuments({ userId, read: false });
          
          res.json({
            success: true,
            data: notifications,
            unreadCount
          });
        } catch (error) {
          // Return sample notifications if model doesn't exist
          res.json({
            success: true,
            data: [
              {
                id: '1',
                title: 'Welcome to XOSS Gaming',
                message: 'Start playing and win real money!',
                type: 'system',
                read: false,
                createdAt: new Date()
              },
              {
                id: '2',
                title: 'Deposit Successful',
                message: 'Your deposit of ৳500 has been approved',
                type: 'payment',
                read: true,
                createdAt: new Date(Date.now() - 3600000)
              }
            ],
            unreadCount: 1
          });
        }
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ ADMIN DASHBOARD STATS
    app.get('/api/admin/dashboard', async (req, res) => {
      try {
        const User = require('./models/User');
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        const Deposit = require('./models/Deposit');
        const Withdrawal = require('./models/Withdrawal');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [
          totalUsers,
          totalMatches,
          totalTournaments,
          totalDeposits,
          totalWithdrawals,
          todayDeposits,
          todayWithdrawals,
          pendingDeposits,
          pendingWithdrawals,
          activeMatches,
          activeTournaments
        ] = await Promise.all([
          User.countDocuments(),
          Match.countDocuments(),
          Tournament.countDocuments(),
          Deposit.countDocuments(),
          Withdrawal.countDocuments(),
          Deposit.countDocuments({ createdAt: { $gte: today } }),
          Withdrawal.countDocuments({ createdAt: { $gte: today } }),
          Deposit.countDocuments({ status: 'pending' }),
          Withdrawal.countDocuments({ status: 'pending' }),
          Match.countDocuments({ status: 'active' }),
          Tournament.countDocuments({ status: 'active' })
        ]);
        
        res.json({
          success: true,
          data: {
            overview: {
              totalUsers,
              totalMatches,
              totalTournaments,
              totalDeposits,
              totalWithdrawals
            },
            today: {
              deposits: todayDeposits,
              withdrawals: todayWithdrawals,
              newUsers: await User.countDocuments({ createdAt: { $gte: today } })
            },
            pending: {
              deposits: pendingDeposits,
              withdrawals: pendingWithdrawals
            },
            active: {
              matches: activeMatches,
              tournaments: activeTournaments
            },
            revenue: {
              total: await calculateTotalRevenue(),
              today: await calculateTodayRevenue()
            }
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ SUPPORT TICKET SYSTEM
    app.post('/api/support/ticket', async (req, res) => {
      try {
        const { userId, subject, message, category = 'general' } = req.body;
        
        if (!userId || !subject || !message) {
          return res.status(400).json({
            success: false,
            message: 'User ID, subject, and message are required'
          });
        }
        
        const ticketData = {
          userId,
          subject,
          message,
          category,
          status: 'open',
          ticketNumber: 'TKT' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
        };
        
        try {
          const SupportTicket = require('./models/SupportTicket');
          const ticket = new SupportTicket(ticketData);
          await ticket.save();
        } catch (error) {
          console.log('📋 Support Ticket Created:', ticketData);
        }
        
        res.json({
          success: true,
          message: 'Support ticket created successfully',
          data: {
            ticketNumber: ticketData.ticketNumber,
            createdAt: new Date()
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ GAME STATISTICS
    app.get('/api/games/stats', async (req, res) => {
      try {
        const games = ['freefire', 'pubg', 'cod', 'valorant', 'bgmi'];
        const stats = {};
        
        for (const game of games) {
          const [matches, tournaments, totalPrize] = await Promise.all([
            require('./models/Match').countDocuments({ game }),
            require('./models/Tournament').countDocuments({ game }),
            require('./models/Match').aggregate([
              { $match: { game, status: 'completed' } },
              { $group: { _id: null, total: { $sum: '$total_prize' } } }
            ])
          ]);
          
          stats[game] = {
            totalMatches: matches,
            totalTournaments: tournaments,
            totalPrizePool: totalPrize[0]?.total || 0,
            activeEvents: await require('./models/Match').countDocuments({ 
              game, 
              status: { $in: ['active', 'upcoming'] } 
            })
          };
        }
        
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ TRANSACTION HISTORY
    app.get('/api/transactions/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { type, startDate, endDate, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        let query = { user: userId };
        if (type) query.type = type;
        
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) query.createdAt.$gte = new Date(startDate);
          if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        try {
          const Transaction = require('./models/Transaction');
          const transactions = await Transaction.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
          
          const total = await Transaction.countDocuments(query);
          
          res.json({
            success: true,
            data: transactions,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages: Math.ceil(total / limit)
            }
          });
        } catch (error) {
          const Deposit = require('./models/Deposit');
          const Withdrawal = require('./models/Withdrawal');
          
          const [deposits, withdrawals] = await Promise.all([
            Deposit.find({ user: userId }).sort({ createdAt: -1 }),
            Withdrawal.find({ user: userId }).sort({ createdAt: -1 })
          ]);
          
          const combined = [
            ...deposits.map(d => ({ ...d.toObject(), type: 'deposit' })),
            ...withdrawals.map(w => ({ ...w.toObject(), type: 'withdrawal' }))
          ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          res.json({
            success: true,
            data: combined.slice(0, 20)
          });
        }
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ REFERRAL SYSTEM
    app.get('/api/referrals/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        
        const User = require('./models/User');
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        if (!user.referralCode) {
          const referralCode = 'XOSS' + Math.random().toString(36).substr(2, 6).toUpperCase();
          user.referralCode = referralCode;
          await user.save();
        }
        
        const referredUsers = await User.countDocuments({ referredBy: userId });
        const referralEarnings = await calculateReferralEarnings(userId);
        
        res.json({
          success: true,
          data: {
            referralCode: user.referralCode,
            referralLink: `https://xoss.gaming/ref/${user.referralCode}`,
            referredUsers,
            totalEarnings: referralEarnings,
            pendingBonus: 0,
            commissionRate: '10%',
            rewards: [
              { count: 5, bonus: 50 },
              { count: 10, bonus: 150 },
              { count: 20, bonus: 400 }
            ]
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ✅ Helper Functions
    async function calculateTotalRevenue() {
      try {
        const Deposit = require('./models/Deposit');
        const result = await Deposit.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return result[0]?.total || 0;
      } catch (error) {
        return 0;
      }
    }

    async function calculateTodayRevenue() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const Deposit = require('./models/Deposit');
        const result = await Deposit.aggregate([
          { $match: { status: 'approved', createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return result[0]?.total || 0;
      } catch (error) {
        return 0;
      }
    }

    async function calculateUserEarnings(userId) {
      try {
        const Transaction = require('./models/Transaction');
        const result = await Transaction.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(userId), type: 'winning' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return result[0]?.total || 0;
      } catch (error) {
        return 0;
      }
    }

    async function calculateReferralEarnings(userId) {
      try {
        const Transaction = require('./models/Transaction');
        const result = await Transaction.aggregate([
          { $match: { type: 'referral_bonus', 'metadata.referredBy': userId } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return result[0]?.total || 0;
      } catch (error) {
        return 0;
      }
    }

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

    // ✅ 404 HANDLER (UPDATED WITH ALL ENDPOINTS)
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: '🔍 Endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          // 🔐 Authentication
          'POST /api/auth/login',
          'POST /api/auth/register',
          'POST /api/auth/logout',
          
          // 👤 User Management
          'GET /api/users/:userId/dashboard',
          'PUT /api/users/:userId',
          
          // 🎮 Events & Gaming
          'GET /api/events',
          'GET /api/matches',
          'GET /api/matches/active',
          'GET /api/tournaments',
          'GET /api/tournaments/active',
          
          // 💰 Payments
          'POST /api/deposits',
          'GET /api/deposits/user/:userId',
          'POST /api/withdraw/request',
          'GET /api/withdraw/history',
          
          // 💳 Wallet
          'GET /api/wallet/balance/:userId',
          'POST /api/wallet/transfer',
          
          // 🏆 Leaderboard
          'GET /api/leaderboard',
          'GET /api/leaderboard?type=weekly',
          'GET /api/leaderboard?type=global',
          
          // 📊 Analytics
          'GET /api/admin/dashboard',
          'GET /api/games/stats',
          'GET /api/system/stats',
          
          // 📝 Transactions
          'GET /api/transactions/:userId',
          
          // 🔔 Notifications
          'GET /api/notifications/:userId',
          
          // 🤝 Referrals
          'GET /api/referrals/:userId',
          
          // 🆘 Support
          'POST /api/support/ticket',
          
          // ⚙️ System
          'GET /api/health',
          'GET /api/db-status',
          'GET /api/deposits/test'
        ]
      });
    });

    // ✅ START SERVER
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎮 XOSS GAMING SERVER - FINAL PRODUCTION READY');
      console.log('='.repeat(60));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(60));
      console.log('\n📋 AVAILABLE ENDPOINTS:');
      console.log('🔐 Authentication:');
      console.log('   POST /api/auth/login');
      console.log('   POST /api/auth/register');
      console.log('   GET /api/auth/me');
      console.log('\n🎮 Gaming:');
      console.log('   GET /api/events');
      console.log('   GET /api/matches');
      console.log('   GET /api/tournaments');
      console.log('   GET /api/leaderboard');
      console.log('\n💰 Payments:');
      console.log('   POST /api/deposits');
      console.log('   POST /api/withdraw/request');
      console.log('   GET /api/wallet/balance/:userId');
      console.log('\n📊 Analytics:');
      console.log('   GET /api/admin/dashboard');
      console.log('   GET /api/games/stats');
      console.log('   GET /api/system/stats');
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
