// controllers/withdrawalController.js - COMPLETE WITHDRAWAL CONTROLLER
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');
const Withdrawal = require('../models/withdrawal');
const User = require('../models/User');

// 🔹 REQUEST WITHDRAWAL (USER)
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, payment_method, account_details = {}, user_note = '', withdrawal_type = 'manual' } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    const parsedAmount = parseFloat(amount);

    // Check minimum and maximum
    if (parsedAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ৳100'
      });
    }

    if (parsedAmount > 25000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum withdrawal amount is ৳25,000'
      });
    }

    // Check payment method
    const validMethods = ['bkash', 'nagad', 'rocket'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Use: bkash, nagad, or rocket'
      });
    }

    // Check account number
    if (!account_details.phone || account_details.phone.length !== 11 || !account_details.phone.startsWith('01')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 11-digit mobile number starting with 01'
      });
    }

    // Check if auto withdrawal is requested (for future)
    if (withdrawal_type === 'auto') {
      return res.status(400).json({
        success: false,
        message: 'Auto withdrawal is currently disabled. Please use manual withdrawal.'
      });
      
      /* 🔹 FUTURE AUTO WITHDRAWAL CODE (COMMENTED)
      // Check auto withdrawal availability
      const wallet = await Wallet.findOne({ user_id: userId });
      if (!wallet.settings.auto_withdraw) {
        return res.status(400).json({
          success: false,
          message: 'Auto withdrawal is not enabled in your settings'
        });
      }
      
      if (parsedAmount > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum auto withdrawal amount is ৳10,000'
        });
      }
      */
    }

    // Get user's wallet
    let wallet = await Wallet.findOne({ user_id: userId });
    
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = new Wallet({ user_id: userId });
      await wallet.save();
    }

    // Check balance
    if (wallet.balance < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal'
      });
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      user_id: userId,
      amount: parsedAmount,
      payment_method,
      account_details,
      user_note,
      withdrawal_type,
      status: 'pending'
    });

    await withdrawal.save();

    // Debit from wallet immediately
    wallet.balance -= parsedAmount;
    wallet.total_spent += parsedAmount;
    wallet.last_activity = new Date();
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      user_id: userId,
      type: 'withdrawal',
      amount: -parsedAmount,
      description: `Withdrawal request to ${payment_method}`,
      status: 'pending',
      method: payment_method,
      related_to: withdrawal._id,
      related_model: 'Withdrawal',
      metadata: {
        withdrawalId: withdrawal._id,
        account_number: account_details.phone,
        user_note,
        withdrawal_type
      }
    });

    await transaction.save();

    // If auto withdrawal, process immediately (for future)
    /*
    if (withdrawal_type === 'auto') {
      try {
        await withdrawal.processAuto();
        
        // Update transaction status
        transaction.status = 'completed';
        transaction.description = `Auto withdrawal to ${payment_method}`;
        await transaction.save();
        
        // Update wallet withdrawn total
        wallet.total_withdrawn += parsedAmount;
        await wallet.save();
      } catch (error) {
        console.error('Auto withdrawal failed:', error);
        // If auto fails, revert to manual
        withdrawal.status = 'pending';
        withdrawal.withdrawal_type = 'manual';
        await withdrawal.save();
      }
    }
    */

    // Populate user data for response
    const user = await User.findById(userId).select('name email phone username');
    
    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully! Admin will process it soon.',
      data: {
        withdrawal: {
          ...withdrawal.toObject(),
          user: user
        },
        new_balance: wallet.balance,
        transaction_id: transaction._id
      }
    });

  } catch (error) {
    console.error('❌ Withdrawal request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request',
      error: error.message
    });
  }
};

// 🔹 GET USER WITHDRAWALS
exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;

    const filter = { user_id: userId };
    if (status && status !== 'all') filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Withdrawal.countDocuments(filter);
    
    // Get wallet balance
    const wallet = await Wallet.findOne({ user_id: userId });

    return res.json({
      success: true,
      data: withdrawals,
      wallet_balance: wallet?.balance || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get user withdrawals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal history',
      error: error.message
    });
  }
};

// 🔹 GET USER WITHDRAWAL STATS
exports.getWithdrawalStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [total, pending, approved, rejected] = await Promise.all([
      Withdrawal.countDocuments({ user_id: userId }),
      Withdrawal.countDocuments({ user_id: userId, status: 'pending' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'approved' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'rejected' })
    ]);

    const wallet = await Wallet.findOne({ user_id: userId });

    // Calculate total withdrawn amount
    const approvedWithdrawals = await Withdrawal.find({ 
      user_id: userId, 
      status: 'approved' 
    });
    
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    return res.json({
      success: true,
      data: {
        wallet_balance: wallet?.balance || 0,
        total_withdrawals: total,
        pending_withdrawals: pending,
        approved_withdrawals: approved,
        rejected_withdrawals: rejected,
        total_withdrawn: totalWithdrawn,
        can_withdraw: wallet?.balance >= 100
      }
    });
  } catch (error) {
    console.error('❌ Get withdrawal stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal stats',
      error: error.message
    });
  }
};

// 🔹 GET PENDING WITHDRAWALS (ADMIN)
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('user_id', 'name email phone username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Withdrawal.countDocuments({ status: 'pending' });
    
    // Calculate total pending amount
    const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    return res.json({
      success: true,
      data: withdrawals,
      summary: {
        total_pending: total,
        total_amount: totalAmount,
        average_amount: total > 0 ? totalAmount / total : 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get pending withdrawals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending withdrawals',
      error: error.message
    });
  }
};

// 🔹 GET ALL WITHDRAWALS (ADMIN - FOR HISTORY)
exports.getAdminWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate, payment_method } = req.query;

    const filter = {};
    
    if (status && status !== 'all') filter.status = status;
    if (payment_method && payment_method !== 'all') filter.payment_method = payment_method;
    
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate('user_id', 'name email phone username avatar')
      .populate('approved_by', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Withdrawal.countDocuments(filter);
    
    // Calculate totals
    const totals = await Withdrawal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      data: withdrawals,
      summary: {
        total_count: total,
        total_amount: totals[0]?.totalAmount || 0,
        average_amount: total > 0 ? (totals[0]?.totalAmount || 0) / total : 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get admin withdrawals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals',
      error: error.message
    });
  }
};

// 🔹 GET WITHDRAWAL ANALYTICS (ADMIN)
exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    // Get counts by status
    const [pending, approved, rejected, processing, completed] = await Promise.all([
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'approved' }),
      Withdrawal.countDocuments({ status: 'rejected' }),
      Withdrawal.countDocuments({ status: 'processing' }),
      Withdrawal.countDocuments({ status: 'completed' })
    ]);

    // Get amounts by status
    const amountAggregation = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent withdrawals
    const recentWithdrawals = await Withdrawal.find()
      .populate('user_id', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await Withdrawal.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get method distribution
    const methodDistribution = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$payment_method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    return res.json({
      success: true,
      data: {
        counts: {
          pending,
          approved,
          rejected,
          processing,
          completed,
          total: pending + approved + rejected + processing + completed
        },
        amounts: amountAggregation,
        today: {
          count: todayStats[0]?.count || 0,
          amount: todayStats[0]?.totalAmount || 0
        },
        recent_withdrawals: recentWithdrawals,
        method_distribution: methodDistribution
      }
    });
  } catch (error) {
    console.error('❌ Get withdrawal analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal analytics',
      error: error.message
    });
  }
};

// 🔹 APPROVE WITHDRAWAL (ADMIN - MANUAL)
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_id, admin_notes } = req.body;
    const adminId = req.user.userId;

    // Find withdrawal
    const withdrawal = await Withdrawal.findById(id);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}`
      });
    }

    // Update withdrawal status
    await withdrawal.approve(adminId, transaction_id, admin_notes);

    // Update wallet's total withdrawn
    const wallet = await Wallet.findOne({ user_id: withdrawal.user_id });
    if (wallet) {
      wallet.total_withdrawn += withdrawal.amount;
      wallet.last_activity = new Date();
      await wallet.save();
    }

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': withdrawal._id },
      {
        status: 'completed',
        description: `Withdrawal approved - ${withdrawal.payment_method.toUpperCase()}`,
        'metadata.status': 'approved',
        'metadata.processedBy': adminId,
        'metadata.transaction_id': transaction_id
      }
    );

    // Get user info for response
    const user = await User.findById(withdrawal.user_id).select('name email phone');

    return res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: {
        withdrawal: {
          ...withdrawal.toObject(),
          user: user
        }
      }
    });

  } catch (error) {
    console.error('❌ Approve withdrawal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal',
      error: error.message
    });
  }
};

// 🔹 REJECT WITHDRAWAL (ADMIN)
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminId = req.user.userId;

    // Find withdrawal
    const withdrawal = await Withdrawal.findById(id);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}`
      });
    }

    // Refund to wallet
    const wallet = await Wallet.findOne({ user_id: withdrawal.user_id });
    
    if (wallet) {
      wallet.balance += withdrawal.amount;
      wallet.total_spent -= withdrawal.amount;
      await wallet.save();

      // Create refund transaction
      const refundTransaction = new Transaction({
        user_id: withdrawal.user_id,
        type: 'refund',
        amount: withdrawal.amount,
        description: `Withdrawal refund - ${withdrawal.payment_method.toUpperCase()}`,
        status: 'completed',
        method: 'refund',
        metadata: {
          withdrawalId: withdrawal._id,
          reason: 'Withdrawal rejected',
          rejectedBy: adminId,
          admin_notes
        }
      });

      await refundTransaction.save();
    }

    // Update withdrawal status
    await withdrawal.reject(adminId, admin_notes);

    // Update original transaction status
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': withdrawal._id },
      {
        status: 'cancelled',
        description: `Withdrawal rejected - ${withdrawal.payment_method.toUpperCase()}`,
        'metadata.status': 'rejected',
        'metadata.rejectedBy': adminId
      }
    );

    // Get user info for response
    const user = await User.findById(withdrawal.user_id).select('name email phone');

    return res.json({
      success: true,
      message: 'Withdrawal rejected and amount refunded',
      data: {
        withdrawal: {
          ...withdrawal.toObject(),
          user: user
        },
        refund_amount: withdrawal.amount
      }
    });

  } catch (error) {
    console.error('❌ Reject withdrawal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal',
      error: error.message
    });
  }
};

// 🔹 PROCESS AUTO WITHDRAWALS (ADMIN - FOR FUTURE)
exports.processAutoWithdrawals = async (req, res) => {
  try {
    // This is for future auto withdrawal processing
    // Currently returns a message that auto withdrawal is not enabled
    
    return res.json({
      success: true,
      message: 'Auto withdrawal processing endpoint',
      note: 'Auto withdrawal system is not enabled yet. When you integrate payment gateway, uncomment the code in withdrawalController.js',
      processed: 0
    });
    
    /* 🔹 FUTURE AUTO PROCESSING CODE (COMMENTED)
    const pendingAutoWithdrawals = await Withdrawal.find({
      status: 'pending',
      withdrawal_type: 'auto',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).limit(10);
    
    let processed = 0;
    let failed = 0;
    
    for (const withdrawal of pendingAutoWithdrawals) {
      try {
        await withdrawal.processAuto();
        processed++;
      } catch (error) {
        console.error(`Auto processing failed for ${withdrawal._id}:`, error);
        failed++;
      }
    }
    
    return res.json({
      success: true,
      message: `Auto processing completed`,
      data: {
        processed,
        failed,
        total: pendingAutoWithdrawals.length
      }
    });
    */
    
  } catch (error) {
    console.error('❌ Process auto withdrawals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process auto withdrawals',
      error: error.message
    });
  }
};

// 🔹 TOGGLE AUTO WITHDRAWAL SYSTEM (ADMIN)
exports.toggleAutoWithdrawal = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    // This would enable/disable auto withdrawal system
    // For now, just return a success message
    
    return res.json({
      success: true,
      message: `Auto withdrawal system would be ${enabled ? 'enabled' : 'disabled'}`,
      note: 'This feature is not implemented yet. When you have payment gateway API, implement this functionality.',
      auto_enabled: false
    });
    
  } catch (error) {
    console.error('❌ Toggle auto withdrawal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle auto withdrawal',
      error: error.message
    });
  }
};
