// middleware/auth.js - COMPLETELY FIXED & ENHANCED VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ✅ STANDARD AUTH MIDDLEWARE
 * Validates JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token = req.header('Authorization');
    
    if (!token) {
      // Try from cookie
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        code: 'NO_TOKEN',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss_gaming_secret_2024');
    
    // Find user in database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated',
        timestamp: new Date().toISOString()
      });
    }

    // Attach user to request object
    req.user = { 
      _id: user._id,
      userId: user._id, 
      id: user._id,
      role: user.role || 'user',
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      wallet_balance: user.wallet_balance || 0,
      phone: user.phone,
      avatar: user.avatar,
      is_active: user.is_active
    };
    
    // Add token to request for logging
    req.token = token;
    
    console.log(`🔐 Auth successful - User: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    console.error('🔴 Auth middleware error:', error.message);
    
    let errorCode = 'AUTH_ERROR';
    let errorMessage = 'Authentication failed';
    let statusCode = 401;

    if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      errorMessage = 'Invalid or malformed token';
    } else if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Token has expired';
      statusCode = 401;
    } else if (error.name === 'CastError') {
      errorCode = 'INVALID_USER_ID';
      errorMessage = 'Invalid user ID format';
    }

    res.status(statusCode).json({ 
      success: false,
      code: errorCode,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ✅ ADMIN AUTH MIDDLEWARE
 * Requires admin or moderator role
 */
const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token = req.header('Authorization');
    
    if (!token) {
      // Try from cookie
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        code: 'NO_TOKEN',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss_gaming_secret_2024');
    
    // Find user in database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated',
        timestamp: new Date().toISOString()
      });
    }

    // Check admin privileges
    const allowedRoles = ['admin', 'moderator', 'super_admin'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        success: false,
        code: 'ACCESS_DENIED',
        message: 'Admin access required',
        userRole: user.role,
        requiredRoles: allowedRoles,
        timestamp: new Date().toISOString()
      });
    }

    // Attach user to request object
    req.user = { 
      _id: user._id,
      userId: user._id, 
      id: user._id,
      role: user.role,
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      wallet_balance: user.wallet_balance || 0,
      phone: user.phone,
      avatar: user.avatar,
      is_active: user.is_active
    };
    
    // Add token to request for logging
    req.token = token;
    
    console.log(`👑 Admin auth successful - User: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    console.error('🔴 Admin auth middleware error:', error.message);
    
    let errorCode = 'ADMIN_AUTH_ERROR';
    let errorMessage = 'Admin authentication failed';
    let statusCode = 401;

    if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      errorMessage = 'Invalid or malformed token';
    } else if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Token has expired';
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false,
      code: errorCode,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ✅ SUPER ADMIN AUTH MIDDLEWARE
 * Requires admin role only (not moderator)
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token = req.header('Authorization');
    
    if (!token) {
      // Try from cookie
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        code: 'NO_TOKEN',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss_gaming_secret_2024');
    
    // Find user in database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated',
        timestamp: new Date().toISOString()
      });
    }

    // Check super admin privileges (only admin role)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        code: 'ACCESS_DENIED',
        message: 'Super admin access required',
        userRole: user.role,
        requiredRole: 'admin',
        timestamp: new Date().toISOString()
      });
    }

    // Attach user to request object
    req.user = { 
      _id: user._id,
      userId: user._id, 
      id: user._id,
      role: user.role,
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      wallet_balance: user.wallet_balance || 0,
      phone: user.phone,
      avatar: user.avatar,
      is_active: user.is_active
    };
    
    // Add token to request for logging
    req.token = token;
    
    console.log(`👑 Super admin auth successful - User: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    console.error('🔴 Super admin auth middleware error:', error.message);
    
    let errorCode = 'SUPER_ADMIN_AUTH_ERROR';
    let errorMessage = 'Super admin authentication failed';
    let statusCode = 401;

    if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      errorMessage = 'Invalid or malformed token';
    } else if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Token has expired';
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false,
      code: errorCode,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ✅ OPTIONAL AUTH MIDDLEWARE
 * Attaches user if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token = req.header('Authorization');
    
    if (!token) {
      // Try from cookie
      token = req.cookies?.token;
    }
    
    if (!token) {
      // No token, continue without user
      req.user = null;
      return next();
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss_gaming_secret_2024');
    
    // Find user in database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user || user.is_active === false) {
      // Invalid or deactivated user, continue without user
      req.user = null;
      return next();
    }

    // Attach user to request object
    req.user = { 
      _id: user._id,
      userId: user._id, 
      id: user._id,
      role: user.role || 'user',
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      wallet_balance: user.wallet_balance || 0,
      phone: user.phone,
      avatar: user.avatar,
      is_active: user.is_active
    };
    
    console.log(`👤 Optional auth - User: ${user.username}`);
    next();
  } catch (error) {
    // Invalid token, continue without user
    console.log('🔴 Optional auth failed, continuing without user');
    req.user = null;
    next();
  }
};

/**
 * ✅ API KEY AUTH MIDDLEWARE
 * For server-to-server communication
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      code: 'API_KEY_REQUIRED',
      message: 'API key is required',
      timestamp: new Date().toISOString()
    });
  }

  const validApiKeys = [
    process.env.ADMIN_API_KEY,
    process.env.WEBHOOK_API_KEY,
    'xoss_gaming_api_key_2024'
  ];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({ 
      success: false,
      code: 'INVALID_API_KEY',
      message: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }

  console.log('🔑 API key authentication successful');
  next();
};

/**
 * ✅ RATE LIMIT BY USER ID
 * Prevents spam from authenticated users
 */
const userRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

const rateLimitByUser = (req, res, next) => {
  const userId = req.user?.userId || req.ip;
  const now = Date.now();
  
  if (!userRateLimit.has(userId)) {
    userRateLimit.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return next();
  }
  
  const userData = userRateLimit.get(userId);
  
  if (now > userData.resetTime) {
    // Reset window
    userData.count = 1;
    userData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (userData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((userData.resetTime - now) / 1000),
      timestamp: new Date().toISOString()
    });
  }
  
  userData.count++;
  next();
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of userRateLimit.entries()) {
    if (now > data.resetTime + 60000) { // Keep for 1 extra minute
      userRateLimit.delete(userId);
    }
  }
}, 60000); // Clean every minute

/**
 * ✅ CORS MIDDLEWARE
 */
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * ✅ LOGGING MIDDLEWARE
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`📨 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user?.username || 'Guest'}`);
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send function to log response
  res.send = function(body) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log response
    console.log(`📤 [${timestamp}] ${req.method} ${req.originalUrl} - Status: ${statusCode} - Duration: ${duration}ms`);
    
    // Call original send
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * ✅ ERROR HANDLING MIDDLEWARE
 */
const errorHandler = (err, req, res, next) => {
  console.error('💥 Global error handler:', err);
  
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * ✅ NOT FOUND MIDDLEWARE
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    code: 'ENDPOINT_NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    documentation: `${process.env.BASE_URL || 'https://xoss.onrender.com'}/api/docs`
  });
};

/**
 * ✅ REQUEST VALIDATION MIDDLEWARE
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          errors: errors,
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    } catch (error) {
      console.error('🔴 Request validation error:', error);
      res.status(500).json({
        success: false,
        code: 'VALIDATION_PROCESS_ERROR',
        message: 'Failed to validate request',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * ✅ FILE UPLOAD VALIDATION
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    const { mimetype, size } = req.file;
    
    // Check file type
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE_TYPE',
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check file size
    if (size > maxSize) {
      return res.status(400).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

// Export all middleware functions
module.exports = {
  auth,
  adminAuth,
  superAdminAuth,
  optionalAuth,
  apiKeyAuth,
  rateLimitByUser,
  corsMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
  validateRequest,
  validateFileUpload,
  
  // Helper functions
  getUserId: (req) => req.user?.userId || req.user?._id,
  getUserRole: (req) => req.user?.role || 'user',
  isAdmin: (req) => ['admin', 'moderator', 'super_admin'].includes(req.user?.role),
  isSuperAdmin: (req) => req.user?.role === 'admin' || req.user?.role === 'super_admin'
};
