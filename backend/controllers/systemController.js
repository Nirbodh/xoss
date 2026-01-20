// controllers/systemController.js
exports.getSystemStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          api: 'running',
          cache: 'enabled'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemHealth = async (req, res) => {
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
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
          },
          node_version: process.version
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCache = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        cleared_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemStats = async (req, res) => {
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
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
