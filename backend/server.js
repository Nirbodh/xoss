// server.js - PRODUCTION ONLY VERSION
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
    console.log('🚀 Starting XOSS Gaming Production Server...');
    console.log('🔗 Connecting to MongoDB...');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully!');

    console.log('🛠️ Setting up production middleware...');

    // ✅ STRICT PRODUCTION CORS Configuration
    app.use(cors({
      origin: 'https://xoss.onrender.com', // শুধুমাত্র আপনার Production URL
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
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });

    // ✅ Production Request Logging Middleware
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      // শুধুমাত্র API কলের তথ্য লগ করুন, IP নয়
      console.log(`🌐 ${timestamp} ${req.method} ${req.originalUrl}`);
      next();
    });

    // ====================
    // ✅ PRODUCTION API ENDPOINTS
    // ====================

    console.log('🔄 Loading production API endpoints...');

    // ✅ 1. AUTHENTICATION ENDPOINTS
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        console.log('🔐 Production login attempt');
        
        const User = require('./models/User');
        const user = await User.findOne({ email });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024',
          { expiresIn: '30d' }
        );

        const Wallet = require('./models/Wallet');
        const wallet = await Wallet.findOne({ user: user._id });

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role
            },
            token: token,
            wallet: {
              balance: wallet?.balance || 0
            }
          }
        });
      } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Login failed. Please try again.'
        });
      }
    });

    app.post('/api/auth/register', async (req, res) => {
      try {
        const { name, email, password, phone } = req.body;
        console.log('📝 Production registration');
        
        const User = require('./models/User');
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
          });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
          name,
          email,
          password: hashedPassword,
          phone: phone || '',
          role: 'user',
          status: 'active'
        });

        await user.save();

        const Wallet = require('./models/Wallet');
        const wallet = new Wallet({
          user: user._id,
          balance: 0
        });
        await wallet.save();

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024',
          { expiresIn: '30d' }
        );

        res.status(201).json({
          success: true,
          message: 'Registration successful',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role
            },
            token: token,
            wallet: {
              balance: 0
            }
          }
        });
      } catch (error) {
        console.error('❌ Registration error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Registration failed. Please try again.'
        });
      }
    });

    // ✅ 2. MATCHES ENDPOINTS
    app.get('/api/matches', async (req, res) => {
      try {
        const Match = require('./models/Match');
        
        const matches = await Match.find({ 
          approval_status: 'approved',
          status: { $in: ['upcoming', 'live'] }
        })
        .sort({ schedule_time: 1 })
        .limit(20)
        .populate('created_by', 'name email');
        
        res.json({
          success: true,
          message: 'Matches fetched successfully',
          data: matches
        });
      } catch (error) {
        console.error('❌ Fetch matches error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to load matches'
        });
      }
    });

    // ✅ 3. TOURNAMENTS ENDPOINTS
    app.get('/api/tournaments', async (req, res) => {
      try {
        const Tournament = require('./models/Tournament');
        
        const tournaments = await Tournament.find({ 
          approval_status: 'approved',
          status: { $in: ['upcoming', 'live'] }
        })
        .sort({ schedule_time: 1 })
        .limit(20)
        .populate('created_by', 'name email');
        
        res.json({
          success: true,
          message: 'Tournaments fetched successfully',
          data: tournaments
        });
      } catch (error) {
        console.error('❌ Fetch tournaments error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to load tournaments'
        });
      }
    });

    // ✅ 4. EVENTS ENDPOINT
    app.get('/api/events', async (req, res) => {
      try {
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        
        const [matches, tournaments] = await Promise.all([
          Match.find({ 
            approval_status: 'approved',
            status: { $in: ['upcoming', 'live'] }
          })
          .sort({ schedule_time: 1 })
          .limit(10)
          .populate('created_by', 'name'),
          
          Tournament.find({ 
            approval_status: 'approved',
            status: { $in: ['upcoming', 'live'] }
          })
          .sort({ schedule_time: 1 })
          .limit(10)
          .populate('created_by', 'name')
        ]);

        const allEvents = [
          ...matches.map(m => ({ 
            ...m.toObject(), 
            eventType: 'match',
            id: m._id,
            availableSlots: m.max_participants - m.current_participants
          })),
          ...tournaments.map(t => ({ 
            ...t.toObject(), 
            eventType: 'tournament',
            id: t._id,
            availableSlots: t.max_participants - t.current_participants
          }))
        ].sort((a, b) => new Date(a.schedule_time) - new Date(b.schedule_time));

        res.json({
          success: true,
          message: 'Events fetched successfully',
          data: allEvents
        });
      } catch (error) {
        console.error('❌ Fetch events error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to load events'
        });
      }
    });

    // ✅ 5. WALLET ENDPOINTS
    app.get('/api/wallet/balance', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const Wallet = require('./models/Wallet');
        const wallet = await Wallet.findOne({ user: decoded.id });
        
        res.json({
          success: true,
          message: 'Balance fetched successfully',
          balance: wallet?.balance || 0,
          data: wallet || { balance: 0 }
        });
      } catch (error) {
        console.error('❌ Wallet balance error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch wallet balance'
        });
      }
    });

    app.get('/api/wallet/transactions', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const Transaction = require('./models/Transaction');
        const { limit = 10 } = req.query;
        
        const transactions = await Transaction.find({ user: decoded.id })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        
        res.json({
          success: true,
          message: 'Transactions fetched successfully',
          data: transactions
        });
      } catch (error) {
        console.error('❌ Transactions error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch transactions'
        });
      }
    });

    app.get('/api/wallet', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const Wallet = require('./models/Wallet');
        const wallet = await Wallet.findOne({ user: decoded.id });
        
        const Transaction = require('./models/Transaction');
        const recentTransactions = await Transaction.find({ user: decoded.id })
          .sort({ createdAt: -1 })
          .limit(5);

        res.json({
          success: true,
          message: 'Wallet data fetched successfully',
          data: {
            balance: wallet?.balance || 0,
            recentTransactions,
            totalDeposits: await Transaction.countDocuments({ 
              user: decoded.id, 
              type: 'deposit',
              status: 'completed'
            }),
            totalWithdrawals: await Transaction.countDocuments({ 
              user: decoded.id, 
              type: 'withdrawal',
              status: 'completed'
            })
          }
        });
      } catch (error) {
        console.error('❌ Wallet data error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch wallet data'
        });
      }
    });

    // ✅ 6. WITHDRAWAL ENDPOINTS
    app.post('/api/withdraw/request', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const { amount, paymentMethod, accountDetails } = req.body;
        
        if (!amount || !paymentMethod || !accountDetails) {
          return res.status(400).json({
            success: false,
            message: 'Amount, payment method, and account details are required'
          });
        }

        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid amount'
          });
        }

        const Wallet = require('./models/Wallet');
        const wallet = await Wallet.findOne({ user: decoded.id });
        
        if (!wallet || wallet.balance < withdrawAmount) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance'
          });
        }

        // Deduct from wallet immediately
        wallet.balance -= withdrawAmount;
        await wallet.save();

        const Withdrawal = require('./models/Withdrawal');
        const withdrawal = new Withdrawal({
          user: decoded.id,
          amount: withdrawAmount,
          paymentMethod,
          accountDetails,
          status: 'pending'
        });
        await withdrawal.save();

        const Transaction = require('./models/Transaction');
        const transaction = new Transaction({
          user: decoded.id,
          type: 'withdrawal',
          amount: withdrawAmount,
          description: `Withdrawal request via ${paymentMethod}`,
          status: 'pending'
        });
        await transaction.save();

        res.status(201).json({
          success: true,
          message: 'Withdrawal request submitted successfully',
          data: {
            withdrawalId: withdrawal._id,
            amount: withdrawAmount,
            newBalance: wallet.balance,
            status: 'pending',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Withdrawal request error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Withdrawal request failed'
        });
      }
    });

    app.get('/api/withdrawals', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const Withdrawal = require('./models/Withdrawal');
        const withdrawals = await Withdrawal.find({ user: decoded.id })
          .sort({ createdAt: -1 });
        
        res.json({
          success: true,
          message: 'Withdrawals fetched successfully',
          data: withdrawals
        });
      } catch (error) {
        console.error('❌ Get withdrawals error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch withdrawals'
        });
      }
    });

    // ✅ 7. DEPOSIT ENDPOINTS
    app.post('/api/wallet/deposit', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const { amount, method, transactionId } = req.body;
        
        if (!amount || !method) {
          return res.status(400).json({
            success: false,
            message: 'Amount and method are required'
          });
        }

        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid amount'
          });
        }

        const Deposit = require('./models/Deposit');
        const deposit = new Deposit({
          user: decoded.id,
          amount: depositAmount,
          method,
          transactionId: transactionId || `DEP${Date.now()}`,
          status: 'pending'
        });
        await deposit.save();

        const Transaction = require('./models/Transaction');
        const transaction = new Transaction({
          user: decoded.id,
          type: 'deposit',
          amount: depositAmount,
          description: `Deposit via ${method}`,
          status: 'pending'
        });
        await transaction.save();

        res.status(201).json({
          success: true,
          message: 'Deposit request submitted successfully',
          data: {
            depositId: deposit._id,
            amount: depositAmount,
            status: 'pending',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Deposit error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Deposit request failed'
        });
      }
    });

    app.get('/api/deposits', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
          });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024');
        
        const Deposit = require('./models/Deposit');
        const deposits = await Deposit.find({ user: decoded.id })
          .sort({ createdAt: -1 });
        
        res.json({
          success: true,
          message: 'Deposits fetched successfully',
          data: deposits
        });
      } catch (error) {
        console.error('❌ Get deposits error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch deposits'
        });
      }
    });

    // ✅ 8. USER PROFILE ENDPOINTS
    app.get('/api/users/:id/stats', async (req, res) => {
      try {
        const { id } = req.params;
        
        const Match = require('./models/Match');
        const Tournament = require('./models/Tournament');
        const Result = require('./models/Result');

        const [matchesPlayed, tournamentsPlayed, wins] = await Promise.all([
          Match.countDocuments({ participants: id, status: 'completed' }),
          Tournament.countDocuments({ participants: id, status: 'completed' }),
          Result.countDocuments({ user: id, position: 1 })
        ]);

        const totalEvents = matchesPlayed + tournamentsPlayed;
        const winRate = totalEvents > 0 ? (wins / totalEvents * 100).toFixed(2) : 0;

        const recentMatches = await Match.find({ participants: id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title game status total_prize');

        res.json({
          success: true,
          message: 'User stats fetched successfully',
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
        console.error('❌ User stats error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user stats'
        });
      }
    });

    // ✅ 9. HEALTH CHECK ENDPOINTS
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🎮 XOSS Gaming Production API Server',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
        uptime: process.uptime(),
        environment: 'production',
        baseUrl: 'https://xoss.onrender.com',
        endpoints: [
          '/api/auth/login',
          '/api/auth/register',
          '/api/matches',
          '/api/tournaments',
          '/api/events',
          '/api/wallet/balance',
          '/api/wallet/transactions',
          '/api/withdraw/request',
          '/api/wallet/deposit'
        ]
      });
    });

    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        message: 'Production server is running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1
      });
    });

    // ✅ 10. 404 HANDLER
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        requested: `${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          'POST /api/auth/login',
          'POST /api/auth/register',
          'GET /api/matches',
          'GET /api/tournaments',
          'GET /api/events',
          'GET /api/wallet/balance',
          'GET /api/wallet/transactions',
          'POST /api/withdraw/request',
          'POST /api/wallet/deposit',
          'GET /api/withdrawals',
          'GET /api/deposits',
          'GET /api/users/:id/stats'
        ]
      });
    });

    // ✅ 11. ERROR HANDLER
    app.use((err, req, res, next) => {
      console.error('💥 Production server error:', err.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });

    // ====================
    // ✅ START PRODUCTION SERVER
    // ====================

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('🎮 XOSS GAMING PRODUCTION SERVER');
      console.log('='.repeat(70));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌐 Production URL: https://xoss.onrender.com`);
      console.log(`🔌 API Base URL: https://xoss.onrender.com/api`);
      console.log(`⚡ Environment: PRODUCTION`);
      console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log('='.repeat(70));
      console.log('\n📋 PRODUCTION ENDPOINTS:');
      console.log('   🔐 /api/auth/login');
      console.log('   📝 /api/auth/register');
      console.log('   🎮 /api/matches');
      console.log('   🏆 /api/tournaments');
      console.log('   📅 /api/events');
      console.log('   💰 /api/wallet/balance');
      console.log('   💳 /api/wallet/transactions');
      console.log('   🏧 /api/withdraw/request');
      console.log('   💵 /api/wallet/deposit');
      console.log('='.repeat(70));
      console.log('🚀 Production server ready!');
      console.log('='.repeat(70));
    });

    // ✅ GRACEFUL SHUTDOWN
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log('✅ HTTP server closed.');
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB connection closed.');
          console.log('👋 Graceful shutdown completed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  }
};

// ✅ Start the production server
startServer();
