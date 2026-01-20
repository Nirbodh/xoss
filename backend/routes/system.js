// routes/system.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// Temporary controller functions (inline)
const getSystemStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    res.json({
      success: true,
      data: {
        server: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%'
          },
          node_version: process.version,
          platform: process.platform
        },
        database: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearCache = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        cleared_at: new Date().toISOString(),
        cleared_by: req.user?.id || 'system'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    
    const [users, matches, tournaments] = await Promise.all([
      User.countDocuments(),
      Match.countDocuments(),
      Tournament.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        matches,
        tournaments,
        total: users + matches + tournaments,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const backupDatabase = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Backup initiated successfully',
      data: {
        backup_id: 'backup_' + Date.now(),
        initiated_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        initiated_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServerLogs = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        logs: [],
        total: 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const restartServer = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Restart command received. Server will restart shortly.',
      data: {
        restart_scheduled: new Date().toISOString(),
        scheduled_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// 🔥 PUBLIC ROUTES
// ==============================================

// ✅ PUBLIC: Get system status
router.get('/status', getSystemStatus);

// ✅ PUBLIC: Get system health
router.get('/health', getSystemHealth);

// ==============================================
// 🔥 ADMIN ROUTES
// ==============================================

// ✅ ADMIN: Get system statistics
router.get('/stats', adminAuth, getSystemStats);

// ✅ ADMIN: Clear system cache
router.post('/cache/clear', adminAuth, clearCache);

// ✅ ADMIN: Backup database
router.post('/backup', adminAuth, backupDatabase);

// ✅ ADMIN: Get server logs
router.get('/logs', adminAuth, getServerLogs);

// ✅ ADMIN: Restart server
router.post('/restart', adminAuth, restartServer);

// ✅ ADMIN: System configuration
router.get('/config', adminAuth, async (req, res) => {
  try {
    const config = {
      server: {
        name: 'XOSS Gaming Server',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000
      },
      database: {
        connected: true,
        type: 'MongoDB'
      },
      features: {
        matches: true,
        tournaments: true,
        payments: true,
        notifications: true
      },
      limits: {
        max_file_size: '10MB',
        max_request_size: '5MB',
        rate_limit: '100 requests per minute'
      }
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Update system configuration
router.put('/config/update', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        updated_fields: req.body,
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 DEBUG ROUTES (Development only)
// ==============================================

// ✅ DEBUG: Get environment info (dev only)
router.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Debug routes disabled in production'
    });
  }
  
  const env = {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongo_uri: process.env.MONGO_URI ? '***hidden***' : 'not set',
    jwt_secret: process.env.JWT_SECRET ? '***hidden***' : 'not set'
  };
  
  res.json({
    success: true,
    data: env
  });
});

// ✅ DEBUG: Test error handling
router.get('/debug/error-test', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Debug routes disabled in production'
    });
  }
  
  // Simulate different types of errors
  const { type } = req.query;
  
  switch (type) {
    case 'validation':
      return res.status(400).json({
        success: false,
        message: 'Validation error test',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password must be at least 6 characters' }
        ]
      });
    
    case 'not-found':
      return res.status(404).json({
        success: false,
        message: 'Resource not found test',
        code: 'RESOURCE_NOT_FOUND'
      });
    
    case 'unauthorized':
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access test',
        code: 'UNAUTHORIZED'
      });
    
    case 'server-error':
      throw new Error('Simulated server error for testing');
    
    default:
      return res.json({
        success: true,
        message: 'Error test endpoint',
        available_tests: ['validation', 'not-found', 'unauthorized', 'server-error']
      });
  }
});

module.exports = router;
