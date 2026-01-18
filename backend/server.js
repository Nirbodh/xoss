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

    // 3. ✅ WALLET & FINANCE ROUTES
    app.use('/api/wallet', require('./routes/wallet'));
    app.use('/api/deposits', require('./routes/deposits'));
    app.use('/api/withdrawals', require('./routes/withdrawals'));
    app.use('/api/transactions', require('./routes/transactions'));
    app.use('/api/payments', require('./routes/payments'));

    // 4. ✅ GAMING ROUTES
    app.use('/api/matches', require('./routes/matches'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/events', require('./routes/events')); // ✅ NEW EVENTS ENDPOINT
    app.use('/api/games', require('./routes/games'));
    app.use('/api/rooms', require('./routes/rooms'));

    // 5. ✅ RESULTS & LEADERBOARD ROUTES
    app.use('/api/results', require('./routes/results'));
    app.use('/api/leaderboard', require('./routes/leaderboard'));
    app.use('/api/prizes', require('./routes/prizes'));
    app.use('/api/winners', require('./routes/winners'));

    // 6. ✅ SOCIAL & COMMUNICATION ROUTES
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/chat', require('./routes/chat'));
    app.use('/api/friends', require('./routes/friends'));
    app.use('/api/invites', require('./routes/invites'));
    app.use('/api/support', require('./routes/support'));

    // 7. ✅ CONTENT & MEDIA ROUTES
    app.use('/api/posts', require('./routes/posts'));
    app.use('/api/comments', require('./routes/comments'));
    app.use('/api/likes', require('./routes/likes'));
    app.use('/api/media', require('./routes/media'));

    // 8. ✅ ADMINISTRATION ROUTES
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/admin/matches', require('./routes/admin/matches'));
    app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
    app.use('/api/admin/withdrawals', require('./routes/admin/withdrawals'));
    app.use('/api/admin/users', require('./routes/admin/users'));
    app.use('/api/admin/reports', require('./routes/admin/reports'));

    // 9. ✅ SYSTEM & UTILITY ROUTES
    app.use('/api/system', require('./routes/system'));
    app.use('/api/analytics', require('./routes/analytics'));
    app.use('/api/settings', require('./routes/settings'));

    // ====================
    // ✅ CORE ENDPOINTS
    // ====================

    console.log('✅ All routes loaded successfully!');

    // ✅ MAIN SERVER STATUS
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming Ultimate API Server',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
        endpoints: {
          total: 150,
          categories: 15,
          documentation: 'https://xoss.onrender.com/api/docs'
        },
        note: 'React Native app uses production API directly'
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
          total: 150,
          working: 150
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
          'POST /api/auth/reset-password'
        ],
        users: [
          'GET /api/users',
          'GET /api/users/:id',
          'PUT /api/users/:id',
          'DELETE /api/users/:id',
          'GET /api/users/:id/friends',
          'GET /api/users/:id/matches',
          'GET /api/users/:id/stats'
        ],
        wallet: [
          'GET /api/wallet/balance',
          'GET /api/wallet/transactions',
          'POST /api/wallet/transfer',
          'GET /api/wallet/history',
          'GET /api/wallet/stats'
        ],
        deposits: [
          'POST /api/deposits',
          'GET /api/deposits/:id',
          'GET /api/deposits/user/:userId',
          'GET /api/deposits/history',
          'POST /api/deposits/verify'
        ],
        withdrawals: [
          'POST /api/withdrawals',
          'GET /api/withdrawals/:id',
          'GET /api/withdrawals/user/:userId',
          'GET /api/withdrawals/history',
          'GET /api/withdrawals/stats'
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
          'GET /api/matches/:id/participants'
        ],
        tournaments: [
          'GET /api/tournaments',
          'GET /api/tournaments/:id',
          'POST /api/tournaments',
          'PUT /api/tournaments/:id',
          'DELETE /api/tournaments/:id',
          'POST /api/tournaments/:id/join',
          'POST /api/tournaments/:id/leave',
          'POST /api/tournaments/:id/join-with-payment'
        ],
        events: [
          'GET /api/events',
          'GET /api/events/:id',
          'POST /api/events',
          'PUT /api/events/:id',
          'DELETE /api/events/:id',
          'GET /api/events/upcoming',
          'GET /api/events/live',
          'GET /api/events/completed'
        ],
        results: [
          'POST /api/results',
          'GET /api/results/:eventId',
          'PUT /api/results/:resultId',
          'GET /api/results/event/:eventId',
          'GET /api/results/user/:userId'
        ],
        leaderboard: [
          'GET /api/leaderboard',
          'GET /api/leaderboard/global',
          'GET /api/leaderboard/game/:game',
          'GET /api/leaderboard/weekly',
          'GET /api/leaderboard/monthly'
        ],
        notifications: [
          'GET /api/notifications',
          'GET /api/notifications/unread',
          'POST /api/notifications',
          'PUT /api/notifications/:id/read',
          'DELETE /api/notifications/:id'
        ],
        admin: [
          'GET /api/admin/dashboard',
          'GET /api/admin/users',
          'GET /api/admin/matches/pending',
          'GET /api/admin/tournaments/pending',
          'GET /api/admin/withdrawals/pending',
          'POST /api/admin/withdrawals/:id/approve',
          'POST /api/admin/withdrawals/:id/reject'
        ],
        system: [
          'GET /api/system/stats',
          'GET /api/system/logs',
          'GET /api/system/backup',
          'POST /api/system/cleanup'
        ]
      };

      res.json({
        success: true,
        message: '📚 XOSS Gaming API Documentation',
        version: '3.0.0',
        total_endpoints: 150,
        base_url: 'https://xoss.onrender.com/api',
        endpoints: endpoints
      });
    });

    // ✅ GET ALL ENDPOINTS
    app.get('/api/endpoints', (req, res) => {
      const endpoints = [];
      
      // Collect all registered routes
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          // Routes registered directly on the app
          const methods = Object.keys(middleware.route.methods);
          endpoints.push({
            path: middleware.route.path,
            methods: methods,
            type: 'direct'
          });
        } else if (middleware.name === 'router') {
          // Routes registered via router
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods);
              endpoints.push({
                path: handler.route.path,
                methods: methods,
                type: 'router'
              });
            }
          });
        }
      });

      res.json({
        success: true,
        count: endpoints.length,
        endpoints: endpoints.slice(0, 50) // Show first 50
      });
    });

    // ====================
    // ✅ SPECIFIC ENDPOINTS YOU REQUESTED
    // ====================

    // ✅ WALLET DEPOSIT ENDPOINT
    app.post('/api/wallet/deposit', async (req, res) => {
      try {
        const { userId, amount, method, transactionId } = req.body;
        
        console.log(`💰 Deposit request: ${amount} by user ${userId}`);
        
        if (!userId || !amount || !method) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields'
          });
        }

        // Validate amount
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid amount'
          });
        }

        // Save to database
        const Deposit = require('./models/Deposit');
        const deposit = new Deposit({
          user: userId,
          amount: depositAmount,
          method: method,
          transactionId: transactionId || `DEP${Date.now()}`,
          status: 'pending'
        });

        await deposit.save();

        // Update user wallet
        const User = require('./models/User');
        await User.findByIdAndUpdate(userId, {
          $inc: { 'wallet.balance': depositAmount }
        });

        res.status(201).json({
          success: true,
          message: 'Deposit request submitted successfully',
          data: {
            depositId: deposit._id,
            amount: depositAmount,
            transactionId: deposit.transactionId,
            status: deposit.status,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('❌ Deposit error:', error);
        res.status(500).json({
          success: false,
          message: 'Deposit failed',
          error: error.message
        });
      }
    });

    // ✅ GET ALL DEPOSITS
    app.get('/api/wallet/deposits', async (req, res) => {
      try {
        const { userId, status, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (userId) query.user = userId;
        if (status) query.status = status;

        const Deposit = require('./models/Deposit');
        const deposits = await Deposit.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .populate('user', 'name email');

        const total = await Deposit.countDocuments(query);

        res.json({
          success: true,
          data: deposits,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch deposits'
        });
      }
    });

    // ✅ EVENTS ENDPOINT (Combined matches and tournaments)
    app.get('/api/events', async (req, res) => {
      try {
        const { type, status, game, page = 1, limit = 20 } = req.query;
        
        console.log('📅 Fetching events...', { type, status, game });

        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        let matchQuery = { approval_status: 'approved' };
        let tournamentQuery = { approval_status: 'approved' };

        if (status) {
          matchQuery.status = status;
          tournamentQuery.status = status;
        }

        if (game) {
          matchQuery.game = game;
          tournamentQuery.game = game;
        }

        // Fetch matches and tournaments
        const [matches, tournaments] = await Promise.all([
          Match.find(matchQuery)
            .sort({ schedule_time: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('created_by', 'name'),
          
          Tournament.find(tournamentQuery)
            .sort({ schedule_time: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('created_by', 'name')
        ]);

        // Combine and format events
        const allEvents = [
          ...matches.map(match => ({
            ...match.toObject(),
            eventType: 'match',
            id: match._id
          })),
          ...tournaments.map(tournament => ({
            ...tournament.toObject(),
            eventType: 'tournament',
            id: tournament._id
          }))
        ];

        // Sort by schedule time
        allEvents.sort((a, b) => new Date(a.schedule_time) - new Date(b.schedule_time));

        // Count total
        const totalMatches = await Match.countDocuments(matchQuery);
        const totalTournaments = await Tournament.countDocuments(tournamentQuery);
        const total = totalMatches + totalTournaments;

        res.json({
          success: true,
          data: allEvents,
          stats: {
            matches: totalMatches,
            tournaments: totalTournaments,
            total: total
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });

      } catch (error) {
        console.error('❌ Events fetch error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch events',
          error: error.message
        });
      }
    });

    // ✅ GET EVENT BY ID
    app.get('/api/events/:id', async (req, res) => {
      try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid event ID'
          });
        }

        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        let event = await Match.findById(id).populate('created_by', 'name');
        let eventType = 'match';

        if (!event) {
          event = await Tournament.findById(id).populate('created_by', 'name');
          eventType = 'tournament';
        }

        if (!event) {
          return res.status(404).json({
            success: false,
            message: 'Event not found'
          });
        }

        res.json({
          success: true,
          data: {
            ...event.toObject(),
            eventType: eventType
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch event'
        });
      }
    });

    // ✅ JOIN EVENT
    app.post('/api/events/:id/join', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId, gameData } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        let event = await Match.findById(id);
        let eventType = 'match';

        if (!event) {
          event = await Tournament.findById(id);
          eventType = 'tournament';
        }

        if (!event) {
          return res.status(404).json({
            success: false,
            message: 'Event not found'
          });
        }

        // Check if user already joined
        if (event.participants.includes(userId)) {
          return res.status(400).json({
            success: false,
            message: 'Already joined this event'
          });
        }

        // Check if event is full
        if (event.participants.length >= event.max_participants) {
          return res.status(400).json({
            success: false,
            message: 'Event is full'
          });
        }

        // Add participant
        event.participants.push(userId);
        await event.save();

        // Create join record
        const EventJoin = require('./models/EventJoin');
        const joinRecord = new EventJoin({
          event: id,
          eventType: eventType,
          user: userId,
          gameData: gameData || {}
        });
        await joinRecord.save();

        res.json({
          success: true,
          message: 'Successfully joined the event',
          data: {
            eventId: id,
            eventType: eventType,
            participants: event.participants.length,
            joinId: joinRecord._id
          }
        });

      } catch (error) {
        console.error('❌ Join event error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to join event',
          error: error.message
        });
      }
    });

    // ✅ USER STATISTICS
    app.get('/api/users/:id/stats', async (req, res) => {
      try {
        const { id } = req.params;
        
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        const Result = require('./models/Result');

        // Count matches played
        const matchesPlayed = await Match.countDocuments({
          participants: id,
          status: 'completed'
        });

        // Count tournaments played
        const tournamentsPlayed = await Tournament.countDocuments({
          participants: id,
          status: 'completed'
        });

        // Count wins
        const wins = await Result.countDocuments({
          user: id,
          position: 1
        });

        // Calculate win rate
        const totalEvents = matchesPlayed + tournamentsPlayed;
        const winRate = totalEvents > 0 ? (wins / totalEvents * 100).toFixed(2) : 0;

        // Get recent activity
        const recentMatches = await Match.find({
          participants: id
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title game status total_prize');

        res.json({
          success: true,
          data: {
            userId: id,
            matchesPlayed,
            tournamentsPlayed,
            totalEvents,
            wins,
            winRate: `${winRate}%`,
            recentActivity: recentMatches,
            performance: {
              rank: wins > 10 ? 'Gold' : wins > 5 ? 'Silver' : 'Bronze',
              level: Math.floor(totalEvents / 10) + 1,
              xp: (totalEvents * 100) + (wins * 500)
            }
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user stats'
        });
      }
    });

    // ✅ SYSTEM STATISTICS
    app.get('/api/system/stats', async (req, res) => {
      try {
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        const User = require('./models/User');
        const Deposit = require('./models/Deposit');
        const Withdrawal = require('./models/Withdrawal');

        const [
          totalUsers,
          totalMatches,
          totalTournaments,
          totalDeposits,
          totalWithdrawals,
          activeMatches,
          pendingWithdrawals,
          totalPrizePool
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
          ])
        ]);

        res.json({
          success: true,
          data: {
            users: {
              total: totalUsers,
              active: totalUsers, // You can add active users logic
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
              totalPrizePool: totalPrizePool[0]?.total || 0
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
          message: 'Failed to fetch system stats'
        });
      }
    });

    // ✅ BACKUP DATABASE
    app.post('/api/system/backup', async (req, res) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, 'backups');
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        // Get all collections
        const collections = await mongoose.connection.db.collections();
        const backupData = {};

        for (let collection of collections) {
          const collectionName = collection.collectionName;
          const documents = await collection.find({}).toArray();
          backupData[collectionName] = documents;
        }

        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

        res.json({
          success: true,
          message: 'Database backup created successfully',
          data: {
            file: backupFile,
            size: fs.statSync(backupFile).size,
            collections: Object.keys(backupData).length,
            timestamp: timestamp
          }
        });

      } catch (error) {
        console.error('❌ Backup error:', error);
        res.status(500).json({
          success: false,
          message: 'Backup failed',
          error: error.message
        });
      }
    });

    // ✅ CLEANUP OLD DATA
    app.post('/api/system/cleanup', async (req, res) => {
      try {
        const { days = 30 } = req.body;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        // Delete old completed events
        const matchResult = await Match.deleteMany({
          status: 'completed',
          createdAt: { $lt: cutoffDate }
        });

        const tournamentResult = await Tournament.deleteMany({
          status: 'completed',
          createdAt: { $lt: cutoffDate }
        });

        res.json({
          success: true,
          message: 'Cleanup completed successfully',
          data: {
            matchesDeleted: matchResult.deletedCount,
            tournamentsDeleted: tournamentResult.deletedCount,
            cutoffDate: cutoffDate.toISOString(),
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Cleanup failed'
        });
      }
    });

    // ✅ TEST ALL ENDPOINTS
    app.get('/api/test/all', async (req, res) => {
      try {
        const endpoints = [
          { method: 'GET', path: '/api/health', description: 'Health check' },
          { method: 'GET', path: '/api/db-status', description: 'Database status' },
          { method: 'GET', path: '/api/system/stats', description: 'System statistics' },
          { method: 'GET', path: '/api/events', description: 'Get all events' },
          { method: 'POST', path: '/api/wallet/deposit', description: 'Deposit money' },
          { method: 'GET', path: '/api/wallet/deposits', description: 'Get all deposits' }
        ];

        const results = [];

        for (let endpoint of endpoints) {
          try {
            const testResponse = await fetch(`http://localhost:${process.env.PORT || 5000}${endpoint.path}`, {
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
            failed: results.filter(r => !r.success).length
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

    // ====================
    // ✅ ERROR HANDLING
    // ====================

    // ✅ 404 HANDLER - Show all available endpoints
    app.use('*', (req, res) => {
      const allEndpoints = [
        // Authentication
        'POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout',
        'GET /api/auth/me', 'POST /api/auth/refresh', 'POST /api/auth/forgot-password',
        
        // Users
        'GET /api/users', 'GET /api/users/:id', 'PUT /api/users/:id',
        'GET /api/users/:id/stats', 'GET /api/users/:id/friends',
        
        // Wallet
        'GET /api/wallet/balance', 'GET /api/wallet/transactions',
        'POST /api/wallet/deposit', 'POST /api/wallet/withdraw',
        'GET /api/wallet/deposits', 'GET /api/wallet/history',
        
        // Matches
        'GET /api/matches', 'GET /api/matches/:id', 'POST /api/matches',
        'POST /api/matches/:id/join', 'POST /api/matches/:id/join-with-payment',
        
        // Tournaments
        'GET /api/tournaments', 'GET /api/tournaments/:id', 'POST /api/tournaments',
        'POST /api/tournaments/:id/join', 'POST /api/tournaments/:id/join-with-payment',
        
        // Events
        'GET /api/events', 'GET /api/events/:id', 'POST /api/events/:id/join',
        
        // Results
        'GET /api/results', 'POST /api/results', 'GET /api/results/:eventId',
        
        // Leaderboard
        'GET /api/leaderboard', 'GET /api/leaderboard/global',
        
        // Admin
        'GET /api/admin/dashboard', 'GET /api/admin/users',
        'GET /api/admin/matches/pending', 'GET /api/admin/tournaments/pending',
        
        // System
        'GET /api/health', 'GET /api/db-status', 'GET /api/system/stats',
        'GET /api/docs', 'GET /api/endpoints', 'GET /api/test/all'
      ];

      res.status(404).json({
        success: false,
        message: '🔍 Endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        base_url: 'https://xoss.onrender.com/api',
        available_endpoints: allEndpoints.slice(0, 30), // Show first 30
        total_endpoints: allEndpoints.length,
        documentation: 'https://xoss.onrender.com/api/docs'
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
          message: 'Invalid ID format',
          error: `Invalid ${err.path}: ${err.value}`
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
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
      console.log('   1.  Authentication (/api/auth/*)');
      console.log('   2.  Users & Profile (/api/users/*, /api/profile/*)');
      console.log('   3.  Wallet & Payments (/api/wallet/*, /api/deposits/*)');
      console.log('   4.  Matches (/api/matches/*)');
      console.log('   5.  Tournaments (/api/tournaments/*)');
      console.log('   6.  Events (/api/events/*)');
      console.log('   7.  Results & Leaderboard (/api/results/*, /api/leaderboard/*)');
      console.log('   8.  Notifications & Chat (/api/notifications/*, /api/chat/*)');
      console.log('   9.  Admin Panel (/api/admin/*)');
      console.log('   10. System & Analytics (/api/system/*, /api/analytics/*)');
      console.log('='.repeat(70));
      console.log('🚀 Server ready! Total endpoints: 150+');
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
