// routes/profile.js - COMPLETE PROFILE ROUTES WITH ADMIN CONTROLS
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const upload = require('../middleware/upload');

// ✅ ALL ROUTES ARE PROTECTED (REQUIRE AUTHENTICATION)
router.use(authMiddleware);

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
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
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
router.get('/admin/users', adminMiddleware, async (req, res) => {
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
router.get('/admin/users/:id', adminMiddleware, async (req, res) => {
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

// ✅ UPDATE USER (ADMIN ONLY)
router.put('/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, role, status, balance } = req.body;
    
    const updateData = {};
    const allowedUpdates = ['name', 'email', 'phone', 'role', 'status', 'isVerified', 'preferences'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if email already exists
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Update wallet balance if provided
    if (balance !== undefined) {
      await Wallet.findOneAndUpdate(
        { user: req.params.id },
        { balance: parseFloat(balance) },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// ✅ DELETE USER (ADMIN ONLY)
router.delete('/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    // Delete related data (optional - based on your requirement)
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    const Transaction = require('../models/Transaction');
    const Wallet = require('../models/Wallet');

    await Promise.all([
      Match.updateMany(
        { participants: userId },
        { $pull: { participants: userId } }
      ),
      Tournament.updateMany(
        { participants: userId },
        { $pull: { participants: userId } }
      ),
      Transaction.deleteMany({ user: userId }),
      Wallet.deleteOne({ user: userId })
    ]);

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// ✅ UPDATE USER WALLET BALANCE (ADMIN ONLY)
router.post('/admin/users/:id/wallet', adminMiddleware, async (req, res) => {
  try {
    const { amount, type, description } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Amount and type are required'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let wallet = await Wallet.findOne({ user: req.params.id });
    
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = new Wallet({
        user: req.params.id,
        balance: 0
      });
    }

    // Update balance based on type
    if (type === 'add') {
      wallet.balance += parseFloat(amount);
    } else if (type === 'subtract') {
      if (wallet.balance < parseFloat(amount)) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }
      wallet.balance -= parseFloat(amount);
    } else if (type === 'set') {
      wallet.balance = parseFloat(amount);
    }

    await wallet.save();

    // Create transaction record
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      user: req.params.id,
      type: type === 'add' ? 'admin_credit' : 'admin_debit',
      amount: parseFloat(amount),
      description: description || `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
      status: 'completed',
      admin: req.user.id,
      adminNote: `Balance ${type} by admin`
    });
    await transaction.save();

    res.json({
      success: true,
      message: `Balance ${type} successfully`,
      data: {
        newBalance: wallet.balance,
        transaction: transaction
      }
    });
  } catch (error) {
    console.error('❌ Update wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet balance'
    });
  }
});

// ✅ GET USER TRANSACTIONS (ADMIN ONLY)
router.get('/admin/users/:id/transactions', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = '' } = req.query;
    
    const query = { user: req.params.id };
    if (type) query.type = type;

    const Transaction = require('../models/Transaction');
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('admin', 'name email');

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// ✅ VERIFY USER (ADMIN ONLY)
router.post('/admin/users/:id/verify', adminMiddleware, async (req, res) => {
  try {
    const { isVerified, verificationNote } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: isVerified !== undefined ? isVerified : true,
        verificationDate: isVerified ? new Date() : null,
        verificationNote
      },
      { new: true }
    ).select('-password');

    // Send notification to user
    const Notification = require('../models/Notification');
    const notification = new Notification({
      user: req.params.id,
      title: 'Account Verification',
      message: isVerified ? 
        'Your account has been verified successfully!' :
        'Your account verification has been revoked.',
      type: 'system'
    });
    await notification.save();

    res.json({
      success: true,
      message: isVerified ? 'User verified successfully' : 'User verification revoked',
      data: user
    });
  } catch (error) {
    console.error('❌ Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify user'
    });
  }
});

// ✅ BAN/UNBAN USER (ADMIN ONLY)
router.post('/admin/users/:id/ban', adminMiddleware, async (req, res) => {
  try {
    const { status, banReason, banDuration } = req.body;
    
    if (!status || !['active', 'banned', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const updateData = {
      status,
      banReason: status !== 'active' ? banReason : null,
      banDate: status !== 'active' ? new Date() : null,
      banDuration: status !== 'active' ? banDuration : null,
      banLiftedDate: status === 'active' ? new Date() : null
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    // Send notification
    const Notification = require('../models/Notification');
    const notification = new Notification({
      user: req.params.id,
      title: status !== 'active' ? 'Account Suspended' : 'Account Reactivated',
      message: status !== 'active' ?
        `Your account has been ${status}. Reason: ${banReason}` :
        'Your account has been reactivated.',
      type: 'system'
    });
    await notification.save();

    res.json({
      success: true,
      message: `User ${status} successfully`,
      data: user
    });
  } catch (error) {
    console.error('❌ Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// ✅ ADMIN STATISTICS DASHBOARD
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    const Transaction = require('../models/Transaction');
    const Withdrawal = require('../models/Withdrawal');

    const [
      totalUsers,
      newUsersToday,
      activeUsers,
      bannedUsers,
      totalMatches,
      totalTournaments,
      pendingMatches,
      pendingTournaments,
      totalDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      User.countDocuments({ status: 'active', lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ status: 'banned' }),
      Match.countDocuments(),
      Tournament.countDocuments(),
      Match.countDocuments({ approval_status: 'pending' }),
      Tournament.countDocuments({ approval_status: 'pending' }),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Withdrawal.countDocuments({ status: 'pending' }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt')
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          active: activeUsers,
          banned: bannedUsers,
          recent: recentUsers
        },
        events: {
          matches: totalMatches,
          tournaments: totalTournaments,
          pendingMatches,
          pendingTournaments,
          total: totalMatches + totalTournaments
        },
        finance: {
          totalDeposits: totalDeposits[0]?.total || 0,
          totalWithdrawals: totalWithdrawals[0]?.total || 0,
          pendingWithdrawals,
          netRevenue: (totalDeposits[0]?.total || 0) - (totalWithdrawals[0]?.total || 0)
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
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
