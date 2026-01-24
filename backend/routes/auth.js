// routes/auth.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'POST /api/auth/refresh',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'PUT /api/auth/update-profile',
      'POST /api/auth/change-password'
    ]
  });
});

// ✅ LOGIN - COMPLETELY FIXED
router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED:', {
    email: req.body.email ? req.body.email.substring(0, 3) + '***' : 'no-email',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // Find user - include password field
    const user = await User.findOne({ email: cleanEmail }).select('+password +email_verification_token +password_reset_token');

    console.log('🔍 USER LOOKUP:', {
      found: !!user,
      email: cleanEmail,
      userId: user?._id,
      hasPassword: !!user?.password
    });

    // User not found
    if (!user) {
      console.log('❌ User not found for email:', cleanEmail);
      return res.status(400).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Invalid email or password'
      });
    }

    // No password in database
    if (!user.password) {
      console.log('⚠️ User has no password in DB:', user.email);
      return res.status(400).json({
        success: false,
        code: 'NO_PASSWORD',
        message: 'Account setup incomplete. Please reset password.'
      });
    }

    // Check if account is active
    if (user.is_active === false || user.account_status === 'suspended') {
      console.log('🚫 Account inactive/suspended:', user.email);
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is suspended. Contact support.'
      });
    }

    // Verify password
    console.log('🔐 Comparing password...');
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch for:', user.email);
      return res.status(400).json({
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified for:', user.email);

    // Generate JWT token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'user',
      username: user.username || user.email.split('@')[0]
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        algorithm: 'HS256'
      }
    );

    console.log('✅ JWT Token generated for:', user.email);

    // Prepare user response - EXACT STRUCTURE REQUIRED BY FRONTEND
    const userResponse = {
      // Identifiers
      _id: user._id,
      id: user._id.toString(),
      userId: user._id.toString(),
      
      // Basic info
      email: user.email,
      username: user.username || user.email.split('@')[0],
      name: user.name || user.username || user.email.split('@')[0],
      phone: user.phone || '',
      avatar: user.avatar || 'https://res.cloudinary.com/xoss/image/upload/v1/default_avatar.png',
      
      // Role & permissions
      role: user.role || 'user',
      permissions: user.permissions || ['basic_access'],
      
      // Wallet data - ALL POSSIBLE SOURCES
      wallet_balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
      balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
      wallet: {
        balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
        total_earned: user.total_earnings || user.wallet?.total_earned || 0,
        total_deposited: user.wallet?.total_deposited || 0,
        total_withdrawn: user.wallet?.total_withdrawn || 0
      },
      
      // Level & progression
      level: user.level || user.progression?.current || 1,
      experience: user.experience || user.progression?.experience || 0,
      progression: {
        current: user.level || user.progression?.current || 1,
        experience: user.experience || user.progression?.experience || 0,
        next_level_xp: user.progression?.next_level_xp || 1000
      },
      
      // Stats
      matches_played: user.matches_played || user.stats?.matches_played || 0,
      matches_won: user.matches_won || user.stats?.matches_won || 0,
      total_earnings: user.total_earnings || 0,
      
      // Status flags
      is_verified: user.is_verified || false,
      is_active: user.is_active !== false,
      account_status: user.account_status || 'active',
      is_premium: user.is_premium || false,
      
      // Timestamps
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
      last_login: new Date().toISOString()
    };

    // Update last login
    try {
      await User.findByIdAndUpdate(user._id, {
        last_login: new Date(),
        'security.last_login': new Date(),
        'security.last_login_ip': req.ip,
        $inc: { 'security.login_count': 1 }
      });
    } catch (updateError) {
      console.warn('⚠️ Failed to update last login:', updateError.message);
    }

    // SUCCESS RESPONSE - EXACT STRUCTURE
    const successResponse = {
      success: true,
      message: 'Login successful',
      token: token,
      user: userResponse,
      session: {
        expires_in: '7d',
        timestamp: new Date().toISOString()
      }
    };

    console.log('🎉 LOGIN SUCCESS:', {
      userId: user._id,
      email: user.email,
      walletBalance: userResponse.wallet_balance,
      hasToken: !!token
    });

    res.json(successResponse);

  } catch (error) {
    console.error('🔥 LOGIN PROCESS ERROR:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
      timestamp: new Date().toISOString()
    });

    // Handle specific errors
    let errorCode = 'LOGIN_ERROR';
    let errorMessage = 'Login failed. Please try again.';
    let statusCode = 500;

    if (error.name === 'MongoError' && error.code === 11000) {
      errorCode = 'DUPLICATE_KEY';
      errorMessage = 'Database error. Please contact support.';
    } else if (error.name === 'ValidationError') {
      errorCode = 'VALIDATION_ERROR';
      errorMessage = 'Invalid input data.';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      code: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ REGISTER
router.post('/register', async (req, res) => {
  console.log('📝 REGISTER REQUEST:', {
    email: req.body.email ? req.body.email.substring(0, 3) + '***' : 'no-email',
    username: req.body.username ? req.body.username.substring(0, 2) + '***' : 'no-username'
  });

  try {
    const { username, email, password, phone, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Email and password are required'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username ? username.toLowerCase().trim() : cleanEmail.split('@')[0];

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: cleanUsername }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 'USER_EXISTS',
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate referral code
    const referralCode = 'XOSS' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create new user
    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || '',
      name: name || cleanUsername,
      wallet_balance: 1000,
      balance: 1000,
      wallet: {
        balance: 1000,
        total_earned: 0,
        total_deposited: 0,
        total_withdrawn: 0
      },
      level: 1,
      experience: 0,
      progression: {
        current: 1,
        experience: 0,
        next_level_xp: 1000
      },
      is_verified: false,
      is_active: true,
      account_status: 'active',
      role: 'user',
      referral: {
        code: referralCode,
        referred_users: [],
        total_referrals: 0,
        referral_earnings: 0
      },
      security: {
        login_count: 0,
        last_login: new Date(),
        last_login_ip: req.ip
      }
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      { expiresIn: '7d' }
    );

    // Prepare response
    const userResponse = {
      _id: newUser._id,
      id: newUser._id.toString(),
      email: newUser.email,
      username: newUser.username,
      name: newUser.name,
      phone: newUser.phone,
      avatar: newUser.avatar,
      role: newUser.role,
      wallet_balance: newUser.wallet_balance,
      wallet: {
        balance: newUser.wallet_balance,
        total_earned: 0
      },
      level: newUser.level,
      experience: newUser.experience,
      is_verified: newUser.is_verified,
      is_active: newUser.is_active,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: token,
      user: userResponse
    });

  } catch (error) {
    console.error('🔥 REGISTRATION ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REGISTRATION_FAILED',
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ GET CURRENT USER
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );

    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Prepare response
    const userResponse = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      wallet_balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
      wallet: {
        balance: user.wallet_balance || user.balance || user.wallet?.balance || 0,
        total_earned: user.total_earnings || user.wallet?.total_earned || 0
      },
      level: user.level || 1,
      experience: user.experience || 0,
      is_verified: user.is_verified || false,
      is_active: user.is_active !== false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ ME ERROR:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      });
    }

    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Failed to fetch user data'
    });
  }
});

// ✅ LOGOUT
router.post('/logout', async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ LOGOUT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// ✅ UPDATE PROFILE
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );

    const { name, phone, avatar } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        wallet_balance: user.wallet_balance
      }
    });

  } catch (error) {
    console.error('❌ UPDATE PROFILE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
});

// ✅ CHANGE PASSWORD
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(decoded.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    user.password = hashedPassword;
    user.password_changed_at = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ CHANGE PASSWORD ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
});

// ✅ FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // Don't reveal that user doesn't exist
      return res.json({
        success: true,
        message: 'If your email exists, you will receive a reset link'
      });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.password_reset_token = resetTokenHash;
    user.password_reset_expires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send email here
    console.log('📧 Password reset token (dev only):', resetToken);

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('❌ FORGOT PASSWORD ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset'
    });
  }
});

// ✅ RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const resetTokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      password_reset_token: resetTokenHash,
      password_reset_expires: { $gt: Date.now() }
    }).select('+password_reset_token +password_reset_expires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    user.password = hashedPassword;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    user.password_changed_at = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    console.error('❌ RESET PASSWORD ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// ✅ REFRESH TOKEN
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token required'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      { ignoreExpiration: true }
    );

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'xoss_prod_jwt_2024_!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: newToken,
      expires_in: '7d'
    });

  } catch (error) {
    console.error('❌ REFRESH TOKEN ERROR:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// ✅ TEST ENDPOINT
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working correctly',
    timestamp: new Date().toISOString(),
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      me: 'GET /api/auth/me',
      logout: 'POST /api/auth/logout',
      refresh: 'POST /api/auth/refresh'
    }
  });
});

module.exports = router;
