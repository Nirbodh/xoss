// middleware/auth.js - COMPLETELY FIXED VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid - user not found' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    req.user = { 
      userId: decoded.userId, 
      role: user.role,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

// ✅ FIXED: adminAuth function - NOT calling auth() directly
const adminAuth = async (req, res, next) => {
  try {
    // First get the token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid - user not found' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    // Check if user is admin or moderator
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required. Your role: ' + user.role 
      });
    }

    // Add user to request
    req.user = { 
      userId: decoded.userId, 
      role: user.role,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Admin authentication failed: ' + error.message 
    });
  }
};

// Optional: Super admin only middleware
const superAdminAuth = async (req, res, next) => {
  try {
    // Same as adminAuth but only for admin (not moderator)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid - user not found' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    // Only admin (not moderator)
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Super admin access required. Your role: ' + user.role 
      });
    }

    req.user = { 
      userId: decoded.userId, 
      role: user.role,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Super admin authentication failed' 
    });
  }
};

module.exports = { 
  auth, 
  adminAuth, 
  superAdminAuth 
};
