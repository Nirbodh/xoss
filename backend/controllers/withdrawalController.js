const mongoose = require('mongoose');
const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet').Wallet;
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

    // 🔥 GET WALLET (এখানে User এর থেকে Wallet পাওয়া গুরুত্বপূর্ণ)
    const wallet = await Wallet.findOrCreate(userId, { session });
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
    if (wallet.available_balance < parsedAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INSUFFICIENT_WALLET_BALANCE',
        message: 'Insufficient wallet balance',
        available_balance: wallet.available_balance,
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

    // 🔥 USER বেলেন্সও চেক করুন (সিঙ্ক্রোনাইজেশন এর জন্য)
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

    // 🔥 WALLET থেকে টাকা কাটার জন্য wallet.withdraw() মেথড ব্যবহার করুন
    const previousBalance = wallet.balance;
    
    // Create withdrawal record first
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
          previous_balance: previousBalance,
          new_balance: previousBalance - parsedAmount
        }
      }],
      { session }
    );
    const withdrawal = withdrawalArr[0];

    // 🔥 WALLET থেকে টাকা কাটুন
    const walletResult = await wallet.withdraw(parsedAmount, {
      session,
      description: `Withdrawal request via ${payment_method.toUpperCase()}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        withdrawal_number: withdrawal.withdrawal_number,
        status: 'pending',
        payment_method: payment_method,
        account: account_details.phone || account_details.account_number || null,
        method: payment_method,
        previous_balance: previousBalance,
        new_balance: previousBalance - parsedAmount,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_role: userRole
      }
    });

    // 🔥 USER এর বেলেন্সও আপডেট করুন
    user.wallet_balance -= parsedAmount;
    await user.save({ session });

    console.log(`✅ Wallet updated. New balance: ${walletResult.wallet.balance}, User balance: ${user.wallet_balance}`);

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
          balance: walletResult.wallet.balance,
          available_balance: walletResult.wallet.available_balance,
          total_withdrawn: walletResult.wallet.total_withdrawn,
          daily_withdrawals: walletResult.wallet.daily_stats.withdrawals_today,
          daily_withdrawal_amount: walletResult.wallet.daily_stats.withdrawal_amount_today
        },
        transaction: {
          id: walletResult.transaction._id,
          transaction_id: walletResult.transaction.transaction_id,
          status: walletResult.transaction.status
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

    // 🔥 GET WALLET
    const wallet = await Wallet.findOrCreate(withdrawal.user_id, { session });
    
    if (!wallet) {
      console.warn(`⚠️ Wallet not found for user ${withdrawal.user_id} while refunding withdrawal ${withdrawal._id}`);
    } else {
      // 🔥 REFUND TO WALLET USING WALLET METHOD
      const refundResult = await wallet.refundWithdrawal(withdrawal.amount, {
        session,
        description: `Withdrawal rejected - Refunded`,
        metadata: {
          withdrawalId: String(withdrawal._id),
          status: 'refunded',
          rejectedBy: adminId,
          reason: admin_notes || 'Admin rejected',
          previous_balance: wallet.balance - withdrawal.amount,
          new_balance: wallet.balance,
          refunded_by: adminId
        }
      });
    }

    // 🔥 REFUND TO USER BALANCE
    await User.findByIdAndUpdate(
      withdrawal.user_id,
      { $inc: { wallet_balance: withdrawal.amount } },
      { session }
    );

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

/**
 * 🔥 USER: CANCEL WITHDRAWAL REQUEST
 */
exports.cancelWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { cancellation_reason } = req.body;

    console.log(`❌ User ${userId} attempting to cancel withdrawal ${id}`);

    // 🔥 FIND WITHDRAWAL
    const withdrawal = await Withdrawal.findById(id).session(session);
    
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal request not found'
      });
    }

    // 🔥 CHECK OWNERSHIP
    if (toObjectIdString(withdrawal.user_id) !== toObjectIdString(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You can only cancel your own withdrawal requests'
      });
    }

    // 🔥 CHECK IF CANCELLABLE
    if (!['pending', 'processing'].includes(withdrawal.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'CANCELLATION_NOT_ALLOWED',
        message: `Cannot cancel withdrawal with status: ${withdrawal.status}`,
        allowed_statuses: ['pending', 'processing']
      });
    }

    // 🔥 GET WALLET
    const wallet = await Wallet.findOrCreate(userId, { session });
    
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'WALLET_NOT_FOUND',
        message: 'Wallet not found'
      });
    }

    // 🔥 REFUND TO WALLET USING WALLET METHOD
    const refundResult = await wallet.refundWithdrawal(withdrawal.amount, {
      session,
      description: `Withdrawal cancellation refund - ${withdrawal.payment_method?.toUpperCase() || 'N/A'}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        withdrawal_number: withdrawal.withdrawal_number,
        reason: cancellation_reason || 'User requested cancellation',
        refunded_by: userId,
        previous_balance: wallet.balance - withdrawal.amount,
        new_balance: wallet.balance,
        payment_method: withdrawal.payment_method,
        status: 'refunded'
      }
    });

    // 🔥 UPDATE USER BALANCE
    await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet_balance: withdrawal.amount } },
      { session }
    );

    // 🔥 UPDATE WITHDRAWAL STATUS
    withdrawal.status = 'cancelled';
    withdrawal.cancelled_by = userId;
    withdrawal.cancellation_reason = cancellation_reason || 'User requested cancellation';
    withdrawal.cancelled_at = new Date();
    withdrawal.processed_at = new Date();

    await withdrawal.save({ session });

    // 🔥 UPDATE TRANSACTION STATUS
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: 'cancelled',
        description: `Withdrawal cancelled - ${withdrawal.payment_method?.toUpperCase() || 'N/A'}`,
        'metadata.status': 'cancelled',
        'metadata.cancellation_reason': cancellation_reason || 'User cancelled'
      },
      { session }
    );

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Withdrawal ${id} cancelled successfully. Amount refunded: ${withdrawal.amount}`);

    // 🔥 GET UPDATED USER INFO
    const user = await User.findById(userId).select('wallet_balance username email');

    return res.json({
      success: true,
      code: 'WITHDRAWAL_CANCELLED',
      message: 'Withdrawal cancelled successfully. Amount has been refunded to your wallet.',
      data: {
        withdrawal: {
          id: withdrawal._id,
          withdrawal_number: withdrawal.withdrawal_number,
          amount: withdrawal.amount,
          formatted_amount: formatCurrency(withdrawal.amount),
          status: withdrawal.status,
          cancelled_at: withdrawal.cancelled_at,
          cancellation_reason: withdrawal.cancellation_reason
        },
        user: {
          wallet_balance: user?.wallet_balance || 0,
          formatted_balance: formatCurrency(user?.wallet_balance || 0)
        },
        wallet: {
          balance: refundResult.wallet.balance,
          available_balance: refundResult.wallet.available_balance,
          total_withdrawn: refundResult.wallet.total_withdrawn
        },
        transaction: {
          id: refundResult.transaction._id,
          transaction_id: refundResult.transaction.transaction_id
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 🔥 ROLLBACK ON ERROR
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Cancel withdrawal error:', error);
    
    return res.status(500).json({
      success: false,
      code: 'CANCELLATION_FAILED',
      message: 'Failed to cancel withdrawal request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 GET WITHDRAWAL DETAILS (ADMIN)
 */
exports.getWithdrawalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone avatar')
      .populate('approved_by', 'username email')
      .populate('cancelled_by', 'username email');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal not found'
      });
    }

    return res.json({
      success: true,
      code: 'DETAILS_FETCHED',
      message: 'Withdrawal details fetched successfully',
      data: withdrawal
    });
  } catch (error) {
    console.error('❌ Get withdrawal details error:', error);
    return res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch withdrawal details',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 UPDATE WITHDRAWAL STATUS (ADMIN)
 */
exports.updateWithdrawalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, transaction_id, admin_notes } = req.body;
    const adminId = req.user.userId;

    const withdrawal = await Withdrawal.findById(id).session(session);
    
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal not found'
      });
    }

    // Validate status transition
    const allowedTransitions = {
      pending: ['processing', 'approved', 'rejected', 'cancelled'],
      processing: ['approved', 'rejected', 'cancelled'],
      approved: ['completed'],
      rejected: [],
      cancelled: [],
      completed: [],
      failed: ['pending', 'processing']
    };

    const allowed = allowedTransitions[withdrawal.status] || [];
    
    if (!allowed.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot change status from ${withdrawal.status} to ${status}`,
        allowed_transitions: allowed
      });
    }

    // Handle refund for rejection
    if (status === 'rejected' && withdrawal.status !== 'rejected') {
      // GET WALLET
      const wallet = await Wallet.findOrCreate(withdrawal.user_id, { session });
      
      if (wallet) {
        // REFUND TO WALLET USING WALLET METHOD
        await wallet.refundWithdrawal(withdrawal.amount, {
          session,
          description: `Withdrawal rejected - Refunded`,
          metadata: {
            withdrawalId: String(withdrawal._id),
            status: 'refunded',
            rejectedBy: adminId,
            reason: admin_notes || 'Admin rejected',
            previous_balance: wallet.balance - withdrawal.amount,
            new_balance: wallet.balance,
            refunded_by: adminId
          }
        });
      }

      // REFUND TO USER BALANCE
      await User.findByIdAndUpdate(
        withdrawal.user_id,
        { $inc: { wallet_balance: withdrawal.amount } },
        { session }
      );
    }

    // Update withdrawal
    withdrawal.status = status;
    if (status === 'approved' || status === 'rejected') {
      withdrawal.approved_by = adminId;
      withdrawal.approved_at = new Date();
    }
    
    if (transaction_id) withdrawal.transaction_id = transaction_id;
    if (admin_notes) withdrawal.admin_notes = admin_notes;
    
    withdrawal.processed_at = new Date();

    await withdrawal.save({ session });

    // Update transaction
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: status,
        description: `Withdrawal ${status} - ${withdrawal.payment_method?.toUpperCase() || 'N/A'}`,
        'metadata.status': status,
        'metadata.processedBy': adminId
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await withdrawal.populate('user_id', 'username email phone');

    return res.json({
      success: true,
      code: 'STATUS_UPDATED',
      message: `Withdrawal status updated to ${status}`,
      data: withdrawal
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Update withdrawal status error:', error);
    return res.status(500).json({
      success: false,
      code: 'UPDATE_FAILED',
      message: 'Failed to update withdrawal status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 GET WITHDRAWAL BY WITHDRAWAL NUMBER
 */
exports.getWithdrawalByNumber = async (req, res) => {
  try {
    const { withdrawal_number } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const withdrawal = await Withdrawal.findOne({ withdrawal_number })
      .populate('user_id', 'username email phone')
      .populate('approved_by', 'username email')
      .populate('cancelled_by', 'username email');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal not found'
      });
    }

    // Check permission
    const isOwner = toObjectIdString(withdrawal.user_id._id) === toObjectIdString(userId);
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'You are not authorized to view this withdrawal'
      });
    }

    return res.json({
      success: true,
      code: 'WITHDRAWAL_FOUND',
      message: 'Withdrawal fetched successfully',
      data: {
        ...withdrawal.toObject(),
        formatted_amount: formatCurrency(withdrawal.amount)
      }
    });
  } catch (error) {
    console.error('❌ Get withdrawal by number error:', error);
    return res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch withdrawal',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 BULK UPDATE WITHDRAWAL STATUS (ADMIN)
 */
exports.bulkUpdateWithdrawalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { withdrawal_ids, status, admin_notes } = req.body;
    const adminId = req.user.userId;

    if (!Array.isArray(withdrawal_ids) || withdrawal_ids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'Please provide withdrawal IDs'
      });
    }

    const withdrawals = await Withdrawal.find({ 
      _id: { $in: withdrawal_ids },
      status: { $in: ['pending', 'processing'] }
    }).session(session);

    if (withdrawals.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_VALID_WITHDRAWALS',
        message: 'No valid withdrawals found for update'
      });
    }

    const updatedWithdrawals = [];
    
    for (const withdrawal of withdrawals) {
      // Handle refund for rejection
      if (status === 'rejected') {
        const wallet = await Wallet.findOrCreate(withdrawal.user_id, { session });
        if (wallet) {
          await wallet.refundWithdrawal(withdrawal.amount, {
            session,
            description: `Withdrawal rejected - Refunded`,
            metadata: {
              withdrawalId: String(withdrawal._id),
              status: 'refunded',
              rejectedBy: adminId,
              reason: admin_notes || 'Bulk rejection',
              previous_balance: wallet.balance - withdrawal.amount,
              new_balance: wallet.balance,
              refunded_by: adminId
            }
          });
        }

        await User.findByIdAndUpdate(
          withdrawal.user_id,
          { $inc: { wallet_balance: withdrawal.amount } },
          { session }
        );
      }

      // Update withdrawal
      withdrawal.status = status;
      withdrawal.approved_by = adminId;
      withdrawal.approved_at = new Date();
      withdrawal.admin_notes = admin_notes || '';
      withdrawal.processed_at = new Date();

      await withdrawal.save({ session });

      // Update transaction
      await Transaction.findOneAndUpdate(
        { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
        {
          status: status,
          description: `Withdrawal ${status} - ${withdrawal.payment_method?.toUpperCase() || 'N/A'}`,
          'metadata.status': status,
          'metadata.processedBy': adminId
        },
        { session }
      );

      updatedWithdrawals.push(withdrawal);
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      code: 'BULK_UPDATE_SUCCESS',
      message: `Successfully updated ${updatedWithdrawals.length} withdrawals to ${status}`,
      data: {
        count: updatedWithdrawals.length,
        status: status
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Bulk update withdrawal status error:', error);
    return res.status(500).json({
      success: false,
      code: 'BULK_UPDATE_FAILED',
      message: 'Failed to bulk update withdrawal status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 EXPORT WITHDRAWALS (ADMIN)
 */
exports.exportWithdrawals = async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;

    const filter = {};
    
    if (start_date && end_date) {
      filter.requested_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate('user_id', 'username email phone')
      .populate('approved_by', 'username email')
      .sort({ requested_at: -1 });

    // Format for CSV/Excel
    const formattedData = withdrawals.map(wd => ({
      'Withdrawal Number': wd.withdrawal_number,
      'User': wd.user_id?.username || 'N/A',
      'Email': wd.user_id?.email || 'N/A',
      'Phone': wd.user_id?.phone || 'N/A',
      'Amount': wd.amount,
      'Payment Method': wd.payment_method,
      'Status': wd.status,
      'Requested At': wd.requested_at.toISOString(),
      'Processed At': wd.processed_at ? wd.processed_at.toISOString() : 'N/A',
      'Approved By': wd.approved_by?.username || 'N/A',
      'Transaction ID': wd.transaction_id || 'N/A'
    }));

    return res.json({
      success: true,
      code: 'EXPORT_SUCCESS',
      message: 'Withdrawals exported successfully',
      data: {
        count: withdrawals.length,
        withdrawals: formattedData
      }
    });
  } catch (error) {
    console.error('❌ Export withdrawals error:', error);
    return res.status(500).json({
      success: false,
      code: 'EXPORT_FAILED',
      message: 'Failed to export withdrawals',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};
