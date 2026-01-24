// middleware/auth.js - PRODUCTION PRO VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiter for auth attempts
const loginRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 15 * 60, // per 15 minutes
  blockDuration: 30 * 60 // block for 30 minutes
});

const auth = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Extract token from various sources
    let token = extractToken(req);
    
    if (!token) {
      return sendAuthError(res, 'NO_TOKEN', 'Authentication token required', 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return sendAuthError(res, 'INVALID_TOKEN', 'Invalid or malformed token', 401);
    }

    // Find user with cache consideration
    const user = await findUserWithCache(decoded.userId);
    
    if (!user) {
      return sendAuthError(res, 'USER_NOT_FOUND', 'User account not found', 401);
    }

    // Security checks
    const securityCheck = await performSecurityChecks(user, req);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json(securityCheck.response);
    }

    // Attach enhanced user object - FIXED FOR User.js SCHEMA
    req.user = {
      // Core identifiers
      _id: user._id,
      userId: user._id,
      id: user._id,
      
      // User info
      role: user.role || 'user',
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      phone: user.phone || '',
      avatar: user.avatar || 'https://res.cloudinary.com/xoss/image/upload/v1/default_avatar.png',
      
      // Financial - COMPATIBLE WITH BOTH SCHEMAS
      wallet_balance: user.wallet_balance || user.wallet?.balance || user.balance || 0,
      total_earnings: user.total_earnings || user.wallet?.total_earned || 0,
      total_deposits: user.total_deposits || user.wallet?.total_deposited || 0,
      total_withdrawals: user.total_withdrawals || user.wallet?.total_withdrawn || 0,
      
      // OLD SCHEMA COMPATIBILITY
      balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
      
      // NEW SCHEMA COMPATIBILITY
      wallet: {
        balance: user.wallet_balance || user.wallet?.balance || user.balance || 0,
        total_earned: user.total_earnings || user.wallet?.total_earned || 0,
        total_deposited: user.wallet?.total_deposited || 0,
        total_withdrawn: user.wallet?.total_withdrawn || 0,
        total_won: user.wallet?.total_won || 0,
        total_lost: user.wallet?.total_lost || 0
      },
      
      // Status
      is_active: user.is_active !== false,
      is_verified: user.is_verified || false,
      is_premium: user.is_premium || false,
      
      // Gaming stats - COMPATIBLE WITH BOTH SCHEMAS
      level: user.level || user.progression?.current || 1,
      experience: user.experience || user.progression?.experience || 0,
      matches_played: user.matches_played || user.stats?.matches_played || 0,
      matches_won: user.matches_won || user.stats?.matches_won || 0,
      favorite_game: user.favorite_game || user.gaming?.favorite_game || 'Free Fire',
      
      // Progression - NEW SCHEMA
      progression: user.progression || {
        current: user.level || 1,
        experience: user.experience || 0,
        next_level_xp: 1000
      },
      
      // Stats - NEW SCHEMA
      stats: user.stats || {
        matches_played: user.matches_played || 0,
        matches_won: user.matches_won || 0,
        win_rate: 0
      },
      
      // Gaming - NEW SCHEMA
      gaming: user.gaming || {
        favorite_game: user.favorite_game || 'Free Fire',
        favorite_mode: 'Ranked'
      },
      
      // Security
      last_login: user.last_login,
      login_count: user.login_count || 0,
      ip_address: req.ip,
      
      // Permissions
      permissions: getUserPermissions(user.role),
      features: getUserFeatures(user.role),
      
      // Account Status
      account_status: user.account_status || 'active',
      
      // Metadata
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      member_since: formatMemberSince(user.createdAt)
    };

    // Update last activity
    await updateUserActivity(user._id, req.ip);

    // Log successful auth
    logAuthSuccess(req, user, Date.now() - startTime);
    
    next();

  } catch (error) {
    logAuthError(error, req, Date.now() - startTime);
    handleAuthError(res, error);
  }
};

// Helper functions
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const queryToken = req.query.token;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (cookieToken) {
    return cookieToken;
  }
  if (queryToken) {
    return queryToken;
  }
  return null;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024', {
      algorithms: ['HS256'],
      ignoreExpiration: false,
      clockTolerance: 30
    });
  } catch (error) {
    return null;
  }
};

const findUserWithCache = async (userId) => {
  // In production, you can add Redis cache here
  return await User.findById(userId)
    .select('-password -reset_password_token -reset_password_expires -email_verification_token -email_verification_expires')
    .lean();
};

const performSecurityChecks = async (user, req) => {
  const checks = {
    valid: true,
    status: 200,
    response: null
  };

  // Check if account is active
  if (user.is_active === false || user.account_status === 'suspended' || user.account_status === 'banned') {
    checks.valid = false;
    checks.status = 403;
    checks.response = {
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Your account has been suspended',
      support_contact: 'support@xossgaming.com',
      timestamp: new Date().toISOString()
    };
    return checks;
  }

  // Check if email is verified (optional based on settings)
  if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.is_verified && !user.verification?.email_verified) {
    checks.valid = false;
    checks.status = 403;
    checks.response = {
      success: false,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address',
      resend_url: '/api/auth/resend-verification',
      timestamp: new Date().toISOString()
    };
    return checks;
  }

  // Check for suspicious activity (multiple IPs, etc.)
  const suspicious = await checkSuspiciousActivity(user._id, req.ip);
  if (suspicious) {
    checks.valid = false;
    checks.status = 403;
    checks.response = {
      success: false,
      code: 'SUSPICIOUS_ACTIVITY',
      message: 'Suspicious activity detected. Please contact support.',
      support_contact: 'support@xossgaming.com',
      timestamp: new Date().toISOString()
    };
    return checks;
  }

  return checks;
};

const getUserPermissions = (role) => {
  const permissions = {
    user: ['create_match', 'join_match', 'withdraw', 'deposit', 'view_profile'],
    premium_user: ['create_match', 'join_match', 'withdraw', 'deposit', 'view_profile', 'premium_features'],
    moderator: ['approve_matches', 'manage_users', 'view_reports', 'all_user_permissions'],
    admin: ['all_permissions', 'system_settings', 'financial_management', 'user_management'],
    super_admin: ['all_permissions', 'system_settings', 'financial_management', 'user_management']
  };
  
  return permissions[role] || permissions.user;
};

const getUserFeatures = (role) => {
  const features = {
    user: ['basic_gaming', 'wallet', 'friends', 'notifications'],
    premium_user: ['basic_gaming', 'wallet', 'friends', 'notifications', 'premium_games', 'priority_support'],
    moderator: ['moderation_tools', 'analytics', 'all_user_features'],
    admin: ['admin_dashboard', 'system_controls', 'all_features'],
    super_admin: ['admin_dashboard', 'system_controls', 'all_features']
  };
  
  return features[role] || features.user;
};

const updateUserActivity = async (userId, ip) => {
  await User.findByIdAndUpdate(userId, {
    $set: { 
      last_login: new Date(), 
      last_ip: ip,
      'metadata.last_active': new Date()
    },
    $inc: { login_count: 1 }
  }).catch(console.error);
};

const checkSuspiciousActivity = async (userId, currentIp) => {
  // Implement suspicious activity detection logic
  // Check for multiple IP addresses, rapid logins, etc.
  return false; // Return true if suspicious
};

const logAuthSuccess = (req, user, duration) => {
  console.log(`✅ AUTH SUCCESS | User: ${user.username} (${user.role}) | IP: ${req.ip} | Duration: ${duration}ms`);
};

const logAuthError = (error, req, duration) => {
  console.error(`🔴 AUTH FAILED | IP: ${req.ip} | Error: ${error.message} | Duration: ${duration}ms`);
};

const sendAuthError = (res, code, message, status = 401) => {
  return res.status(status).json({
    success: false,
    code: code,
    message: message,
    timestamp: new Date().toISOString(),
    docs: 'https://xoss.onrender.com/api/docs#authentication'
  });
};

const handleAuthError = (res, error) => {
  let code = 'AUTH_ERROR';
  let message = 'Authentication failed';
  let status = 500;

  switch (error.name) {
    case 'JsonWebTokenError':
      code = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
      status = 401;
      break;
    case 'TokenExpiredError':
      code = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
      status = 401;
      break;
    case 'MongoError':
      code = 'DATABASE_ERROR';
      message = 'Database connection error';
      status = 503;
      break;
  }

  return sendAuthError(res, code, message, status);
};

const formatMemberSince = (date) => {
  if (!date) return 'Recently';
  const now = new Date();
  const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  
  if (diffMonths < 1) return 'New Member';
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  
  const years = Math.floor(diffMonths / 12);
  return `${years} year${years > 1 ? 's' : ''}`;
};

// Admin authentication with enhanced security
const adminAuth = async (req, res, next) => {
  try {
    // First authenticate normally
    await auth(req, res, async () => {
      // Check admin role
      if (!['admin', 'moderator', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          code: 'ADMIN_ACCESS_REQUIRED',
          message: 'Administrator access required',
          required_roles: ['admin', 'moderator', 'super_admin'],
          your_role: req.user.role,
          timestamp: new Date().toISOString()
        });
      }

      // Additional admin security checks
      const adminSecurity = await checkAdminSecurity(req.user._id);
      if (!adminSecurity.valid) {
        return res.status(403).json(adminSecurity.response);
      }

      // Log admin access
      console.log(`👑 ADMIN ACCESS | User: ${req.user.username} | Endpoint: ${req.originalUrl}`);

      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_AUTH_ERROR',
      message: 'Admin authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

const checkAdminSecurity = async (userId) => {
  // Add additional security checks for admin access
  // Example: Check if admin account is locked, requires 2FA, etc.
  return { valid: true };
};

// Rate limited authentication for login endpoints
const rateLimitedAuth = (req, res, next) => {
  const key = req.ip;
  
  loginRateLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Please try again later.',
        retry_after: '30 minutes',
        timestamp: new Date().toISOString()
      });
    });
};

// Optional authentication (for public endpoints that can work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await findUserWithCache(decoded.userId);
        if (user && user.is_active !== false) {
          req.user = {
            _id: user._id,
            userId: user._id,
            role: user.role || 'user',
            email: user.email,
            username: user.username,
            wallet_balance: user.wallet_balance || user.wallet?.balance || 0,
            is_authenticated: true
          };
        }
      }
    }
    
    if (!req.user) {
      req.user = { is_authenticated: false, role: 'guest' };
    }
    
    next();
  } catch (error) {
    req.user = { is_authenticated: false, role: 'guest' };
    next();
  }
};

// API key authentication for microservices
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      code: 'API_KEY_REQUIRED',
      message: 'API key is required for this endpoint',
      timestamp: new Date().toISOString()
    });
  }

  const validKeys = [
    process.env.ADMIN_API_KEY,
    process.env.WEBHOOK_API_KEY,
    process.env.MICROSERVICE_API_KEY
  ];

  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      code: 'INVALID_API_KEY',
      message: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }

  req.apiKey = apiKey;
  next();
};

// Export all middleware
module.exports = {
  auth,
  adminAuth,
  rateLimitedAuth,
  optionalAuth,
  apiKeyAuth,
  
  // Utility functions for controllers
  isAdmin: (user) => ['admin', 'moderator', 'super_admin'].includes(user?.role),
  isPremium: (user) => user?.is_premium || false,
  hasPermission: (user, permission) => {
    const permissions = getUserPermissions(user?.role);
    return permissions.includes(permission) || permissions.includes('all_permissions');
  }
};
