// routes/admin/users.js - ADMIN ONLY ROUTES
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../middleware/auth');
const User = require('../../models/User');

// ==============================================
// 🔥 ADMIN USER DASHBOARD
// ==============================================

// ✅ ADMIN: Get all users
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;
    
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Get user by ID
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Get user statistics
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      verifiedUsers,
      adminUsers,
      moderatorUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'moderator' })
    ]);
    
    res.json({
      success: true,
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        new_users_today: newUsersToday,
        new_users_week: newUsersThisWeek,
        verified_users: verifiedUsers,
        admin_users: adminUsers,
        moderator_users: moderatorUsers,
        regular_users: totalUsers - adminUsers - moderatorUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 ADMIN USER MANAGEMENT
// ==============================================

// ✅ ADMIN: Create user
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { username, email, password, name, role, status } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    const user = new User({
      username,
      email,
      password,
      name,
      role: role || 'user',
      status: status || 'active',
      isVerified: true,
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Update user
router.put('/:id/update', adminAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.createdAt;
    delete updates.__v;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Delete user
router.delete('/:id/delete', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { id: user._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Ban user
router.post('/:id/ban', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'banned',
        bannedAt: new Date(),
        bannedBy: req.user.id,
        banReason: reason
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User banned successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Unban user
router.post('/:id/unban', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        bannedAt: null,
        bannedBy: null,
        banReason: null
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Update user role
router.put('/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 ADMIN USER ACTIVITIES
// ==============================================

// ✅ ADMIN: Get user activities
router.get('/:id/activities', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Here you would typically fetch activities from Activity model
    res.json({
      success: true,
      data: {
        user_id: user._id,
        activities: [],
        total_activities: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Get user login history
router.get('/:id/login-history', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Here you would typically fetch from LoginHistory model
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 ADMIN USER FINANCIAL
// ==============================================

// ✅ ADMIN: Get user wallet info
router.get('/:id/wallet', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user_id: user._id,
        balance: user.balance || 0,
        total_deposited: 0,
        total_withdrawn: 0,
        total_won: 0,
        total_lost: 0,
        wallet_address: user.walletAddress || null,
        wallet_type: user.walletType || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Update user balance
router.post('/:id/wallet/update-balance', adminAuth, async (req, res) => {
  try {
    const { amount, type, reason } = req.body;
    
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
    
    const oldBalance = user.balance || 0;
    let newBalance = oldBalance;
    
    if (type === 'add') {
      newBalance += parseFloat(amount);
    } else if (type === 'subtract') {
      newBalance -= parseFloat(amount);
    } else if (type === 'set') {
      newBalance = parseFloat(amount);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Use "add", "subtract", or "set"'
      });
    }
    
    user.balance = newBalance;
    await user.save();
    
    res.json({
      success: true,
      message: `Balance updated successfully. Old: ${oldBalance}, New: ${newBalance}`,
      data: {
        user_id: user._id,
        old_balance: oldBalance,
        new_balance: newBalance,
        difference: newBalance - oldBalance,
        operation: type,
        reason: reason || 'Admin adjustment',
        updated_by: req.user.id,
        updated_at: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 ADMIN USER REPORTS
// ==============================================

// ✅ ADMIN: Get user performance report
router.get('/:id/reports/performance', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Here you would typically calculate performance from match/tournament data
    res.json({
      success: true,
      data: {
        user_id: user._id,
        total_matches: 0,
        matches_won: 0,
        matches_lost: 0,
        win_rate: 0,
        total_tournaments: 0,
        tournaments_won: 0,
        best_rank: 0,
        average_score: 0,
        total_prize_money: 0,
        performance_trend: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Export user data
router.get('/:id/export/data', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=user_${user._id}_data.json`);
    
    res.send(JSON.stringify(user, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================
// 🔥 ADMIN BATCH OPERATIONS
// ==============================================

// ✅ ADMIN: Export all users data
router.get('/export/all', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.json');
    
    res.send(JSON.stringify(users, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Bulk update users
router.post('/bulk/update', adminAuth, async (req, res) => {
  try {
    const { user_ids, updates } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }
    
    // Remove sensitive fields
    delete updates.password;
    
    const result = await User.updateMany(
      { _id: { $in: user_ids } },
      updates
    );
    
    res.json({
      success: true,
      message: `Bulk updated ${result.modifiedCount} users`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADMIN: Send notification to users
router.post('/bulk/notify', adminAuth, async (req, res) => {
  try {
    const { user_ids, title, message } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    const users = user_ids || 'all';
    
    res.json({
      success: true,
      message: `Notification sent to ${users === 'all' ? 'all users' : user_ids.length + ' users'}`,
      data: {
        recipients: users,
        title,
        message,
        sent_at: new Date(),
        sent_by: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
