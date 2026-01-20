// routes/analytics.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// ==============================================
// 🔥 PUBLIC ANALYTICS ROUTES
// ==============================================

// ✅ Get platform overview (public)
router.get('/overview', analyticsController.getPlatformOverview);

// ==============================================
// 🔥 USER PROTECTED ANALYTICS ROUTES
// ==============================================

// ✅ Get user analytics (for authenticated user)
router.get('/user', auth, analyticsController.getUserAnalytics);

// ✅ Get match analytics (user view)
router.get('/matches', auth, analyticsController.getMatchAnalytics);

// ✅ Get tournament analytics (user view)
router.get('/tournaments', auth, analyticsController.getTournamentAnalytics);

// ==============================================
// 🔥 ADMIN ANALYTICS ROUTES
// ==============================================

// ✅ Get comprehensive financial analytics (admin only)
router.get('/financial', adminAuth, analyticsController.getFinancialAnalytics);

// ✅ Get performance metrics (admin only)
router.get('/performance', adminAuth, analyticsController.getPerformanceMetrics);

// ✅ Get dashboard summary (admin only)
router.get('/dashboard', adminAuth, analyticsController.getDashboardSummary);

// ==============================================
// 🔥 CUSTOM ANALYTICS REPORTS
// ==============================================

// ✅ Generate custom analytics report
router.post('/reports/generate', adminAuth, async (req, res) => {
  try {
    const { report_type, parameters } = req.body;
    
    let reportData;
    switch (report_type) {
      case 'user_growth':
        reportData = await analyticsController.getUserAnalytics({ query: parameters });
        break;
      case 'match_performance':
        reportData = await analyticsController.getMatchAnalytics({ query: parameters });
        break;
      case 'financial_summary':
        reportData = await analyticsController.getFinancialAnalytics({ query: parameters });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
    
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// ✅ Export analytics data
router.get('/export/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    let data;
    switch (type) {
      case 'users':
        const User = require('../models/User');
        data = await User.find().select('-password').lean();
        break;
      case 'matches':
        const Match = require('../models/Match');
        data = await Match.find().lean();
        break;
      case 'tournaments':
        const Tournament = require('../models/Tournament');
        data = await Tournament.find().lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }
    
    if (format === 'csv') {
      // Simple CSV conversion
      let csv = '';
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csv += headers.join(',') + '\n';
        
        data.forEach(item => {
          const row = headers.map(header => {
            const value = item[header];
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return `"${value}"`;
          });
          csv += row.join(',') + '\n';
        });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_analytics_${Date.now()}.csv`);
      return res.send(csv);
    }
    
    // Default JSON format
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

// ==============================================
// 🔥 REAL-TIME ANALYTICS
// ==============================================

// ✅ Get real-time dashboard data
router.get('/realtime/dashboard', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const [
      onlineUsers,
      activeMatches,
      activeTournaments,
      recentRegistrations
    ] = await Promise.all([
      // Online users (active in last 15 minutes)
      require('../models/User').countDocuments({
        lastActive: { $gte: new Date(now.getTime() - 15 * 60 * 1000) }
      }),
      
      // Active matches and tournaments
      require('../models/Match').countDocuments({ status: 'active' }),
      require('../models/Tournament').countDocuments({ status: 'active' }),
      
      // Recent registrations
      require('../models/User').countDocuments({
        createdAt: { $gte: oneHourAgo }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        metrics: {
          online_users: onlineUsers,
          active_matches: activeMatches,
          active_tournaments: activeTournaments,
          recent_registrations: recentRegistrations,
          server_time: now.toLocaleTimeString()
        },
        system_status: {
          server: 'online',
          database: 'connected',
          cache: 'active'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time data',
      error: error.message
    });
  }
});

// ✅ Get analytics trends
router.get('/trends/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { days = 7 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    let trends;
    switch (type) {
      case 'user_registrations':
        const User = require('../models/User');
        trends = await User.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }},
          { $sort: { "_id": 1 } }
        ]);
        break;
        
      case 'match_creations':
        const Match = require('../models/Match');
        trends = await Match.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }},
          { $sort: { "_id": 1 } }
        ]);
        break;
        
      case 'tournament_creations':
        const Tournament = require('../models/Tournament');
        trends = await Tournament.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }},
          { $sort: { "_id": 1 } }
        ]);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid trend type'
        });
    }
    
    res.json({
      success: true,
      data: {
        type,
        days: parseInt(days),
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        trends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get trends',
      error: error.message
    });
  }
});

module.exports = router;
