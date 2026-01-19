// middleware/admin.js - ADMIN MIDDLEWARE WITH ENHANCED SECURITY
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiter for admin actions
const adminActionLimiter = new RateLimiterMemory({
  points: 100, // 100 actions
  duration: 15 * 60, // per 15 minutes
  blockDuration: 30 * 60 // block for 30 minutes
});

// Rate limiter for sensitive admin actions (like delete, ban)
const sensitiveActionLimiter = new RateLimiterMemory({
  points: 10, // 10 actions
  duration: 15 * 60, // per 15 minutes
  blockDuration: 60 * 60 // block for 1 hour
});

/**
 * Main admin authentication middleware
 * Checks if user is admin and has required permissions
 */
const adminAuth = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // First check if user is authenticated (require token)
    let token = extractToken(req);
    
    if (!token) {
      return sendAdminError(res, 'NO_TOKEN', 'Admin access requires authentication token', 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return sendAdminError(res, 'INVALID_TOKEN', 'Invalid or malformed token', 401);
    }

    // Find user with admin privileges check
    const user = await findAdminUser(decoded.userId);
    
    if (!user) {
      return sendAdminError(res, 'USER_NOT_FOUND', 'User account not found', 401);
    }

    // Check if user has admin role
    if (!isAdminRole(user.role)) {
      return sendAdminError(res, 'ADMIN_ACCESS_REQUIRED', 'Administrator access required', 403);
    }

    // Admin-specific security checks
    const adminSecurity = await performAdminSecurityChecks(user, req);
    if (!adminSecurity.valid) {
      return res.status(adminSecurity.status).json(adminSecurity.response);
    }

    // Attach enhanced admin user object
    req.user = {
      // Core identifiers
      _id: user._id,
      userId: user._id,
      id: user._id,
      
      // User info
      role: user.role,
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      phone: user.phone,
      avatar: user.avatar,
      
      // Admin specific info
      admin_level: getAdminLevel(user.role),
      admin_permissions: getAdminPermissions(user.role),
      admin_features: getAdminFeatures(user.role),
      admin_since: user.admin_since || user.createdAt,
      
      // Status
      is_active: user.is_active,
      is_verified: user.is_verified,
      is_admin: true,
      
      // Security
      last_login: user.last_login,
      login_count: user.login_count || 0,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      
      // Metadata
      created_at: user.createdAt,
      member_since: formatMemberSince(user.createdAt)
    };

    // Update admin last activity
    await updateAdminActivity(user._id, req.ip, req.originalUrl);

    // Log admin access
    logAdminAccess(req, user, Date.now() - startTime);
    
    next();

  } catch (error) {
    logAdminError(error, req, Date.now() - startTime);
    handleAdminError(res, error);
  }
};

/**
 * Super Admin authentication (highest level access)
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // First authenticate as admin
    await adminAuth(req, res, () => {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          code: 'SUPER_ADMIN_REQUIRED',
          message: 'Super administrator access required',
          required_role: 'super_admin',
          your_role: req.user.role,
          timestamp: new Date().toISOString(),
          docs: 'https://xoss.onrender.com/api/docs#admin-access'
        });
      }

      // Additional super admin checks
      const superAdminCheck = checkSuperAdminSecurity(req.user._id);
      if (!superAdminCheck.valid) {
        return res.status(403).json(superAdminCheck.response);
      }

      // Log super admin access
      console.log(`👑🔒 SUPER ADMIN ACCESS | User: ${req.user.username} | Endpoint: ${req.originalUrl} | IP: ${req.ip}`);

      next();
    });
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({
      success: false,
      code: 'SUPER_ADMIN_AUTH_ERROR',
      message: 'Super admin authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of allowed roles
 */
const roleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // First authenticate as admin
      await adminAuth(req, res, () => {
        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            code: 'ROLE_ACCESS_DENIED',
            message: 'Insufficient role privileges',
            required_roles: allowedRoles,
            your_role: req.user.role,
            timestamp: new Date().toISOString()
          });
        }

        // Log role-based access
        console.log(`🎭 ROLE ACCESS [${allowedRoles.join(',')}] | User: ${req.user.username} (${req.user.role})`);

        next();
      });
    } catch (error) {
      console.error('Role auth error:', error);
      res.status(500).json({
        success: false,
        code: 'ROLE_AUTH_ERROR',
        message: 'Role-based authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Permission-based access control middleware
 * @param {String} requiredPermission - Required permission
 */
const permissionAuth = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // First authenticate as admin
      await adminAuth(req, res, () => {
        // Check if user has the required permission
        if (!hasPermission(req.user, requiredPermission)) {
          return res.status(403).json({
            success: false,
            code: 'PERMISSION_DENIED',
            message: 'Insufficient permissions',
            required_permission: requiredPermission,
            user_permissions: req.user.admin_permissions,
            timestamp: new Date().toISOString()
          });
        }

        // Log permission-based access
        console.log(`🔐 PERMISSION ACCESS [${requiredPermission}] | User: ${req.user.username}`);

        next();
      });
    } catch (error) {
      console.error('Permission auth error:', error);
      res.status(500).json({
        success: false,
        code: 'PERMISSION_AUTH_ERROR',
        message: 'Permission-based authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Rate-limited admin actions middleware
 */
const rateLimitedAdmin = (actionType = 'general') => {
  return (req, res, next) => {
    const key = `${req.user?.id || req.ip}:${actionType}`;
    const limiter = actionType === 'sensitive' ? sensitiveActionLimiter : adminActionLimiter;
    
    limiter.consume(key)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(429).json({
          success: false,
          code: 'ADMIN_RATE_LIMITED',
          message: 'Too many admin actions. Please slow down.',
          action_type: actionType,
          retry_after: actionType === 'sensitive' ? '1 hour' : '30 minutes',
          timestamp: new Date().toISOString()
        });
      });
  };
};

/**
 * Audit log middleware for admin actions
 */
const auditLog = (action, details = {}) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to log after response
    res.send = function(data) {
      // Log admin action to database (you can implement this)
      logAdminActionToDB({
        admin_id: req.user?._id,
        admin_email: req.user?.email,
        action: action,
        endpoint: req.originalUrl,
        method: req.method,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        request_body: req.body,
        request_params: req.params,
        request_query: req.query,
        response_status: res.statusCode,
        response_body: typeof data === 'string' ? JSON.parse(data || '{}') : data,
        additional_details: details,
        timestamp: new Date()
      });

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

// ====================
// HELPER FUNCTIONS
// ====================

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

const findAdminUser = async (userId) => {
  return await User.findById(userId)
    .select('-password -reset_password_token -reset_password_expires')
    .lean();
};

const isAdminRole = (role) => {
  return ['admin', 'moderator', 'super_admin', 'support'].includes(role);
};

const getAdminLevel = (role) => {
  const levels = {
    'super_admin': 3,
    'admin': 2,
    'moderator': 1,
    'support': 1
  };
  return levels[role] || 0;
};

const getAdminPermissions = (role) => {
  const permissions = {
    'support': [
      'view_users',
      'view_tickets',
      'reply_tickets',
      'view_transactions'
    ],
    'moderator': [
      'manage_users',
      'manage_matches',
      'manage_tournaments',
      'view_reports',
      'approve_content',
      'all_support_permissions'
    ],
    'admin': [
      'financial_management',
      'user_management',
      'content_management',
      'system_settings',
      'view_analytics',
      'manage_admins',
      'all_moderator_permissions'
    ],
    'super_admin': [
      'all_permissions',
      'system_configuration',
      'database_management',
      'api_management',
      'security_settings',
      'backup_restore',
      'all_admin_permissions'
    ]
  };
  
  return permissions[role] || [];
};

const getAdminFeatures = (role) => {
  const features = {
    'support': ['support_dashboard', 'ticket_system', 'user_profiles'],
    'moderator': ['moderation_tools', 'content_approval', 'reports_dashboard'],
    'admin': ['admin_dashboard', 'financial_reports', 'user_analytics', 'system_logs'],
    'super_admin': ['super_admin_panel', 'system_config', 'api_console', 'database_admin']
  };
  
  return features[role] || [];
};

const hasPermission = (user, permission) => {
  if (!user || !user.admin_permissions) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  // Check if user has the permission
  return user.admin_permissions.includes(permission) || 
         user.admin_permissions.includes('all_permissions');
};

const performAdminSecurityChecks = async (user, req) => {
  const checks = {
    valid: true,
    status: 200,
    response: null
  };

  // Check if admin account is active
  if (user.is_active === false) {
    checks.valid = false;
    checks.status = 403;
    checks.response = {
      success: false,
      code: 'ADMIN_ACCOUNT_SUSPENDED',
      message: 'Admin account has been suspended',
      support_contact: 'superadmin@xossgaming.com',
      timestamp: new Date().toISOString()
    };
    return checks;
  }

  // Check if admin requires 2FA (if implemented)
  if (user.require_2fa && !req.headers['x-2fa-token']) {
    checks.valid = false;
    checks.status = 403;
    checks.response = {
      success: false,
      code: '2FA_REQUIRED',
      message: 'Two-factor authentication required for admin access',
      timestamp: new Date().toISOString()
    };
    return checks;
  }

  // Check for suspicious admin activity
  const suspicious = await checkAdminSuspiciousActivity(user._id, req.ip);
  if (suspicious) {
    checks.valid = false;
    checks.status = 403;
    checks.response = {
      success: false,
      code: 'SUSPICIOUS_ADMIN_ACTIVITY',
      message: 'Suspicious admin activity detected. Account temporarily locked.',
      security_contact: 'security@xossgaming.com',
      timestamp: new Date().toISOString()
    };
    return checks;
  }

  // Check admin access hours (if configured)
  if (user.access_hours) {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < user.access_hours.start || currentHour > user.access_hours.end) {
      checks.valid = false;
      checks.status = 403;
      checks.response = {
        success: false,
        code: 'ACCESS_HOURS_RESTRICTED',
        message: `Admin access allowed only between ${user.access_hours.start}:00 and ${user.access_hours.end}:00`,
        current_time: now.toISOString(),
        timestamp: new Date().toISOString()
      };
      return checks;
    }
  }

  return checks;
};

const checkSuperAdminSecurity = (userId) => {
  // Add additional security checks for super admin
  // Example: Check IP whitelist, require VPN, etc.
  return { valid: true };
};

const checkAdminSuspiciousActivity = async (userId, currentIp) => {
  // Implement suspicious activity detection for admins
  // More strict than regular users
  return false;
};

const updateAdminActivity = async (userId, ip, endpoint) => {
  await User.findByIdAndUpdate(userId, {
    $set: { 
      last_login: new Date(),
      last_ip: ip,
      last_admin_action: new Date(),
      last_admin_endpoint: endpoint
    },
    $inc: { 
      login_count: 1,
      admin_action_count: 1 
    }
  }).catch(console.error);
};

const logAdminActionToDB = async (logData) => {
  // Implement database logging for admin actions
  // You can create an AdminLog model and save logs
  console.log(`📝 ADMIN ACTION LOG:`, {
    admin: logData.admin_email,
    action: logData.action,
    endpoint: logData.endpoint,
    timestamp: logData.timestamp.toISOString()
  });
  
  // Example implementation:
  /*
  const AdminLog = require('../models/AdminLog');
  await AdminLog.create(logData);
  */
};

const logAdminAccess = (req, user, duration) => {
  console.log(`👑 ADMIN ACCESS | User: ${user.username} (${user.role}) | IP: ${req.ip} | Endpoint: ${req.originalUrl} | Duration: ${duration}ms`);
};

const logAdminError = (error, req, duration) => {
  console.error(`🔴 ADMIN AUTH FAILED | IP: ${req.ip} | Error: ${error.message} | Duration: ${duration}ms`);
};

const sendAdminError = (res, code, message, status = 403) => {
  return res.status(status).json({
    success: false,
    code: code,
    message: message,
    timestamp: new Date().toISOString(),
    docs: 'https://xoss.onrender.com/api/docs#admin-authentication'
  });
};

const handleAdminError = (res, error) => {
  let code = 'ADMIN_AUTH_ERROR';
  let message = 'Admin authentication failed';
  let status = 500;

  switch (error.name) {
    case 'JsonWebTokenError':
      code = 'INVALID_ADMIN_TOKEN';
      message = 'Invalid admin authentication token';
      status = 401;
      break;
    case 'TokenExpiredError':
      code = 'ADMIN_TOKEN_EXPIRED';
      message = 'Admin authentication token has expired';
      status = 401;
      break;
    case 'MongoError':
      code = 'ADMIN_DB_ERROR';
      message = 'Database error during admin authentication';
      status = 503;
      break;
  }

  return sendAdminError(res, code, message, status);
};

const formatMemberSince = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ====================
// UTILITY FUNCTIONS (for controllers)
// ====================

const checkAdmin = (user) => {
  return isAdminRole(user?.role);
};

const checkSuperAdmin = (user) => {
  return user?.role === 'super_admin';
};

const checkModerator = (user) => {
  return ['moderator', 'admin', 'super_admin'].includes(user?.role);
};

const checkSupport = (user) => {
  return ['support', 'moderator', 'admin', 'super_admin'].includes(user?.role);
};

// Export all middleware and utilities
module.exports = {
  // Main middleware
  adminAuth,
  superAdminAuth,
  roleAuth,
  permissionAuth,
  rateLimitedAdmin,
  auditLog,
  
  // Utility functions
  checkAdmin,
  checkSuperAdmin,
  checkModerator,
  checkSupport,
  hasPermission,
  getAdminPermissions,
  
  // Role checking utilities
  isAdmin: checkAdmin,
  isSuperAdmin: checkSuperAdmin,
  isModerator: checkModerator,
  isSupport: checkSupport
};
