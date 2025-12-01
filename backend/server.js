// server.js - XOSS GAMING PROFESSIONAL SERVER (MERGED & OPTIMIZED)
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

    // ✅ Professional Middleware Stack
    app.use(cors({
      origin: ['http://localhost:3000', 'http://192.168.0.100:3000', 'exp://192.168.0.100:8081'],
      credentials: true
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
        environment: process.env.NODE_ENV || 'development'
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

    // ✅ TEST DEPOSIT ENDPOINT (From Second Server)
    app.get('/api/deposits/test', (req, res) => {
      res.json({
        success: true,
        message: '✅ Deposits API is working!',
        timestamp: new Date().toISOString()
      });
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

    // ✅ TESTING & DEVELOPMENT ENDPOINTS
    app.post('/api/test/completed-match', async (req, res) => {
      try {
        const Match = require('./models/Match');
        const testMatch = new Match({
          title: `🏆 COMPLETED Test Match - ${Date.now()}`,
          game: 'freefire',
          type: 'Solo',
          total_prize: 1500,
          entry_fee: 15,
          max_participants: 48,
          schedule_time: new Date(),
          start_time: new Date(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
          room_id: 'TEST' + Math.random().toString(36).substr(2, 5).toUpperCase(),
          room_password: 'test123',
          description: 'Professional test match for system verification',
          rules: 'Standard tournament rules apply',
          status: 'completed',
          approval_status: 'approved',
          created_by: new mongoose.Types.ObjectId(),
          results: [],
          calculatedWinners: [],
          resultStatus: 'pending',
          winners: [],
          prizeStatus: 'pending'
        });

        const savedMatch = await testMatch.save();
        console.log(`✅ Professional test match created: ${savedMatch._id}`);

        res.status(201).json({
          success: true,
          message: '🎯 Professional test match created successfully!',
          data: {
            id: savedMatch._id,
            title: savedMatch.title,
            prizePool: savedMatch.total_prize,
            status: savedMatch.status,
            resultsReady: true
          }
        });
      } catch (error) {
        console.error('❌ Test match creation failed:', error);
        res.status(500).json({
          success: false,
          message: 'Test match creation failed',
          error: error.message,
          details: error.errors
        });
      }
    });

    // ✅ BULK OPERATIONS
    app.post('/api/bulk/verify-results/:eventId', async (req, res) => {
      try {
        const { eventId } = req.params;
        const { resultIds, status, adminNotes } = req.body;

        if (!resultIds || !Array.isArray(resultIds)) {
          return res.status(400).json({
            success: false,
            message: 'resultIds must be an array'
          });
        }

        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');

        let event = await Match.findById(eventId);
        let eventType = 'match';

        if (!event) {
          event = await Tournament.findById(eventId);
          eventType = 'tournament';
        }

        if (!event) {
          return res.status(404).json({
            success: false,
            message: 'Event not found'
          });
        }

        if (!event.results) {
          event.results = [];
        }

        let processed = 0;
        const results = [];

        resultIds.forEach(resultId => {
          const result = event.results.id(resultId);
          if (result) {
            result.status = status;
            result.verifiedAt = new Date();
            result.verifiedBy = 'system-bulk';
            if (adminNotes) result.adminNotes = adminNotes;
            processed++;
            results.push({
              id: resultId,
              playerName: result.playerName,
              status: result.status
            });
          }
        });

        await event.save();
        console.log(`✅ Bulk ${status} completed for ${processed} results`);

        res.json({
          success: true,
          message: `Bulk operation completed: ${processed} results ${status}`,
          data: {
            eventId,
            eventType,
            processed,
            failed: resultIds.length - processed,
            results,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Bulk operation error:', error);
        res.status(500).json({
          success: false,
          message: 'Bulk operation failed',
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

    // ✅ 404 HANDLER (MERGED FROM BOTH)
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: '🔍 Endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          'GET /api/health',
          'GET /api/db-status',
          'GET /api/deposits/test',
          'POST /api/direct/update-results/:eventId',
          'POST /api/migrate/add-results-fields',
          'POST /api/test/completed-match',
          'POST /api/bulk/verify-results/:eventId',
          'GET /api/system/stats',
          'POST /api/withdraw/request',
          'GET /api/withdraw/history',
          'GET /api/withdraw/admin/pending',
          'POST /api/withdraw/admin/approve/:id',
          'POST /api/withdraw/admin/reject/:id',
          'POST /api/deposits',
          'GET /api/deposits/user/:userId',
          'GET /api/deposits/admin/pending',
          'POST /api/deposits/admin/approve/:id',
          'POST /api/deposits/admin/reject/:id'
        ]
      });
    });

    // ✅ START SERVER
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎮 XOSS GAMING SERVER - PROFESSIONAL MERGED EDITION');
      console.log('='.repeat(60));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`🌐 Network: http://192.168.0.100:${PORT}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(60));
      console.log('\n📋 PROFESSIONAL ENDPOINTS:');
      console.log('🔧 System & Health:');
      console.log(`   📊 Health Check: http://192.168.0.100:${PORT}/api/health`);
      console.log(`   🗄️ DB Status: http://192.168.0.100:${PORT}/api/db-status`);
      console.log(`   📈 System Stats: http://192.168.0.100:${PORT}/api/system/stats`);
      console.log('\n💰 Payment System:');
      console.log(`   💰 Deposit Test: http://192.168.0.100:${PORT}/api/deposits/test`);
      console.log(`   💸 Withdrawals: http://192.168.0.100:${PORT}/api/withdraw/request`);
      console.log(`   📜 Withdrawal History: http://192.168.0.100:${PORT}/api/withdraw/history`);
      console.log('\n🔧 Database Operations:');
      console.log(`   🛠️ Direct Update: POST http://192.168.0.100:${PORT}/api/direct/update-results/:eventId`);
      console.log(`   🚀 Migration: POST http://192.168.0.100:${PORT}/api/migrate/add-results-fields`);
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

// ✅ Start the professional merged server
startServer();
