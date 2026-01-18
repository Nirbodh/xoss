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

    // ✅ Mongoose warnings suppress
    mongoose.set('debug', false);
    mongoose.set('autoIndex', true);

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

    // ============================================
    // ✅ API ROUTES - ORGANIZED BY FEATURE
    // ============================================
    console.log('🔄 Loading API routes...');

    // ======================
    // 🎮 GAMING ROUTES
    // ======================

    // ✅ USER GAMING ROUTES
    app.use('/api/matches', require('./routes/matches'));  // ইউজারের জন্য
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/combined', require('./routes/combined'));
    app.use('/api/events', require('./routes/events'));

    // ✅ ADMIN GAMING ROUTES
    app.use('/api/admin/matches', require('./routes/matchRoutes'));  // এডমিনের জন্য
    app.use('/api/admin/tournaments', require('./routes/tournaments')); // একই ফাইল, আলাদা পাথ

    // ======================
    // 👤 USER MANAGEMENT
    // ======================
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/wallet', require('./routes/wallet'));

    // ======================
    // 💰 PAYMENT SYSTEM
    // ======================
    app.use('/api/deposits', require('./routes/deposits'));
    app.use('/api/withdraw', require('./routes/withdrawal'));
    app.use('/api/transactions', require('./routes/transactions'));

    // ======================
    // 📊 NEW FEATURES
    // ======================
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/leaderboard', require('./routes/leaderboard'));
    app.use('/api/referrals', require('./routes/referrals'));

    // ======================
    // 🏆 PRIZE & RESULTS
    // ======================
    app.use('/api/prize', require('./routes/prizeRoutes'));
    app.use('/api/results', require('./routes/resultRoutes'));

    // ======================
    // 👑 ADMIN PANEL
    // ======================
    app.use('/api/admin/dashboard', require('./routes/adminDashboard'));
    app.use('/api/admin/support', require('./routes/support'));

    // ============================================
    // ✅ HEALTH & STATUS ENDPOINTS
    // ============================================
    
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming API Server',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
        endpoints: {
          auth: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me'],
          gaming: ['GET /api/matches', 'GET /api/tournaments', 'GET /api/events', 'GET /api/combined'],
          payment: ['POST /api/deposits', 'POST /api/withdraw/request', 'GET /api/wallet/balance'],
          user: ['GET /api/users/:id', 'GET /api/users/:id/dashboard'],
          admin: ['GET /api/admin/matches', 'GET /api/admin/dashboard']
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
        apiEndpoints: {
          user: 'https://xoss.onrender.com/api/matches',
          admin: 'https://xoss.onrender.com/api/admin/matches',
          auth: 'https://xoss.onrender.com/api/auth/login',
          payment: 'https://xoss.onrender.com/api/withdraw/request'
        }
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

    // ✅ PROFESSIONAL DATABASE OPERATIONS
    app.post('/api/direct/update-results/:eventId', async (req, res) => {
      try {
        const { eventId } = req.params;
        const { results, calculatedWinners, resultStatus } = req.body;
        console.log(`🔧 Direct database update for event: ${eventId}`);

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid event ID format'
          });
        }

        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        let result;

        result = await Match.updateOne(
          { _id: new mongoose.Types.ObjectId(eventId) },
          {
            $set: {
              results: results || [],
              calculatedWinners: calculatedWinners || [],
              resultStatus: resultStatus || 'pending',
              updatedAt: new Date()
            }
          }
        );

        if (result.modifiedCount === 0) {
          result = await Tournament.updateOne(
            { _id: new mongoose.Types.ObjectId(eventId) },
            {
              $set: {
                results: results || [],
                calculatedWinners: calculatedWinners || [],
                resultStatus: resultStatus || 'pending',
                updatedAt: new Date()
              }
            }
          );
        }

        if (result.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Event not found or no changes made'
          });
        }

        res.json({
          success: true,
          message: '✅ Database updated successfully!',
          data: {
            eventId,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Direct update error:', error);
        res.status(500).json({
          success: false,
          message: 'Database update failed',
          error: error.message,
          code: 'DIRECT_UPDATE_ERROR'
        });
      }
    });

    // ✅ DATABASE MIGRATION ENDPOINTS
    app.post('/api/migrate/add-results-fields', async (req, res) => {
      try {
        console.log('🔄 Starting database migration: Adding results fields...');
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        const matchResult = await Match.updateMany(
          {
            $or: [
              { results: { $exists: false } },
              { calculatedWinners: { $exists: false } },
              { resultStatus: { $exists: false } }
            ]
          },
          {
            $set: {
              results: [],
              calculatedWinners: [],
              resultStatus: 'pending'
            }
          }
        );

        const tournamentResult = await Tournament.updateMany(
          {
            $or: [
              { results: { $exists: false } },
              { calculatedWinners: { $exists: false } },
              { resultStatus: { $exists: false } }
            ]
          },
          {
            $set: {
              results: [],
              calculatedWinners: [],
              resultStatus: 'pending'
            }
          }
        );

        console.log('✅ Migration completed successfully');
        res.json({
          success: true,
          message: '🎉 Database migration completed!',
          data: {
            matches: {
              modified: matchResult.modifiedCount,
              matched: matchResult.matchedCount
            },
            tournaments: {
              modified: tournamentResult.modifiedCount,
              matched: tournamentResult.matchedCount
            },
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Migration error:', error);
        res.status(500).json({
          success: false,
          message: 'Migration failed',
          error: error.message
        });
      }
    });

    // ✅ SYSTEM UTILITIES
    app.get('/api/system/stats', async (req, res) => {
      try {
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        const totalMatches = await Match.countDocuments();
        const totalTournaments = await Tournament.countDocuments();
        const completedEvents = await Match.countDocuments({ status: 'completed' });
        const pendingResults = await Match.countDocuments({
          'results.status': 'pending',
          'results.0': { $exists: true }
        });

        res.json({
          success: true,
          data: {
            events: {
              total: totalMatches + totalTournaments,
              matches: totalMatches,
              tournaments: totalTournaments,
              completed: completedEvents
            },
            results: {
              pendingVerification: pendingResults
            },
            database: {
              status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
              host: mongoose.connection.host,
              name: mongoose.connection.name
            },
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get system stats',
          error: error.message
        });
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
        availableEndpoints: {
          // 🔐 Authentication
          auth: [
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/auth/me'
          ],
          
          // 🎮 Gaming (User)
          gaming: [
            'GET /api/matches',
            'GET /api/matches/:id',
            'POST /api/matches/:id/join',
            'GET /api/tournaments',
            'GET /api/events',
            'GET /api/combined'
          ],
          
          // 👤 User Management
          user: [
            'GET /api/users/:id',
            'GET /api/users/:id/dashboard',
            'GET /api/wallet/balance/:userId'
          ],
          
          // 💰 Payments
          payment: [
            'POST /api/deposits',
            'POST /api/withdraw/request',
            'GET /api/withdraw/history',
            'GET /api/transactions/:userId'
          ],
          
          // 🏆 Leaderboard & Stats
          stats: [
            'GET /api/leaderboard',
            'GET /api/games/stats',
            'GET /api/referrals/:userId'
          ],
          
          // 👑 Admin
          admin: [
            'GET /api/admin/matches',
            'GET /api/admin/matches/pending',
            'POST /api/admin/matches/approve/:id',
            'GET /api/admin/dashboard',
            'GET /api/admin/tournaments'
          ],
          
          // ⚙️ System
          system: [
            'GET /api/health',
            'GET /api/db-status',
            'GET /api/system/stats',
            'POST /api/support/ticket'
          ]
        }
      });
    });

    // ✅ START SERVER
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎮 XOSS GAMING SERVER - FINAL PRODUCTION READY');
      console.log('='.repeat(60));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 URL: https://xoss.onrender.com`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(60));
      console.log('\n📋 IMPORTANT ENDPOINTS:');
      console.log('\n👤 USER ENDPOINTS:');
      console.log('   POST /api/auth/login');
      console.log('   GET  /api/matches');
      console.log('   POST /api/matches/:id/join');
      console.log('   POST /api/withdraw/request');
      console.log('\n👑 ADMIN ENDPOINTS:');
      console.log('   GET  /api/admin/matches');
      console.log('   GET  /api/admin/matches/pending');
      console.log('   GET  /api/admin/dashboard');
      console.log('\n🔧 SYSTEM ENDPOINTS:');
      console.log('   GET  /api/health');
      console.log('   GET  /api/db-status');
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
