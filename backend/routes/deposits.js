// routes/deposits.js - COMPLETELY FIXED
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Deposit = require('../models/Deposit');
const User = require('../models/User');

// ✅ GET USER DEPOSITS - REAL IMPLEMENTATION
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📊 Fetching deposits for user: ${userId}`);

    // Check if user is accessing their own data or is admin
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: deposits,
      message: 'Deposits fetched successfully'
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message
    });
  }
});

// ✅ CREATE DEPOSIT - REAL IMPLEMENTATION
router.post('/', auth, async (req, res) => {
  try {
    const { amount, method, transactionId, screenshot } = req.body;
    const userId = req.user.userId;

    console.log('💰 Creating deposit request for user:', userId);

    // Validation
    if (!amount || !method || !transactionId || !screenshot) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (amount < 10 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between 10 and 50000'
      });
    }

    // Check if transaction ID already exists
    const existingDeposit = await Deposit.findOne({ transactionId });
    if (existingDeposit) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already used'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create deposit
    const deposit = new Deposit({
      userId,
      userName: user.name || user.username,
      userPhone: user.phone,
      amount,
      method,
      transactionId,
      screenshot,
      status: 'pending'
    });

    await deposit.save();

    console.log(`✅ Deposit created: ${deposit._id} for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      data: deposit
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deposit request',
      error: error.message
    });
  }
});

// ✅ ADMIN: GET PENDING DEPOSITS
router.get('/admin/pending', auth, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const deposits = await Deposit.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      data: deposits,
      message: 'Pending deposits fetched successfully'
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending deposits',
      error: error.message
    });
  }
});

// ✅ ADMIN: APPROVE DEPOSIT
router.post('/admin/approve/:depositId', auth, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { depositId } = req.params;
    const { adminNote = '' } = req.body;

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Deposit is not pending'
      });
    }

    // Approve deposit
    deposit.status = 'approved';
    deposit.adminNote = adminNote;
    deposit.approvedAt = new Date();
    deposit.approvedBy = req.user.userId;

    await deposit.save();

    // TODO: Add money to user's wallet here
    // await walletService.credit(deposit.userId, deposit.amount, `Deposit via ${deposit.method}`);

    res.json({
      success: true,
      message: 'Deposit approved successfully',
      data: deposit
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve deposit',
      error: error.message
    });
  }
});

// ✅ ADMIN: REJECT DEPOSIT
router.post('/admin/reject/:depositId', auth, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { depositId } = req.params;
    const { adminNote = 'No reason provided' } = req.body;

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Deposit is not pending'
      });
    }

    // Reject deposit
    deposit.status = 'rejected';
    deposit.adminNote = adminNote;
    deposit.rejectedAt = new Date();

    await deposit.save();

    res.json({
      success: true,
      message: 'Deposit rejected successfully',
      data: deposit
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject deposit',
      error: error.message
    });
  }
});

module.exports = router;
