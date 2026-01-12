const mongoose = require('mongoose');
const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Wallet').Transaction;
const User = require('../models/User');

/**
 * 🔥 HELPER FUNCTIONS
 */
const toObjectIdString = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (id.toString) return id.toString();
  return String(id);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
};

const validatePhoneNumber = (phone) => {
  return /^01[3-9]\d{8}$/.test(phone);
};

// 🔥 CONSTANTS
const WITHDRAWAL_LIMITS = { 
  MIN: 100, 
  MAX: 50000,
  DAILY_MAX: 100000,
  DAILY_COUNT_MAX: 5
};

const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'bank'];
const WITHDRAWAL_STATUS = ['pending', 'processing', 'approved', 'rejected', 'cancelled', 'completed', 'failed'];

/**
 * 🔥 CREATE TRANSACTION HELPER
 */
async function createTransaction({ session, user_id, type, amount, description, metadata = {}, status = 'completed' }) {
  try {
    const tx = await Transaction.create(
      [{
        user_id,
        type,
        amount,
        description,
        status: status,
        payment_method: metadata?.payment_method || 'system',
        reference_id: metadata?.reference_id,
        transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        metadata: {
          ...metadata,
          processed_at: new Date()
        }
      }],
      { session }
    );
    return tx[0];
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    throw error;
  }
}

/**
 * 🔥 REQUEST WITHDRAWAL (MAIN FUNCTION)
 */
exports.requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, payment_method, account_details = {}, user_note } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log(`💰 Withdrawal request from User: ${userId}, Amount: ${amount}, Method: ${payment_method}`);

    // 🔥 VALIDATION: Amount
    if (!amount || isNaN(amount) || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_AMOUNT',
        message: 'Invalid withdrawal amount' 
      });
    }

    const parsedAmount = Number(amount);

    // 🔥 VALIDATION: Amount limits
    if (parsedAmount < WITHDRAWAL_LIMITS.MIN) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MIN_AMOUNT_ERROR',
        message: `Minimum withdrawal amount is ৳${WITHDRAWAL_LIMITS.MIN}`,
        min_amount: WITHDRAWAL_LIMITS.MIN
      });
    }

    if (parsedAmount > WITHDRAWAL_LIMITS.MAX) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MAX_AMOUNT_ERROR',
        message: `Maximum withdrawal amount is ৳${WITHDRAWAL_LIMITS.MAX}`,
        max_amount: WITHDRAWAL_LIMITS.MAX
      });
    }

    // 🔥 VALIDATION: Payment method
    if (!PAYMENT_METHODS.includes(payment_method)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_PAYMENT_METHOD',
        message: `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(', ')}`,
        available_methods: PAYMENT_METHODS
      });
    }

    // 🔥 VALIDATION: Account details for mobile banking
    if (['bkash', 'nagad', 'rocket'].includes(payment_method)) {
      if (!account_details.phone || !validatePhoneNumber(account_details.phone)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          code: 'INVALID_PHONE',
          message: 'Valid 11-digit Bangladeshi mobile number is required (01XXXXXXXXX)'
        });
      }
    }

    // 🔥 GET USER
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        code: 'USER_NOT_FOUND',
        message: 'User not found' 
      });
    }

    console.log(`💰 User ${userId} current wallet_balance: ${user.wallet_balance}`);

    // 🔥 CHECK USER BALANCE
    if (user.wallet_balance < parsedAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient balance for withdrawal',
        current_balance: user.wallet_balance,
        required_amount: parsedAmount,
        short_by: parsedAmount - user.wallet_balance
      });
    }

    // 🔥 GET WALLET
    const wallet = await Wallet.findOne({ user_id: userId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'WALLET_ERROR',
        message: 'Wallet not found' 
      });
    }

    console.log(`💰 Wallet balance: ${wallet.balance}, Available: ${wallet.available_balance}`);

    // 🔥 CHECK WALLET BALANCE
    if (wallet.balance < parsedAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INSUFFICIENT_WALLET_BALANCE',
        message: 'Insufficient wallet balance',
        available_balance: wallet.balance,
        required_amount: parsedAmount
      });
    }

    // 🔥 CHECK DAILY LIMITS
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysWithdrawals = await Withdrawal.countDocuments({
      user_id: userId,
      status: { $in: ['pending', 'processing', 'approved'] },
      requested_at: { $gte: today }
    }).session(session);

    if (todaysWithdrawals >= WITHDRAWAL_LIMITS.DAILY_COUNT_MAX) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: `Maximum ${WITHDRAWAL_LIMITS.DAILY_COUNT_MAX} withdrawals allowed per day`,
        todays_count: todaysWithdrawals,
        max_daily: WITHDRAWAL_LIMITS.DAILY_COUNT_MAX
      });
    }

    // 🔥 DEDUCT FROM WALLET
    const walletUpdate = await Wallet.findOneAndUpdate(
      { user_id: userId, balance: { $gte: parsedAmount } },
      { 
        $inc: { 
          balance: -parsedAmount, 
          total_spent: parsedAmount,
          total_withdrawn: parsedAmount 
        },
        $set: { last_activity: new Date(), last_withdrawal: new Date() }
      },
      { new: true, session }
    );

    if (!walletUpdate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'WALLET_UPDATE_FAILED',
        message: 'Failed to update wallet balance' 
      });
    }

    // 🔥 UPDATE USER BALANCE
    user.wallet_balance -= parsedAmount;
    await user.save({ session });

    console.log(`✅ Wallet updated. New balance: ${walletUpdate.balance}, User balance: ${user.wallet_balance}`);

    // 🔥 CREATE WITHDRAWAL RECORD
    const withdrawalArr = await Withdrawal.create(
      [{
        user_id: userId,
        amount: parsedAmount,
        payment_method: payment_method,
        account_details: {
          ...account_details,
          verified: false
        },
        user_note: user_note || '',
        status: 'pending',
        requested_at: new Date(),
        metadata: {
          ip_address: ipAddress,
          user_agent: userAgent,
          user_role: userRole,
          previous_balance: user.wallet_balance + parsedAmount,
          new_balance: user.wallet_balance
        }
      }],
      { session }
    );
    const withdrawal = withdrawalArr[0];

    // 🔥 CREATE TRANSACTION RECORD
    const tx = await createTransaction({
      session,
      user_id: userId,
      type: 'withdrawal_request',
      amount: parsedAmount,
      description: `Withdrawal request via ${payment_method.toUpperCase()}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        withdrawal_number: withdrawal.withdrawal_number,
        status: 'pending',
        account: account_details.phone || account_details.account_number || null,
        method: payment_method,
        previous_balance: user.wallet_balance + parsedAmount,
        new_balance: user.wallet_balance,
        ip_address: ipAddress
      },
      status: 'pending'
    });

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Withdrawal request successful: ${withdrawal.withdrawal_number}, Amount: ${parsedAmount}`);

    // 🔥 SEND RESPONSE
    return res.status(201).json({
      success: true,
      code: 'WITHDRAWAL_REQUESTED',
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal: {
          id: withdrawal._id,
          withdrawal_number: withdrawal.withdrawal_number,
          amount: withdrawal.amount,
          formatted_amount: formatCurrency(withdrawal.amount),
          payment_method: withdrawal.payment_method,
          status: withdrawal.status,
          requested_at: withdrawal.requested_at,
          estimated_completion: '24-48 hours'
        },
        user: {
          id: user._id,
          username: user.username,
          wallet_balance: user.wallet_balance,
          formatted_balance: formatCurrency(user.wallet_balance)
        },
        wallet: {
          balance: walletUpdate.balance,
          available_balance: walletUpdate.available_balance,
          total_withdrawn: walletUpdate.total_withdrawn
        },
        transaction: {
          id: tx._id,
          transaction_id: tx.transaction_id,
          status: tx.status
        },
        limits: {
          min_withdrawal: WITHDRAWAL_LIMITS.MIN,
          max_withdrawal: WITHDRAWAL_LIMITS.MAX,
          daily_max_count: WITHDRAWAL_LIMITS.DAILY_COUNT_MAX
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 🔥 ROLLBACK ON ERROR
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Withdrawal request error:', error);
    
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to submit withdrawal request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 GET USER'S WITHDRAWALS (PAGINATED)
 */
exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      status,
      sort_by = '-requested_at'
    } = req.query;

    // 🔥 BUILD FILTER
    const filter = { user_id: userId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 🔥 CALCULATE PAGINATION
    const skip = (Number(page) - 1) * Number(limit);
    const sort = sort_by.startsWith('-') 
      ? { [sort_by.substring(1)]: -1 } 
      : { [sort_by]: 1 };

    // 🔥 GET WITHDRAWALS
    const withdrawals = await Withdrawal.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // 🔥 GET TOTAL COUNT
    const total = await Withdrawal.countDocuments(filter);

    // 🔥 GET USER CURRENT BALANCE
    const user = await User.findById(userId).select('wallet_balance username');

    // 🔥 FORMAT RESPONSE
    const formattedWithdrawals = withdrawals.map(wd => ({
      id: wd._id,
      withdrawal_number: wd.withdrawal_number,
      amount: wd.amount,
      formatted_amount: formatCurrency(wd.amount),
      payment_method: wd.payment_method,
      account_details: wd.account_details,
      status: wd.status,
      user_note: wd.user_note,
      requested_at: wd.requested_at,
      formatted_requested_at: wd.requested_at.toLocaleDateString('bn-BD'),
      processed_at: wd.processed_at,
      approved_at: wd.approved_at
    }));

    return res.json({
      success: true,
      code: 'WITHDRAWALS_FETCHED',
      message: 'Withdrawal history fetched successfully',
      data: {
        withdrawals: formattedWithdrawals,
        summary: {
          user_balance: user?.wallet_balance || 0,
          formatted_user_balance: formatCurrency(user?.wallet_balance || 0),
          total_count: total
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          has_next: Number(page) < Math.ceil(total / Number(limit)),
          has_prev: Number(page) > 1
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get user withdrawals error:', error);
    return res.status(500).json({ 
      success: false, 
      code: 'FETCH_ERROR',
      message: 'Failed to fetch withdrawal history',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 USER WITHDRAWAL STATS
 */
exports.getWithdrawalStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 🔥 GET STATS
    const [total, pending, approved, rejected, user, wallet] = await Promise.all([
      Withdrawal.countDocuments({ user_id: userId }),
      Withdrawal.countDocuments({ user_id: userId, status: 'pending' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'approved' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'rejected' }),
      User.findById(userId).select('wallet_balance username email'),
      Wallet.findOne({ user_id: userId })
    ]);

    // 🔥 GET AMOUNT STATS
    const amountStats = await Withdrawal.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          total_amount: { $sum: '$amount' }
        }
      }
    ]);

    const stats = {
      pending_amount: 0,
      approved_amount: 0,
      rejected_amount: 0,
      total_amount: 0
    };

    amountStats.forEach(stat => {
      if (stats[`${stat._id}_amount`] !== undefined) {
        stats[`${stat._id}_amount`] = stat.total_amount;
      }
      stats.total_amount += stat.total_amount;
    });

    return res.json({
      success: true,
      code: 'STATS_FETCHED',
      message: 'Withdrawal statistics fetched successfully',
      data: {
        user: {
          id: user?._id,
          username: user?.username,
          wallet_balance: user?.wallet_balance || 0,
          formatted_balance: formatCurrency(user?.wallet_balance || 0)
        },
        wallet: {
          balance: wallet?.balance || 0,
          total_earned: wallet?.total_earned || 0,
          total_spent: wallet?.total_spent || 0,
          total_withdrawn: wallet?.total_withdrawn || 0
        },
        withdrawal_stats: {
          counts: {
            total,
            pending,
            approved,
            rejected
          },
          amounts: {
            total: stats.total_amount,
            formatted_total: formatCurrency(stats.total_amount),
            pending: stats.pending_amount,
            approved: stats.approved_amount,
            rejected: stats.rejected_amount
          }
        },
        limits: {
          min_withdrawal: WITHDRAWAL_LIMITS.MIN,
          max_withdrawal: WITHDRAWAL_LIMITS.MAX,
          daily_max_withdrawals: WITHDRAWAL_LIMITS.DAILY_COUNT_MAX
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get withdrawal stats error:', error);
    return res.status(500).json({ 
      success: false, 
      code: 'STATS_ERROR',
      message: 'Failed to fetch withdrawal stats',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 ADMIN ANALYTICS
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
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch withdrawal analytics', 
      error: error.message 
    });
  }
};

/**
 * 🔥 ADMIN: GET PENDING WITHDRAWALS (PAGINATED)
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
      success: true,
      data: withdrawals,
      pagination: { 
        page: Number(page), 
        limit: Number(limit), 
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
 * 🔥 ADMIN: APPROVE WITHDRAWAL
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
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal request not found' 
      });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Withdrawal is already ${withdrawal.status}` 
      });
    }

    withdrawal.status = 'approved';
    withdrawal.transaction_id = transaction_id || withdrawal.transaction_id;
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes || withdrawal.admin_notes;
    withdrawal.processed_at = new Date();

    await withdrawal.save({ session });

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
 * 🔥 ADMIN: REJECT WITHDRAWAL
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
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal request not found' 
      });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Withdrawal is already ${withdrawal.status}` 
      });
    }

    // 🔥 REFUND TO WALLET
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: withdrawal.user_id },
      { 
        $inc: { 
          balance: withdrawal.amount, 
          total_spent: -withdrawal.amount 
        }
      },
      { new: true, session }
    );

    if (!wallet) {
      console.warn(`⚠️ Wallet not found for user ${withdrawal.user_id} while refunding withdrawal ${withdrawal._id}`);
    }

    // 🔥 REFUND TO USER BALANCE
    await User.findByIdAndUpdate(
      withdrawal.user_id,
      { $inc: { wallet_balance: withdrawal.amount } },
      { session }
    );

    await createTransaction({
      session,
      user_id: withdrawal.user_id,
      type: 'withdrawal_refund',
      amount: withdrawal.amount,
      description: `Withdrawal refund - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        status: 'completed',
        refundedBy: adminId,
        reason: admin_notes || 'Request rejected'
      }
    });

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
