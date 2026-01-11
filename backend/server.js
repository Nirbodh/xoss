// server.js - COMPLETELY FIXED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const app = express();

// ✅ Import All Routes
const withdrawalRoutes = require('./routes/withdrawal');

// ✅ Connect MongoDB FIRST, then start server
const startServer = async () => {
  try {
    console.log('🚀 Starting XOSS Gaming Server...');
    console.log('🔗 Connecting to MongoDB...');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully!');

    console.log('🛠️ Setting up server middleware...');

    // ✅ FIXED CORS CONFIGURATION - All Origins Allowed
    app.use(cors({
      origin: '*', // ✅ ALLOW ALL ORIGINS (Temporary for testing)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
    }));

    // ✅ Handle preflight requests
    app.options('*', cors());

    // ✅ Body parsers
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // ✅ Request Logging Middleware
    app.use((req, res, next) => {
      console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'No Origin'} - ${new Date().toISOString()}`);
      next();
    });

    // ✅ IMPORTANT: COMBINED ROUTE ADDED HERE (BEFORE OTHER ROUTES)
    // ✅ This will handle /api/combined requests
    app.get('/api/combined', async (req, res) => {
      try {
        console.log('📊 /api/combined - Fetching all events');
        
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        
        // Public filter: only approved events
        const publicFilter = {
          approval_status: 'approved',
          status: { $in: ['upcoming', 'live', 'completed'] }
        };
        
        // Check for admin query parameter
        const isAdmin = req.query.admin === 'true';
        const filter = isAdmin ? {} : publicFilter;
        
        console.log('🔍 Combined filter:', filter);
        
        const [matches, tournaments] = await Promise.all([
          Match.find(filter)
            .populate('created_by', 'username')
            .sort({ schedule_time: 1 })
            .lean(),
          Tournament.find(filter)
            .populate('created_by', 'username')
            .sort({ schedule_time: 1 })
            .lean()
        ]);
        
        // Transform matches
        const formattedMatches = matches.map(match => ({
          ...match,
          _id: match._id,
          id: match._id.toString(),
          matchType: 'match',
          eventType: 'match',
          prizePool: match.total_prize,
          entryFee: match.entry_fee,
          maxPlayers: match.max_participants,
          currentPlayers: match.current_participants,
          maxParticipants: match.max_participants,
          currentParticipants: match.current_participants,
          scheduleTime: match.schedule_time,
          startTime: match.start_time,
          endTime: match.end_time,
          roomId: match.room_id,
          password: match.room_password,
          approvalStatus: match.approval_status
        }));
        
        // Transform tournaments
        const formattedTournaments = tournaments.map(tournament => ({
          ...tournament,
          _id: tournament._id,
          id: tournament._id.toString(),
          matchType: 'tournament',
          eventType: 'tournament',
          prizePool: tournament.total_prize,
          entryFee: tournament.entry_fee,
          maxPlayers: tournament.max_participants,
          currentPlayers: tournament.current_participants,
          maxParticipants: tournament.max_participants,
          currentParticipants: tournament.current_participants,
          scheduleTime: tournament.schedule_time,
          startTime: tournament.start_time,
          endTime: tournament.end_time,
          roomId: tournament.room_id,
          password: tournament.room_password,
          approvalStatus: tournament.approval_status
        }));
        
        const allEvents = [...formattedMatches, ...formattedTournaments];
        
        // Sort by schedule time
        allEvents.sort((a, b) => new Date(a.scheduleTime) - new Date(b.scheduleTime));
        
        console.log(`✅ Combined events: ${matches.length} matches + ${tournaments.length} tournaments = ${allEvents.length} total`);
        
        res.json({
          success: true,
          message: 'Events fetched successfully',
          data: allEvents,
          counts: {
            matches: matches.length,
            tournaments: tournaments.length,
            total: allEvents.length
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ /api/combined error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch events',
          error: error.message
        });
      }
    });

    // ✅ API Routes - Organized by Feature
    console.log('🔄 Loading API routes...');

    // Core Routes
    app.use('/api/matches', require('./routes/matchRoutes'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    
    // Combined Route (if separate file exists)
    try {
      app.use('/api/combined', require('./routes/combined'));
      console.log('✅ Combined route loaded from file');
    } catch (err) {
      console.log('ℹ️ Combined route file not found, using built-in route');
    }

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
        endpoints: {
          combined: '/api/combined',
          matches: '/api/matches',
          tournaments: '/api/tournaments',
          health: '/api/health'
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
        endpoints: [
          '/api/combined',
          '/api/matches',
          '/api/tournaments',
          '/api/deposits',
          '/api/deposits/user/:userId',
          '/api/deposits/admin/pending',
          '/api/withdraw/request',
          '/api/wallet'
        ]
      });
    });

    // ✅ START SERVER
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0'; // Listen on all network interfaces
    
    const server = app.listen(PORT, HOST, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎮 XOSS GAMING SERVER - IP & NGROK FIXED EDITION');
      console.log('='.repeat(60));
      console.log(`📍 Server IP: ${HOST}:${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`🌐 Network: http://192.168.0.100:${PORT}`);
      console.log(`🌐 ngrok: https://unescaped-elouise-royally.ngrok-free.dev`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(60));
      console.log('\n📋 KEY ENDPOINTS FOR TESTING:');
      console.log(`   📊 Combined Events: http://localhost:${PORT}/api/combined`);
      console.log(`   🏆 Matches: http://localhost:${PORT}/api/matches`);
      console.log(`   🏅 Tournaments: http://localhost:${PORT}/api/tournaments`);
      console.log(`   ❤️ Health: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
      console.log('✅ Server ready! IP পরিবর্তন হলেও ngrok দিয়ে কাজ করবে।');
      console.log('='.repeat(60));
    });

    // ... [rest of your server.js code remains the same] ...

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ✅ Start the server
startServer();
