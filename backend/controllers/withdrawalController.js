// controllers/withdrawalController.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');
const { Withdrawal, Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');

/**
 * Request withdrawal
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, payment_method, account_details = {}, user_note = '' } = req.body;
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
    if (parsedAmount < 100 || parsedAmount > 25000) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount must be between ৳100 and ৳25,000'
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
      status: 'pending'
    });

    await withdrawal.save();

    // Debit from wallet
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
      metadata: {
        withdrawalId: withdrawal._id,
        account_number: account_details.phone,
        user_note
      }
    });

    await transaction.save();

    // Populate user data for response
    const user = await User.findById(userId).select('name email phone');
    
    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
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

/**
 * Get user's withdrawals
 */
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

    return res.json({
      success: true,
      data: withdrawals,
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

/**
 * Get user withdrawal stats
 */
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
        total_withdrawn: totalWithdrawn
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

/**
 * Admin: Get pending withdrawals
 */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('user_id', 'name email phone username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Withdrawal.countDocuments({ status: 'pending' });

    return res.json({
      success: true,
      data: withdrawals,
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

/**
 * Admin: Get withdrawal analytics
 */
exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'approved' }),
      Withdrawal.countDocuments({ status: 'rejected' })
    ]);

    // Calculate total amounts
    const pendingAgg = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const approvedAgg = await Withdrawal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Recent pending withdrawals
    const recentPending = await Withdrawal.find({ status: 'pending' })
      .populate('user_id', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      data: {
        counts: {
          pending: totalPending,
          approved: totalApproved,
          rejected: totalRejected,
          total: totalPending + totalApproved + totalRejected
        },
        amounts: {
          pending: pendingAgg[0]?.total || 0,
          approved: approvedAgg[0]?.total || 0
        },
        recent_pending: recentPending
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

/**
 * Admin: Approve withdrawal
 */
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
    withdrawal.status = 'approved';
    withdrawal.transaction_id = transaction_id;
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes;
    withdrawal.processed_at = new Date();

    await withdrawal.save();

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

/**
 * Admin: Reject withdrawal
 */
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
    withdrawal.status = 'rejected';
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes;
    withdrawal.processed_at = new Date();

    await withdrawal.save();

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
