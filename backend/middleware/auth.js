const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const loginRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
  blockDuration: 30 * 60
});

const auth = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    let token = extractToken(req);
    
    if (!token) {
      return sendAuthError(res, 'NO_TOKEN', 'Authentication token required', 401);
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return sendAuthError(res, 'INVALID_TOKEN', 'Invalid or malformed token', 401);
    }

    const user = await findUserWithCache(decoded.userId);
    
    if (!user) {
      return sendAuthError(res, 'USER_NOT_FOUND', 'User account not found', 401);
    }

    const securityCheck = await performSecurityChecks(user, req);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json(securityCheck.response);
    }

    req.user = {
      _id: user._id,
      userId: user._id,
      id: user._id,
      
      role: user.role || 'user',
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      phone: user.phone,
      avatar: user.avatar,
      
      wallet_balance: user.wallet?.balance || user.wallet_balance || user.balance || 0,
      wallet: user.wallet || {
        balance: user.wallet_balance || user.balance || 0,
        total_earned: user.total_earnings || 0,
        total_deposited: 0,
        total_withdrawn: 0
      },
      
      level: user.progression?.current || user.level || 1,
      experience: user.progression?.experience || user.experience || 0,
      progression: user.progression || {
        current: user.level || 1,
        experience: user.experience || 0,
        next_level_xp: 1000
      },
      
      matches_played: user.stats?.matches_played || user.matches_played || 0,
      matches_won: user.stats?.matches_won || user.matches_won || 0,
      stats: user.stats || {
        matches_played: user.matches_played || 0,
        matches_won: user.matches_won || 0,
        win_rate: 0,
        rank_score: 1000
      },
      
      is_active: user.is_active,
      is_verified: user.is_verified || user.verification?.email_verified || false,
      is_premium: user.is_premium || false,
      
      last_login: user.last_login,
      login_count: user.login_count || 0,
      ip_address: req.ip,
      
      permissions: getUserPermissions(user.role),
      features: getUserFeatures(user.role),
      
      created_at: user.createdAt,
      member_since: formatMemberSince(user.createdAt)
    };

    await updateUserActivity(user._id, req.ip);

    logAuthSuccess(req, user, Date.now() - startTime);
    
    next();

  } catch (error) {
    logAuthError(error, req, Date.now() - startTime);
    handleAuthError(res, error);
  }
};

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
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false,
      clockTolerance: 30
    });
  } catch (error) {
    return null;
  }
};

const findUserWithCache = async (userId) => {
  return await User.findById(userId)
    .select('-password -reset_password_token -reset_password_expires')
    .lean();
};

const performSecurityChecks = async (user, req) => {
  const checks = {
    valid: true,
    status: 200,
    response: null
  };

  if (user.is_active === false) {
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

  if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.is_verified) {
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
    moderator: ['approve_matches', 'manage_users', 'view_reports', 'all_user_permissions'],
    admin: ['all_permissions', 'system_settings', 'financial_management', 'user_management']
  };
  
  return permissions[role] || permissions.user;
};

const getUserFeatures = (role) => {
  const features = {
    user: ['basic_gaming', 'wallet', 'friends', 'notifications'],
    moderator: ['moderation_tools', 'analytics', 'all_user_features'],
    admin: ['admin_dashboard', 'system_controls', 'all_features']
  };
  
  return features[role] || features.user;
};

const updateUserActivity = async (userId, ip) => {
  await User.findByIdAndUpdate(userId, {
    $set: { last_login: new Date(), last_ip: ip },
    $inc: { login_count: 1 }
  }).catch(console.error);
};

const checkSuspiciousActivity = async (userId, currentIp) => {
  return false;
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
  const joinDate = new Date(date);
  const diffMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
  
  if (diffMonths < 1) return 'New Member';
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, async () => {
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

      const adminSecurity = await checkAdminSecurity(req.user._id);
      if (!adminSecurity.valid) {
        return res.status(403).json(adminSecurity.response);
      }

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
  return { valid: true };
};

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

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await findUserWithCache(decoded.userId);
        if (user && user.is_active) {
          req.user = {
            _id: user._id,
            userId: user._id,
            role: user.role || 'user',
            email: user.email,
            username: user.username,
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

module.exports = {
  auth,
  adminAuth,
  rateLimitedAuth,
  optionalAuth,
  apiKeyAuth,
  
  isAdmin: (user) => ['admin', 'moderator', 'super_admin'].includes(user?.role),
  isPremium: (user) => user?.is_premium || false,
  hasPermission: (user, permission) => {
    const permissions = getUserPermissions(user?.role);
    return permissions.includes(permission) || permissions.includes('all_permissions');
  }
};
