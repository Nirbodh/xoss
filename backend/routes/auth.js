const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// ✅ LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED:', { 
    email: req.body.email,
    timestamp: new Date().toISOString() 
  });

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Database access
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({
      email: email.toLowerCase().trim()
    });

    console.log('🔍 DATABASE RESULT:', {
      found: !!user,
      email: user?.email,
      hasPassword: !!user?.password,
      userId: user?._id
    });

    // User not found
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // No password in database
    if (!user.password) {
      console.log('⚠️ USER HAS NO PASSWORD IN DB:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Account setup incomplete. Please reset password.' 
      });
    }

    // Password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔐 PASSWORD COMPARISON:', { match: isMatch });

    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check account status
    if (user.is_active === false || user.account_status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        message: 'Account is suspended. Contact support.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );

    // Format user response
    const responseUser = formatUserResponse(user);

    console.log('✅ LOGIN SUCCESS:', {
      email: user.email,
      userId: user._id,
      walletBalance: responseUser.wallet_balance,
      level: responseUser.level
    });

    // Success response
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: responseUser
    });

  } catch (error) {
    console.error('🔥 LOGIN PROCESS ERROR:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ REGISTER ENDPOINT
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, name } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const db = mongoose.connection.db;
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ email: email.toLowerCase() }, { username: username?.toLowerCase() }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email or username' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate referral code
    const referralCode = generateReferralCode(username || email.split('@')[0]);
    
    // Create new user
    const newUser = {
      username: username || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      name: name || '',
      
      // Wallet data (NEW schema)
      wallet: {
        balance: 1000,
        total_deposited: 0,
        total_withdrawn: 0,
        total_earned: 0,
        total_won: 0,
        total_lost: 0,
        transaction_count: 0
      },
      
      // Backward compatible fields (OLD schema)
      wallet_balance: 1000,
      balance: 1000,
      total_earnings: 0,
      
      // Level and progression (NEW schema)
      progression: {
        current: 1,
        experience: 0,
        next_level_xp: 1000,
        badges: [],
        achievements: []
      },
      
      // Backward compatible fields (OLD schema)
      level: 1,
      experience: 0,
      
      // Stats (NEW schema)
      stats: {
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        tournaments_joined: 0,
        tournaments_won: 0,
        win_rate: 0,
        total_kills: 0,
        total_deaths: 0,
        kd_ratio: 0,
        rank_score: 1000,
        highest_rank: 'Bronze V'
      },
      
      // Backward compatible fields (OLD schema)
      matches_played: 0,
      matches_won: 0,
      favorite_game: 'Free Fire',
      
      // Gaming preferences
      gaming: {
        favorite_game: 'Free Fire',
        favorite_mode: 'Ranked',
        preferred_device: 'mobile',
        play_style: 'balanced',
        squad_preference: 'squad'
      },
      
      // Account status
      is_verified: false,
      is_active: true,
      account_status: 'active',
      role: 'user',
      
      // Verification
      verification: {
        email_verified: false,
        phone_verified: false,
        kyc_verified: false,
        kyc_level: 'none'
      },
      
      // Referral system
      referral: {
        code: referralCode,
        total_referrals: 0,
        referral_earnings: 0,
        bonus_received: false
      },
      
      // Settings
      settings: {
        notifications: {
          email: {
            promotions: true,
            matches: true,
            results: true,
            withdrawals: true,
            security: true
          },
          push: {
            matches: true,
            results: true,
            messages: true,
            promotions: false
          },
          sms: {
            withdrawals: true,
            security: true
          }
        },
        privacy: {
          profile_visibility: 'public',
          stats_visibility: 'public',
          online_status: 'visible'
        },
        gaming_preferences: {
          auto_join: false,
          sound_effects: true,
          vibration: true,
          theme: 'dark'
        }
      },
      
      // Metadata
      metadata: {
        registration_source: 'web',
        registration_ip: req.ip,
        session_count: 0,
        total_play_time: 0
      },
      
      // Security
      security: {
        login_attempts: 0,
        last_login: new Date(),
        last_login_ip: req.ip
      },
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      last_active: new Date()
    };
    
    // Insert user
    const result = await db.collection('users').insertOne(newUser);
    
    // Generate token
    const token = jwt.sign(
      { userId: result.insertedId },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );
    
    // Format response
    const responseUser = formatUserResponse({
      ...newUser,
      _id: result.insertedId
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: responseUser
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ LOGOUT ENDPOINT
router.post('/logout', auth, async (req, res) => {
  try {
    console.log('🚪 LOGOUT REQUEST:', {
      userId: req.user._id,
      email: req.user.email
    });
    
    // Update user's last logout time
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'security.last_logout': new Date() }
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// ✅ GET CURRENT USER PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -__v -security.two_factor_secret')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const formattedUser = formatUserResponse(user);
    
    res.json({
      success: true,
      user: formattedUser
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// ✅ UPDATE PROFILE
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, avatar, gaming, settings } = req.body;
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (gaming !== undefined) updateData.gaming = gaming;
    if (settings !== undefined) updateData.settings = settings;
    
    updateData.updatedAt = new Date();
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password -__v -security.two_factor_secret');
    
    const formattedUser = formatUserResponse(user.toObject());
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formattedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// ✅ CHANGE PASSWORD
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    user.password_changed_at = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
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
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // In production, send email here
    console.log('📧 Password reset token:', resetToken);
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: error.message
    });
  }
});

// ✅ RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
    
    user.password = password;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    user.password_changed_at = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// ✅ REFRESH TOKEN
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024');
    
    const user = await User.findById(decoded.userId)
      .select('-password -__v -security.two_factor_secret')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const newToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'xoss-gaming-default-secret-2024',
      { expiresIn: '7d' }
    );
    
    const formattedUser = formatUserResponse(user);
    
    res.json({
      success: true,
      token: newToken,
      user: formattedUser
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
});

// ✅ VERIFY EMAIL
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      email_verification_token: hashedToken,
      email_verification_expires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
    
    user.is_verified = true;
    user.verification.email_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
});

// ✅ RESEND VERIFICATION
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // In production, send email here
    console.log('📧 Verification token:', verificationToken);
    
    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification',
      error: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function formatUserResponse(user) {
  // Determine wallet balance with priority: new schema > old schema
  let walletBalance = 0;
  if (user.wallet?.balance !== undefined) {
    walletBalance = user.wallet.balance;
  } else if (user.wallet_balance !== undefined) {
    walletBalance = user.wallet_balance;
  } else if (user.balance !== undefined) {
    walletBalance = user.balance;
  }
  
  // Determine level with priority: new schema > old schema
  let level = 1;
  if (user.progression?.current !== undefined) {
    level = user.progression.current;
  } else if (user.level !== undefined) {
    level = user.level;
  }
  
  // Determine experience with priority: new schema > old schema
  let experience = 0;
  if (user.progression?.experience !== undefined) {
    experience = user.progression.experience;
  } else if (user.experience !== undefined) {
    experience = user.experience;
  }
  
  // Determine matches played with priority: new schema > old schema
  let matchesPlayed = 0;
  if (user.stats?.matches_played !== undefined) {
    matchesPlayed = user.stats.matches_played;
  } else if (user.matches_played !== undefined) {
    matchesPlayed = user.matches_played;
  }
  
  // Determine matches won with priority: new schema > old schema
  let matchesWon = 0;
  if (user.stats?.matches_won !== undefined) {
    matchesWon = user.stats.matches_won;
  } else if (user.matches_won !== undefined) {
    matchesWon = user.matches_won;
  }
  
  // Calculate win rate
  let winRate = 0;
  if (matchesPlayed > 0) {
    winRate = (matchesWon / matchesPlayed) * 100;
  }
  
  return {
    _id: user._id,
    id: user._id?.toString() || user.id,
    username: user.username || user.email?.split('@')[0] || 'user',
    email: user.email || '',
    phone: user.phone || '',
    name: user.name || '',
    avatar: user.avatar || 'https://res.cloudinary.com/xoss/image/upload/v1/default_avatar.png',
    role: user.role || 'user',
    
    // Wallet data
    wallet_balance: walletBalance,
    wallet: user.wallet || {
      balance: walletBalance,
      total_earned: user.total_earnings || 0,
      total_deposited: user.wallet?.total_deposited || 0,
      total_withdrawn: user.wallet?.total_withdrawn || 0,
      total_won: user.wallet?.total_won || 0,
      total_lost: user.wallet?.total_lost || 0,
      last_transaction: user.wallet?.last_transaction,
      transaction_count: user.wallet?.transaction_count || 0
    },
    
    // Level and progression
    level: level,
    experience: experience,
    progression: user.progression || {
      current: level,
      experience: experience,
      next_level_xp: 1000,
      badges: [],
      achievements: []
    },
    
    // Stats
    matches_played: matchesPlayed,
    matches_won: matchesWon,
    stats: {
      ...user.stats,
      matches_played: matchesPlayed,
      matches_won: matchesWon,
      matches_lost: user.stats?.matches_lost || 0,
      win_rate: winRate.toFixed(2),
      rank_score: user.stats?.rank_score || 1000,
      highest_rank: user.stats?.highest_rank || 'Bronze V'
    },
    
    // Gaming preferences
    favorite_game: user.gaming?.favorite_game || user.favorite_game || 'Free Fire',
    gaming: user.gaming || {
      favorite_game: user.favorite_game || 'Free Fire',
      favorite_mode: 'Ranked',
      preferred_device: 'mobile',
      play_style: 'balanced',
      squad_preference: 'squad'
    },
    
    // Social
    social: user.social || {},
    
    // Account status
    is_verified: user.is_verified || user.verification?.email_verified || false,
    is_active: user.is_active !== false,
    account_status: user.account_status || 'active',
    
    // Settings
    settings: user.settings || {},
    
    // Verification
    verification: user.verification || {
      email_verified: user.is_verified || false,
      phone_verified: false,
      kyc_verified: false,
      kyc_level: 'none'
    },
    
    // Referral
    referral: user.referral || {
      code: generateReferralCode(user.username || user.email?.split('@')[0] || 'XOSS'),
      total_referrals: 0,
      referral_earnings: 0,
      bonus_received: false
    },
    
    // Virtual properties
    win_percentage: winRate.toFixed(2),
    profile_completion: calculateProfileCompletion(user),
    full_name: user.name || user.username || 'Anonymous',
    is_authenticated: true,
    
    // Timestamps
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
    last_active: user.metadata?.last_active || user.last_active || new Date(),
    
    // Metadata
    metadata: user.metadata || {}
  };
}

function calculateProfileCompletion(user) {
  let completion = 0;
  const fields = ['username', 'email', 'phone', 'name', 'avatar'];
  
  fields.forEach(field => {
    if (user[field]) completion += 20;
  });
  
  return completion;
}

function generateReferralCode(baseString) {
  const crypto = require('crypto');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const initials = (baseString || 'XOSS').slice(0, 3).toUpperCase();
  return `XOSS${initials}${random}`;
}

module.exports = router;
