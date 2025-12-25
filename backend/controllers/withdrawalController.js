// controllers/withdrawalController.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');
const { Withdrawal, Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');

/**
 * Helpers
 */
const toObjectIdString = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (id.toString) return id.toString();
  return String(id);
};

// Constants
const WITHDRAWAL_LIMITS = { MIN: 100, MAX: 50000 };
const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'bank'];

/**
 * Create transaction helper
 */
async function createTransaction({ session, user_id, type, amount, description, metadata = {} }) {
  const tx = await Transaction.create(
    [
      {
        user_id,
        type,
        amount,
        description,
        status: metadata?.status || 'pending',
        metadata
      }
    ],
    { session }
  );
  return tx[0];
}

/**
 * Request withdrawal
 */
exports.requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, payment_method, account_details = {}, user_note } = req.body;
    const userId = req.user.userId;

    // Validation: amount
    if (!amount || isNaN(amount)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const parsedAmount = Number(amount);

    if (parsedAmount < WITHDRAWAL_LIMITS.MIN || parsedAmount > WITHDRAWAL_LIMITS.MAX) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be between ৳${WITHDRAWAL_LIMITS.MIN} and ৳${WITHDRAWAL_LIMITS.MAX}`
      });
    }

    // Payment method validation
    if (payment_method && !PAYMENT_METHODS.includes(payment_method)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(', ')}`
      });
    }

    // Wallet atomic decrement
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: userId, balance: { $gte: parsedAmount } },
      { $inc: { balance: -parsedAmount, total_spent: parsedAmount } },
      { new: true, session }
    );

    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Insufficient balance for withdrawal' });
    }

    // Create withdrawal
    const withdrawalArr = await Withdrawal.create(
      [
        {
          user_id: userId,
          amount: parsedAmount,
          payment_method: payment_method || 'bkash',
          account_details: account_details || {},
          user_note: user_note || '',
          status: 'pending',
          requested_at: new Date()
        }
      ],
      { session }
    );
    const withdrawal = withdrawalArr[0];

    // Create transaction
    const tx = await createTransaction({
      session,
      user_id: userId,
      type: 'withdrawal',
      amount: parsedAmount,
      description: `Withdrawal request - ${(payment_method || 'bkash').toUpperCase()}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        status: 'pending',
        account: account_details?.phone || null,
        method: payment_method || 'bkash'
      }
    });

    await session.commitTransaction();
    session.endSession();

    await withdrawal.populate('user_id', 'username email phone');

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal,
        wallet: {
          balance: wallet.balance,
          total_earned: wallet.total_earned,
          total_spent: wallet.total_spent
        },
        transactionId: tx._id
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Withdrawal request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request',
      error: error.message
    });
  }
};

/**
 * Get user's withdrawals (paginated)
 */
exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;

    const filter = { user_id: userId };
    if (status && status !== 'all') filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .populate('user_id', 'username email phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Withdrawal.countDocuments(filter);

    return res.json({
      success: true,
      data: withdrawals,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('❌ Get user withdrawals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawal history', error: error.message });
  }
};

/**
 * User withdrawal stats
 */
exports.getWithdrawalStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [total, pending, approved] = await Promise.all([
      Withdrawal.countDocuments({ user_id: userId }),
      Withdrawal.countDocuments({ user_id: userId, status: 'pending' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'approved' })
    ]);

    const wallet = await Wallet.findOne({ user_id: userId });

    return res.json({
      success: true,
      data: {
        walletBalance: wallet?.balance || 0,
        totalWithdrawals: total,
        pendingWithdrawals: pending,
        approvedWithdrawals: approved,
        totalEarned: wallet?.total_earned || 0,
        totalSpent: wallet?.total_spent || 0
      }
    });
  } catch (error) {
    console.error('❌ Get withdrawal stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawal stats', error: error.message });
  }
};

/**
 * Admin analytics
 */
exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'approved' }),
      Withdrawal.countDocuments({ status: 'rejected' })
    ]);

    const [pendingAgg, approvedAgg] = await Promise.all([
      Withdrawal.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Withdrawal.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    const recentPending = await Withdrawal.find({ status: 'pending' })
      .populate('user_id', 'username email phone')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      data: {
        counts: { pending: totalPending, approved: totalApproved, rejected: totalRejected },
        amounts: { pending: pendingAgg[0]?.total || 0, approved: approvedAgg[0]?.total || 0 },
        recentPending
      }
    });
  } catch (error) {
    console.error('❌ Get withdrawal analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawal analytics', error: error.message });
  }
};

/**
 * Admin: get pending withdrawals (paginated)
 */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('user_id', 'username email phone avatar')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Withdrawal.countDocuments({ status: 'pending' });

    return res.json({
      success: false,
      data: withdrawals,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('❌ Get pending withdrawals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending withdrawals', error: error.message });
  }
};

/**
 * Admin: approve withdrawal
 */
exports.approveWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { transaction_id, admin_notes } = req.body;
    const adminId = req.user.userId;

    const withdrawal = await Withdrawal.findById(id).session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: `Withdrawal is already ${withdrawal.status}` });
    }

    // Update withdrawal status
    withdrawal.status = 'approved';
    withdrawal.transaction_id = transaction_id || withdrawal.transaction_id;
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes || withdrawal.admin_notes;
    withdrawal.processed_at = new Date();

    await withdrawal.save({ session });

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: 'completed',
        description: `Withdrawal processed - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
        'metadata.status': 'completed',
        'metadata.processedBy': adminId
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await withdrawal.populate('user_id', 'username email phone');

    return res.json({ 
      success: true, 
      message: 'Withdrawal approved successfully', 
      data: withdrawal 
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Approve withdrawal error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to approve withdrawal', 
      error: error.message 
    });
  }
};

/**
 * Admin: reject withdrawal
 */
exports.rejectWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminId = req.user.userId;

    const withdrawal = await Withdrawal.findById(id).session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: `Withdrawal is already ${withdrawal.status}` });
    }

    // Refund wallet (return money to user)
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: withdrawal.user_id },
      { $inc: { balance: withdrawal.amount, total_spent: -withdrawal.amount } },
      { new: true, session }
    );

    if (!wallet) {
      console.warn(`⚠️ Wallet not found for user ${withdrawal.user_id}`);
    }

    // Create refund transaction
    await createTransaction({
      session,
      user_id: withdrawal.user_id,
      type: 'refund',
      amount: withdrawal.amount,
      description: `Withdrawal refund - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        status: 'completed',
        refundedBy: adminId,
        reason: admin_notes || 'Request rejected'
      }
    });

    // Update withdrawal status
    withdrawal.status = 'rejected';
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes || '';
    withdrawal.processed_at = new Date();

    await withdrawal.save({ session });

    await session.commitTransaction();
    session.endSession();

    await withdrawal.populate('user_id', 'username email phone');

    return res.json({
      success: true,
      message: 'Withdrawal rejected and amount refunded',
      data: {
        withdrawal,
        wallet: {
          balance: wallet?.balance || 0,
          total_earned: wallet?.total_earned || 0,
          total_spent: wallet?.total_spent || 0
        }
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Reject withdrawal error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reject withdrawal', 
      error: error.message 
    });
  }
};
