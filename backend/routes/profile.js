// routes/profile.js - COMPLETE PROFILE ROUTES WITH ADMIN CONTROLS
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const bcrypt = require('bcryptjs');

// ✅ CORRECT AUTH MIDDLEWARE IMPORT
const { auth } = require('../middleware/auth'); // Change this line
const { adminAuth } = require('../middleware/admin'); // Change this line
const upload = require('../middleware/upload');

// ✅ ALL ROUTES ARE PROTECTED (REQUIRE AUTHENTICATION)
router.use(auth); // Change this line

// ====================
// ✅ USER PROFILE ENDPOINTS
// ====================

// ✅ GET USER PROFILE
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v -resetPasswordToken -resetPasswordExpire')
      .populate('wallet', 'balance')
      .populate('friends', 'name email avatar')
      .populate('recentGames', 'title game status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    const Transaction = require('../models/Transaction');

    const [matchesPlayed, tournamentsPlayed, transactions] = await Promise.all([
      Match.countDocuments({ participants: user._id, status: 'completed' }),
      Tournament.countDocuments({ participants: user._id, status: 'completed' }),
      Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(5)
    ]);

    const stats = {
      matchesPlayed,
      tournamentsPlayed,
      totalGames: matchesPlayed + tournamentsPlayed,
      walletBalance: user.wallet?.balance || 0,
      points: user.points || 0,
      level: Math.floor((matchesPlayed + tournamentsPlayed) / 10) + 1,
      rank: calculateRank(matchesPlayed + tournamentsPlayed),
      recentTransactions: transactions
    };

    res.json({
      success: true,
      data: {
        user,
        stats
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

// ✅ UPDATE USER PROFILE
router.put('/update', async (req, res) => {
  try {
    const { name, email, phone, bio, socialLinks } = req.body;
    
    const updateData = {};
    const allowedUpdates = ['name', 'email', 'phone', 'bio', 'socialLinks', 'preferences'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if email already exists (if changing email)
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

// ✅ UPLOAD PROFILE PICTURE
router.post('/upload-avatar', upload.uploadConfigs.avatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old avatar if exists
    const oldUser = await User.findById(req.user.id);
    if (oldUser && oldUser.avatar) {
      upload.deleteFile(oldUser.avatar);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        avatar: user.avatar,
        avatarUrl: `${req.protocol}://${req.get('host')}${user.avatar}`
      }
    });
  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    
    // Delete uploaded file if error occurred
    if (req.file) {
      upload.deleteFile(`/uploads/${req.file.filename}`);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
});

// ✅ CHANGE PASSWORD
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// ✅ GET USER ACTIVITY LOG
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const Transaction = require('../models/Transaction');
    const EventJoin = require('../models/EventJoin');
    const Notification = require('../models/Notification');

    const [transactions, joins, notifications] = await Promise.all([
      Transaction.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      
      EventJoin.find({ user: req.user.id })
        .populate('event', 'title game type')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      
      Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
    ]);

    // Combine and sort all activities by date
    const allActivities = [
      ...transactions.map(t => ({
        type: 'transaction',
        title: `${t.type === 'deposit' ? 'ডিপোজিট' : 'উইথড্র'} করা হয়েছে`,
        amount: t.amount,
        status: t.status,
        date: t.createdAt,
        details: t
      })),
      
      ...joins.map(j => ({
        type: 'join',
        title: `${j.eventType === 'match' ? 'ম্যাচ' : 'টুর্নামেন্ট'} এ যোগদান`,
        event: j.event,
        date: j.createdAt,
        details: j
      })),
      
      ...notifications.map(n => ({
        type: 'notification',
        title: n.title,
        message: n.message,
        date: n.createdAt,
        details: n
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: allActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allActivities.length
      }
    });
  } catch (error) {
    console.error('❌ Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log'
    });
  }
});

// ✅ GET USER STATISTICS
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    const Result = require('../models/Result');
    const Transaction = require('../models/Transaction');

    const [
      matchesPlayed,
      tournamentsPlayed,
      totalWins,
      totalDeposits,
      totalWithdrawals,
      recentMatches,
      recentTournaments
    ] = await Promise.all([
      Match.countDocuments({ participants: userId }),
      Tournament.countDocuments({ participants: userId }),
      Result.countDocuments({ user: userId, position: 1 }),
      Transaction.aggregate([
        { $match: { user: userId, type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Match.find({ participants: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title game status total_prize schedule_time'),
      Tournament.find({ participants: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title game status total_prize schedule_time')
    ]);

    const totalEvents = matchesPlayed + tournamentsPlayed;
    const winRate = totalEvents > 0 ? ((totalWins / totalEvents) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        general: {
          matchesPlayed,
          tournamentsPlayed,
          totalEvents,
          totalWins,
          winRate: `${winRate}%`,
          level: Math.floor(totalEvents / 10) + 1,
          rank: calculateRank(totalEvents)
        },
        financial: {
          totalDeposits: totalDeposits[0]?.total || 0,
          totalWithdrawals: totalWithdrawals[0]?.total || 0,
          netProfit: (totalDeposits[0]?.total || 0) - (totalWithdrawals[0]?.total || 0)
        },
        recentActivity: {
          matches: recentMatches,
          tournaments: recentTournaments
        }
      }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// ====================
// ✅ ADMIN PROFILE ENDPOINTS
// ====================

// ✅ GET ALL USERS (ADMIN ONLY)
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', role = '' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('wallet', 'balance');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// ✅ GET USER BY ID (ADMIN ONLY)
router.get('/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wallet')
      .populate('friends', 'name email')
      .populate('recentGames');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get detailed stats for this user
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    const Transaction = require('../models/Transaction');
    const Withdrawal = require('../models/Withdrawal');

    const [
      totalMatches,
      totalTournaments,
      totalDeposits,
      totalWithdrawals,
      recentTransactions,
      pendingWithdrawals
    ] = await Promise.all([
      Match.countDocuments({ participants: user._id }),
      Tournament.countDocuments({ participants: user._id }),
      Transaction.countDocuments({ user: user._id, type: 'deposit' }),
      Transaction.countDocuments({ user: user._id, type: 'withdrawal' }),
      Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
      Withdrawal.find({ user: user._id, status: 'pending' })
    ]);

    const userStats = {
      totalMatches,
      totalTournaments,
      totalEvents: totalMatches + totalTournaments,
      totalDeposits,
      totalWithdrawals,
      recentTransactions,
      pendingWithdrawals,
      registrationDate: user.createdAt,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified,
      status: user.status
    };

    res.json({
      success: true,
      data: {
        user,
        stats: userStats
      }
    });
  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// ====================
// ✅ HELPER FUNCTIONS
// ====================

function calculateRank(totalGames) {
  if (totalGames >= 100) return 'Platinum';
  if (totalGames >= 50) return 'Gold';
  if (totalGames >= 20) return 'Silver';
  if (totalGames >= 10) return 'Bronze';
  return 'Rookie';
}

module.exports = router;
