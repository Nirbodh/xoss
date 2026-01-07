const mongoose = require('mongoose');
const { Withdrawal, Wallet, Transaction } = require('../models/Wallet');
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

// 🔥 CONSTANTS
const WITHDRAWAL_LIMITS = { 
  MIN: 100, 
  MAX: 50000,
  DAILY_MAX: 100000
};

const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'bank'];
const WITHDRAWAL_STATUS = ['pending', 'processing', 'approved', 'rejected', 'cancelled', 'failed'];

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
        transaction_id: `WD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
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
    if (payment_method && !PAYMENT_METHODS.includes(payment_method)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_PAYMENT_METHOD',
        message: `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(', ')}`,
        available_methods: PAYMENT_METHODS
      });
    }

    // 🔥 VALIDATION: Account details
    if (payment_method === 'bkash' || payment_method === 'nagad' || payment_method === 'rocket') {
      if (!account_details.phone || account_details.phone.length !== 11) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          code: 'INVALID_ACCOUNT_DETAILS',
          message: 'Valid 11-digit phone number is required for mobile banking'
        });
      }
    }

    // 🔥 GET USER AND WALLET WITH SESSION
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

    // 🔥 CHECK USER WALLET BALANCE
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

    // 🔥 CHECK WALLET LIMITS
    const wallet = await Wallet.findOne({ user_id: userId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'WALLET_NOT_FOUND',
        message: 'Wallet not found' 
      });
    }

    const limitCheck = wallet.checkLimits('withdrawal', parsedAmount);
    if (!limitCheck.allowed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: limitCheck.reason,
        limits: wallet.limits
      });
    }

    // 🔥 CHECK DAILY WITHDRAWAL COUNT
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysWithdrawals = await Withdrawal.countDocuments({
      user_id: userId,
      status: { $in: ['pending', 'processing', 'approved'] },
      requested_at: { $gte: today }
    }).session(session);

    if (todaysWithdrawals >= 5) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: 'Maximum 5 withdrawals allowed per day',
        todays_count: todaysWithdrawals
      });
    }

    // 🔥 ATOMIC OPERATION: Deduct from wallet
    const updatedWallet = await Wallet.findOneAndUpdate(
      { 
        user_id: userId, 
        available_balance: { $gte: parsedAmount },
        balance: { $gte: parsedAmount }
      },
      { 
        $inc: { 
          balance: -parsedAmount,
          available_balance: -parsedAmount,
          total_spent: parsedAmount,
          total_withdrawn: parsedAmount,
          'daily_stats.withdrawal_amount_today': parsedAmount,
          'daily_stats.withdrawals_today': 1
        },
        last_activity: new Date(),
        last_withdrawal: new Date()
      },
      { 
        new: true, 
        runValidators: true,
        session 
      }
    );

    if (!updatedWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'WALLET_UPDATE_FAILED',
        message: 'Unable to process withdrawal - wallet update failed'
      });
    }

    // 🔥 ATOMIC OPERATION: Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $inc: { 
          wallet_balance: -parsedAmount 
        }
      },
      { 
        new: true,
        session 
      }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'USER_UPDATE_FAILED',
        message: 'Unable to process withdrawal - user update failed'
      });
    }

    // 🔥 CREATE WITHDRAWAL RECORD
    const withdrawalNumber = `WD${Date.now()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    const withdrawalArr = await Withdrawal.create(
      [{
        user_id: userId,
        withdrawal_number: withdrawalNumber,
        amount: parsedAmount,
        payment_method: payment_method || 'bkash',
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
          previous_balance: user.wallet_balance,
          new_balance: updatedUser.wallet_balance
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
      description: `Withdrawal request #${withdrawalNumber} via ${(payment_method || 'bkash').toUpperCase()}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        withdrawal_number: withdrawalNumber,
        status: 'pending',
        account: account_details?.phone || account_details?.account_number || null,
        method: payment_method || 'bkash',
        previous_balance: user.wallet_balance,
        new_balance: updatedUser.wallet_balance,
        ip_address: ipAddress
      },
      status: 'pending'
    });

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Withdrawal request successful: ${withdrawalNumber}, Amount: ${parsedAmount}, User: ${userId}`);

    // 🔥 POPULATE USER DATA
    await withdrawal.populate('user_id', 'username email phone wallet_balance');

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
          id: updatedUser._id,
          username: updatedUser.username,
          wallet_balance: updatedUser.wallet_balance,
          formatted_balance: formatCurrency(updatedUser.wallet_balance)
        },
        wallet: {
          balance: updatedWallet.balance,
          available_balance: updatedWallet.available_balance,
          total_withdrawn: updatedWallet.total_withdrawn
        },
        transaction: {
          id: tx._id,
          transaction_id: tx.transaction_id,
          status: tx.status
        },
        limits: {
          min_withdrawal: WITHDRAWAL_LIMITS.MIN,
          max_withdrawal: WITHDRAWAL_LIMITS.MAX,
          daily_max: WITHDRAWAL_LIMITS.DAILY_MAX
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 🔥 ROLLBACK ON ERROR
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Withdrawal request error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      amount: req.body?.amount
    });
    
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to submit withdrawal request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      timestamp: new Date().toISOString()
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
      start_date, 
      end_date,
      sort_by = '-requested_at',
      payment_method 
    } = req.query;

    // 🔥 BUILD FILTER
    const filter = { user_id: userId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (payment_method) {
      filter.payment_method = payment_method;
    }
    
    if (start_date || end_date) {
      filter.requested_at = {};
      if (start_date) filter.requested_at.$gte = new Date(start_date);
      if (end_date) filter.requested_at.$lte = new Date(end_date);
    }

    // 🔥 CALCULATE PAGINATION
    const skip = (Number(page) - 1) * Number(limit);
    const sort = sort_by.startsWith('-') 
      ? { [sort_by.substring(1)]: -1 } 
      : { [sort_by]: 1 };

    // 🔥 GET WITHDRAWALS WITH POPULATION
    const withdrawals = await Withdrawal.find(filter)
      .populate('user_id', 'username email phone avatar wallet_balance')
      .populate('approved_by', 'username avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // 🔥 GET TOTAL COUNT
    const total = await Withdrawal.countDocuments(filter);

    // 🔥 GET USER CURRENT BALANCE
    const user = await User.findById(userId).select('wallet_balance username');
    const wallet = await Wallet.findOne({ user_id: userId });

    // 🔥 CALCULATE STATS
    const stats = await Withdrawal.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total_withdrawn: { $sum: '$amount' },
          total_count: { $sum: 1 },
          pending_amount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          pending_count: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approved_amount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          },
          approved_count: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // 🔥 FORMAT RESPONSE
    const formattedWithdrawals = withdrawals.map(wd => ({
      ...wd,
      formatted_amount: formatCurrency(wd.amount),
      formatted_requested_at: wd.requested_at ? wd.requested_at.toISOString() : null,
      formatted_processed_at: wd.processed_at ? wd.processed_at.toISOString() : null,
      user: wd.user_id ? {
        username: wd.user_id.username,
        email: wd.user_id.email,
        wallet_balance: wd.user_id.wallet_balance,
        formatted_balance: formatCurrency(wd.user_id.wallet_balance)
      } : null
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
          wallet_balance: wallet?.balance || 0,
          available_balance: wallet?.available_balance || 0,
          ...(stats[0] || {
            total_withdrawn: 0,
            total_count: 0,
            pending_amount: 0,
            pending_count: 0,
            approved_amount: 0,
            approved_count: 0
          })
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          has_next: Number(page) < Math.ceil(total / Number(limit)),
          has_prev: Number(page) > 1
        },
        filters: {
          status,
          payment_method,
          start_date,
          end_date,
          sort_by
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

    // 🔥 GET COMPREHENSIVE STATS
    const [
      total,
      pending,
      approved,
      rejected,
      user,
      wallet,
      dailyStats
    ] = await Promise.all([
      Withdrawal.countDocuments({ user_id: userId }),
      Withdrawal.countDocuments({ user_id: userId, status: 'pending' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'approved' }),
      Withdrawal.countDocuments({ user_id: userId, status: 'rejected' }),
      User.findById(userId).select('wallet_balance total_earnings username email phone'),
      Wallet.findOne({ user_id: userId }),
      Withdrawal.aggregate([
        {
          $match: {
            user_id: new mongoose.Types.ObjectId(userId),
            requested_at: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        },
        {
          $group: {
            _id: null,
            daily_count: { $sum: 1 },
            daily_amount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // 🔥 AGGREGATE AMOUNTS
    const amountStats = await Withdrawal.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 🔥 PROCESS STATS
    const stats = {
      pending_amount: 0,
      approved_amount: 0,
      rejected_amount: 0,
      total_amount: 0
    };

    amountStats.forEach(stat => {
      stats[`${stat._id}_amount`] = stat.total_amount;
      stats.total_amount += stat.total_amount;
    });

    // 🔥 GET RECENT TRANSACTIONS
    const recentWithdrawals = await Withdrawal.find({ user_id: userId })
      .sort({ requested_at: -1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,
      code: 'STATS_FETCHED',
      message: 'Withdrawal statistics fetched successfully',
      data: {
        user: {
          id: user?._id,
          username: user?.username,
          wallet_balance: user?.wallet_balance || 0,
          formatted_balance: formatCurrency(user?.wallet_balance || 0),
          total_earnings: user?.total_earnings || 0
        },
        wallet: {
          balance: wallet?.balance || 0,
          available_balance: wallet?.available_balance || 0,
          locked_balance: wallet?.locked_balance || 0,
          total_earned: wallet?.total_earned || 0,
          total_spent: wallet?.total_spent || 0,
          total_withdrawn: wallet?.total_withdrawn || 0,
          limits: wallet?.limits || {}
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
          },
          daily: {
            count: dailyStats[0]?.daily_count || 0,
            amount: dailyStats[0]?.daily_amount || 0,
            formatted_amount: formatCurrency(dailyStats[0]?.daily_amount || 0)
          }
        },
        recent_withdrawals: recentWithdrawals.map(wd => ({
          id: wd._id,
          amount: wd.amount,
          formatted_amount: formatCurrency(wd.amount),
          status: wd.status,
          payment_method: wd.payment_method,
          requested_at: wd.requested_at
        })),
        limits: {
          min_withdrawal: WITHDRAWAL_LIMITS.MIN,
          max_withdrawal: WITHDRAWAL_LIMITS.MAX,
          daily_max_withdrawals: 5
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
 * 🔥 ADMIN: GET WITHDRAWAL ANALYTICS
 */
exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { period = 'today' } = req.query;
    let startDate, endDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    // 🔥 COMPREHENSIVE ANALYTICS
    const [
      totalPending,
      totalApproved,
      totalRejected,
      pendingAgg,
      approvedAgg,
      rejectedAgg,
      dailyStats,
      methodStats,
      recentPending
    ] = await Promise.all([
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'approved' }),
      Withdrawal.countDocuments({ status: 'rejected' }),
      Withdrawal.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'approved', requested_at: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'rejected', requested_at: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            requested_at: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$requested_at' }
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            requested_at: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$payment_method',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Withdrawal.find({ status: 'pending' })
        .populate('user_id', 'username email phone avatar wallet_balance')
        .sort({ requested_at: -1 })
        .limit(10)
        .lean()
    ]);

    // 🔥 GET TOP USERS
    const topUsers = await Withdrawal.aggregate([
      {
        $match: {
          status: 'approved',
          requested_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user_id',
          total_withdrawn: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total_withdrawn: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          user_id: '$_id',
          username: '$user.username',
          email: '$user.email',
          total_withdrawn: 1,
          count: 1,
          formatted_total: formatCurrency('$total_withdrawn')
        }
      }
    ]);

    return res.json({
      success: true,
      code: 'ANALYTICS_FETCHED',
      message: 'Withdrawal analytics fetched successfully',
      data: {
        period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overview: {
          counts: {
            pending: totalPending,
            approved: totalApproved,
            rejected: totalRejected,
            total: totalPending + totalApproved + totalRejected
          },
          amounts: {
            pending: pendingAgg[0]?.total || 0,
            approved: approvedAgg[0]?.total || 0,
            rejected: rejectedAgg[0]?.total || 0,
            total: (pendingAgg[0]?.total || 0) + (approvedAgg[0]?.total || 0) + (rejectedAgg[0]?.total || 0)
          }
        },
        daily_stats: dailyStats.map(day => ({
          date: day._id,
          amount: day.amount,
          formatted_amount: formatCurrency(day.amount),
          count: day.count
        })),
        method_stats: methodStats.map(method => ({
          method: method._id,
          amount: method.amount,
          formatted_amount: formatCurrency(method.amount),
          count: method.count,
          percentage: ((method.amount / (approvedAgg[0]?.total || 1)) * 100).toFixed(1)
        })),
        top_users: topUsers,
        recent_pending: recentPending.map(wd => ({
          ...wd,
          formatted_amount: formatCurrency(wd.amount),
          user: wd.user_id ? {
            username: wd.user_id.username,
            email: wd.user_id.email,
            wallet_balance: wd.user_id.wallet_balance
          } : null
        })),
        summary: {
          avg_withdrawal: approvedAgg[0]?.total && approvedAgg[0]?.count 
            ? approvedAgg[0].total / approvedAgg[0].count 
            : 0,
          success_rate: approvedAgg[0]?.count && (approvedAgg[0]?.count + rejectedAgg[0]?.count)
            ? (approvedAgg[0].count / (approvedAgg[0].count + rejectedAgg[0].count)) * 100
            : 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get withdrawal analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      code: 'ANALYTICS_ERROR',
      message: 'Failed to fetch withdrawal analytics',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 ADMIN: GET PENDING WITHDRAWALS
 */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { 
      page = 1, 
      limit = 20,
      sort_by = '-requested_at',
      search 
    } = req.query;

    // 🔥 BUILD FILTER
    const filter = { status: 'pending' };
    
    if (search) {
      const userIds = await User.find({
        $or: [
          { username: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') }
        ]
      }).select('_id');
      
      filter.user_id = { $in: userIds.map(u => u._id) };
    }

    // 🔥 CALCULATE PAGINATION
    const skip = (Number(page) - 1) * Number(limit);
    const sort = sort_by.startsWith('-') 
      ? { [sort_by.substring(1)]: -1 } 
      : { [sort_by]: 1 };

    // 🔥 GET WITHDRAWALS
    const withdrawals = await Withdrawal.find(filter)
      .populate('user_id', 'username email phone avatar wallet_balance created_at')
      .populate('approved_by', 'username avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // 🔥 GET TOTAL COUNT
    const total = await Withdrawal.countDocuments(filter);

    // 🔥 CALCULATE TOTAL PENDING AMOUNT
    const totalPendingAmount = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 🔥 FORMAT RESPONSE
    const formattedWithdrawals = withdrawals.map(wd => ({
      ...wd,
      formatted_amount: formatCurrency(wd.amount),
      formatted_requested_at: wd.requested_at.toISOString(),
      user: wd.user_id ? {
        id: wd.user_id._id,
        username: wd.user_id.username,
        email: wd.user_id.email,
        phone: wd.user_id.phone,
        avatar: wd.user_id.avatar,
        wallet_balance: wd.user_id.wallet_balance,
        formatted_balance: formatCurrency(wd.user_id.wallet_balance),
        member_since: wd.user_id.created_at
      } : null
    }));

    return res.json({
      success: true,
      code: 'PENDING_WITHDRAWALS_FETCHED',
      message: 'Pending withdrawals fetched successfully',
      data: {
        withdrawals: formattedWithdrawals,
        summary: {
          total_pending: total,
          total_pending_amount: totalPendingAmount[0]?.total || 0,
          formatted_total_amount: formatCurrency(totalPendingAmount[0]?.total || 0),
          avg_pending_amount: total > 0 ? (totalPendingAmount[0]?.total || 0) / total : 0
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          has_next: Number(page) < Math.ceil(total / Number(limit)),
          has_prev: Number(page) > 1
        },
        filters: {
          search,
          sort_by
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get pending withdrawals error:', error);
    return res.status(500).json({ 
      success: false, 
      code: 'FETCH_ERROR',
      message: 'Failed to fetch pending withdrawals',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
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
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { 
      transaction_id, 
      admin_notes, 
      gateway_response,
      processed_amount 
    } = req.body;
    
    const adminId = req.user.userId;
    const adminName = req.user.name || req.user.username;

    console.log(`✅ Admin ${adminId} approving withdrawal: ${id}`);

    // 🔥 GET WITHDRAWAL WITH SESSION
    const withdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone wallet_balance')
      .session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal request not found' 
      });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_STATUS',
        message: `Withdrawal is already ${withdrawal.status}`,
        current_status: withdrawal.status
      });
    }

    // 🔥 VALIDATE PROCESSED AMOUNT
    const finalAmount = processed_amount || withdrawal.amount;
    if (finalAmount <= 0 || finalAmount > withdrawal.amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_PROCESSED_AMOUNT',
        message: `Processed amount must be between 0 and ${withdrawal.amount}`,
        original_amount: withdrawal.amount,
        processed_amount: finalAmount
      });
    }

    // 🔥 UPDATE WITHDRAWAL STATUS
    withdrawal.status = 'approved';
    withdrawal.transaction_id = transaction_id || withdrawal.transaction_id;
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes || withdrawal.admin_notes;
    withdrawal.processed_at = new Date();
    withdrawal.processed_amount = finalAmount;
    withdrawal.gateway_response = gateway_response || withdrawal.gateway_response;
    
    // 🔥 ADD TO METADATA
    withdrawal.metadata = {
      ...withdrawal.metadata,
      approved_by_admin: adminName,
      approved_at: new Date(),
      processed_amount: finalAmount,
      gateway_response: gateway_response
    };

    await withdrawal.save({ session });

    // 🔥 UPDATE TRANSACTION STATUS
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: 'completed',
        description: `Withdrawal processed - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
        'metadata.status': 'completed',
        'metadata.processedBy': adminId,
        'metadata.processedAt': new Date(),
        'metadata.gateway_transaction_id': transaction_id,
        'metadata.gateway_response': gateway_response
      },
      { session }
    );

    // 🔥 IF PROCESSED AMOUNT IS LESS THAN REQUESTED, REFUND DIFFERENCE
    if (finalAmount < withdrawal.amount) {
      const refundAmount = withdrawal.amount - finalAmount;
      
      if (refundAmount > 0) {
        // 🔥 REFUND TO WALLET
        const wallet = await Wallet.findOneAndUpdate(
          { user_id: withdrawal.user_id },
          { 
            $inc: { 
              balance: refundAmount,
              available_balance: refundAmount,
              total_earned: refundAmount
            },
            last_activity: new Date()
          },
          { new: true, session }
        );

        // 🔥 REFUND TO USER
        await User.findByIdAndUpdate(
          withdrawal.user_id,
          { 
            $inc: { 
              wallet_balance: refundAmount 
            }
          },
          { session }
        );

        // 🔥 CREATE REFUND TRANSACTION
        await createTransaction({
          session,
          user_id: withdrawal.user_id,
          type: 'withdrawal_refund',
          amount: refundAmount,
          description: `Partial withdrawal refund - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
          metadata: {
            withdrawalId: String(withdrawal._id),
            status: 'completed',
            refundedBy: adminId,
            original_amount: withdrawal.amount,
            processed_amount: finalAmount,
            refund_amount: refundAmount,
            reason: 'Partial processing'
          }
        });

        console.log(`💰 Partial refund of ${refundAmount} to user ${withdrawal.user_id}`);
      }
    }

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    // 🔥 GET UPDATED DATA
    const updatedWithdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone wallet_balance')
      .populate('approved_by', 'username avatar');

    console.log(`✅ Withdrawal ${id} approved by admin ${adminId}`);

    return res.json({
      success: true,
      code: 'WITHDRAWAL_APPROVED',
      message: 'Withdrawal approved successfully',
      data: {
        withdrawal: {
          ...updatedWithdrawal.toObject(),
          formatted_amount: formatCurrency(updatedWithdrawal.amount),
          formatted_processed_amount: formatCurrency(updatedWithdrawal.processed_amount || updatedWithdrawal.amount),
          formatted_requested_at: updatedWithdrawal.requested_at.toISOString(),
          formatted_approved_at: updatedWithdrawal.approved_at.toISOString()
        },
        admin: {
          id: adminId,
          name: adminName
        },
        refund_info: finalAmount < withdrawal.amount ? {
          refunded: true,
          refund_amount: withdrawal.amount - finalAmount,
          formatted_refund_amount: formatCurrency(withdrawal.amount - finalAmount)
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Approve withdrawal error:', {
      error: error.message,
      stack: error.stack,
      withdrawalId: req.params?.id,
      adminId: req.user?.userId
    });
    
    return res.status(500).json({
      success: false,
      code: 'APPROVAL_ERROR',
      message: 'Failed to approve withdrawal',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
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
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { admin_notes, reject_reason = 'Request rejected' } = req.body;
    const adminId = req.user.userId;
    const adminName = req.user.name || req.user.username;

    console.log(`❌ Admin ${adminId} rejecting withdrawal: ${id}`);

    // 🔥 GET WITHDRAWAL WITH SESSION
    const withdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone wallet_balance')
      .session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal request not found' 
      });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_STATUS',
        message: `Withdrawal is already ${withdrawal.status}`,
        current_status: withdrawal.status
      });
    }

    // 🔥 REFUND TO WALLET
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: withdrawal.user_id },
      { 
        $inc: { 
          balance: withdrawal.amount,
          available_balance: withdrawal.amount,
          total_earned: withdrawal.amount,
          total_spent: -withdrawal.amount,
          total_withdrawn: -withdrawal.amount
        },
        last_activity: new Date()
      },
      { new: true, session }
    );

    if (!wallet) {
      console.warn(`⚠️ Wallet not found for user ${withdrawal.user_id} while refunding withdrawal ${withdrawal._id}`);
    }

    // 🔥 REFUND TO USER
    await User.findByIdAndUpdate(
      withdrawal.user_id,
      { 
        $inc: { 
          wallet_balance: withdrawal.amount 
        }
      },
      { session }
    );

    // 🔥 CREATE REFUND TRANSACTION
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
        reject_reason: reject_reason,
        admin_notes: admin_notes,
        original_amount: withdrawal.amount
      }
    });

    // 🔥 UPDATE WITHDRAWAL STATUS
    withdrawal.status = 'rejected';
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes || '';
    withdrawal.reject_reason = reject_reason;
    withdrawal.processed_at = new Date();
    
    // 🔥 ADD TO METADATA
    withdrawal.metadata = {
      ...withdrawal.metadata,
      rejected_by_admin: adminName,
      rejected_at: new Date(),
      reject_reason: reject_reason,
      refund_processed: true,
      refund_amount: withdrawal.amount
    };

    await withdrawal.save({ session });

    // 🔥 UPDATE ORIGINAL TRANSACTION
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: 'cancelled',
        description: `Withdrawal rejected - ${reject_reason}`,
        'metadata.status': 'rejected',
        'metadata.rejectedBy': adminId,
        'metadata.rejectedAt': new Date(),
        'metadata.rejectReason': reject_reason
      },
      { session }
    );

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    // 🔥 GET UPDATED DATA
    const updatedWithdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone wallet_balance')
      .populate('approved_by', 'username avatar');

    console.log(`✅ Withdrawal ${id} rejected by admin ${adminId}`);

    return res.json({
      success: true,
      code: 'WITHDRAWAL_REJECTED',
      message: 'Withdrawal rejected and amount refunded',
      data: {
        withdrawal: {
          ...updatedWithdrawal.toObject(),
          formatted_amount: formatCurrency(updatedWithdrawal.amount),
          formatted_requested_at: updatedWithdrawal.requested_at.toISOString(),
          formatted_rejected_at: updatedWithdrawal.approved_at.toISOString()
        },
        user: {
          wallet_balance: updatedWithdrawal.user_id.wallet_balance,
          formatted_balance: formatCurrency(updatedWithdrawal.user_id.wallet_balance)
        },
        wallet: {
          balance: wallet?.balance || 0,
          available_balance: wallet?.available_balance || 0,
          total_earned: wallet?.total_earned || 0,
          total_spent: wallet?.total_spent || 0
        },
        refund_details: {
          amount: withdrawal.amount,
          formatted_amount: formatCurrency(withdrawal.amount),
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        admin: {
          id: adminId,
          name: adminName
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Reject withdrawal error:', {
      error: error.message,
      stack: error.stack,
      withdrawalId: req.params?.id,
      adminId: req.user?.userId
    });
    
    return res.status(500).json({
      success: false,
      code: 'REJECTION_ERROR',
      message: 'Failed to reject withdrawal',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 ADMIN: GET WITHDRAWAL DETAILS
 */
exports.getWithdrawalDetails = async (req, res) => {
  try {
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone avatar wallet_balance created_at')
      .populate('approved_by', 'username avatar')
      .lean();

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        code: 'WITHDRAWAL_NOT_FOUND',
        message: 'Withdrawal not found' 
      });
    }

    // 🔥 GET USER WALLET INFO
    const wallet = await Wallet.findOne({ user_id: withdrawal.user_id });
    
    // 🔥 GET RELATED TRANSACTIONS
    const transactions = await Transaction.find({
      'metadata.withdrawalId': toObjectIdString(withdrawal._id)
    }).sort({ createdAt: -1 });

    // 🔥 GET USER'S WITHDRAWAL HISTORY
    const userWithdrawals = await Withdrawal.find({ 
      user_id: withdrawal.user_id,
      _id: { $ne: withdrawal._id }
    })
    .sort({ requested_at: -1 })
    .limit(5)
    .lean();

    // 🔥 FORMAT RESPONSE
    const formattedWithdrawal = {
      ...withdrawal,
      formatted_amount: formatCurrency(withdrawal.amount),
      formatted_requested_at: withdrawal.requested_at.toISOString(),
      formatted_processed_at: withdrawal.processed_at ? withdrawal.processed_at.toISOString() : null,
      user: withdrawal.user_id ? {
        id: withdrawal.user_id._id,
        username: withdrawal.user_id.username,
        email: withdrawal.user_id.email,
        phone: withdrawal.user_id.phone,
        avatar: withdrawal.user_id.avatar,
        wallet_balance: withdrawal.user_id.wallet_balance,
        formatted_balance: formatCurrency(withdrawal.user_id.wallet_balance),
        member_since: withdrawal.user_id.created_at,
        wallet_info: wallet ? {
          balance: wallet.balance,
          available_balance: wallet.available_balance,
          locked_balance: wallet.locked_balance,
          total_withdrawn: wallet.total_withdrawn
        } : null
      } : null,
      approved_by_info: withdrawal.approved_by ? {
        username: withdrawal.approved_by.username,
        avatar: withdrawal.approved_by.avatar
      } : null,
      transactions: transactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        formatted_amount: formatCurrency(tx.amount),
        status: tx.status,
        created_at: tx.createdAt,
        description: tx.description
      })),
      user_withdrawal_history: userWithdrawals.map(wd => ({
        id: wd._id,
        amount: wd.amount,
        formatted_amount: formatCurrency(wd.amount),
        status: wd.status,
        payment_method: wd.payment_method,
        requested_at: wd.requested_at
      }))
    };

    return res.json({
      success: true,
      code: 'WITHDRAWAL_DETAILS_FETCHED',
      message: 'Withdrawal details fetched successfully',
      data: formattedWithdrawal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get withdrawal details error:', error);
    return res.status(500).json({ 
      success: false, 
      code: 'DETAILS_ERROR',
      message: 'Failed to fetch withdrawal details',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 USER: CANCEL WITHDRAWAL
 */
exports.cancelWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ User ${userId} cancelling withdrawal: ${id}`);

    // 🔥 GET WITHDRAWAL WITH SESSION
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
    if (String(withdrawal.user_id) !== String(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ 
        success: false, 
        code: 'UNAUTHORIZED',
        message: 'You can only cancel your own withdrawals' 
      });
    }

    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_STATUS',
        message: `Cannot cancel withdrawal with status: ${withdrawal.status}`,
        current_status: withdrawal.status
      });
    }

    // 🔥 CHECK IF CANCELLATION IS ALLOWED (within 1 hour)
    const requestedTime = new Date(withdrawal.requested_at);
    const currentTime = new Date();
    const hoursDiff = (currentTime - requestedTime) / (1000 * 60 * 60);

    if (hoursDiff > 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        code: 'CANCELLATION_EXPIRED',
        message: 'Withdrawal can only be cancelled within 1 hour of request',
        hours_passed: hoursDiff.toFixed(2)
      });
    }

    // 🔥 REFUND TO WALLET
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: userId },
      { 
        $inc: { 
          balance: withdrawal.amount,
          available_balance: withdrawal.amount,
          total_earned: withdrawal.amount,
          total_spent: -withdrawal.amount,
          total_withdrawn: -withdrawal.amount
        },
        last_activity: new Date()
      },
      { new: true, session }
    );

    // 🔥 REFUND TO USER
    await User.findByIdAndUpdate(
      userId,
      { 
        $inc: { 
          wallet_balance: withdrawal.amount 
        }
      },
      { session }
    );

    // 🔥 CREATE REFUND TRANSACTION
    await createTransaction({
      session,
      user_id: userId,
      type: 'withdrawal_refund',
      amount: withdrawal.amount,
      description: `Withdrawal cancelled by user - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
      metadata: {
        withdrawalId: String(withdrawal._id),
        status: 'cancelled',
        cancelled_by: 'user',
        original_amount: withdrawal.amount,
        cancellation_reason: 'User requested cancellation'
      }
    });

    // 🔥 UPDATE WITHDRAWAL STATUS
    withdrawal.status = 'cancelled';
    withdrawal.cancelled_at = new Date();
    withdrawal.cancelled_by = userId;
    withdrawal.cancellation_reason = 'User requested cancellation';
    withdrawal.processed_at = new Date();
    
    // 🔥 ADD TO METADATA
    withdrawal.metadata = {
      ...withdrawal.metadata,
      cancelled_by_user: true,
      cancelled_at: new Date(),
      refund_processed: true,
      refund_amount: withdrawal.amount
    };

    await withdrawal.save({ session });

    // 🔥 UPDATE ORIGINAL TRANSACTION
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: 'cancelled',
        description: `Withdrawal cancelled by user`,
        'metadata.status': 'cancelled',
        'metadata.cancelledBy': 'user',
        'metadata.cancelledAt': new Date()
      },
      { session }
    );

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Withdrawal ${id} cancelled by user ${userId}`);

    return res.json({
      success: true,
      code: 'WITHDRAWAL_CANCELLED',
      message: 'Withdrawal cancelled successfully',
      data: {
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          formatted_amount: formatCurrency(withdrawal.amount),
          status: withdrawal.status,
          cancelled_at: withdrawal.cancelled_at
        },
        user: {
          wallet_balance: wallet?.balance || 0,
          formatted_balance: formatCurrency(wallet?.balance || 0)
        },
        refund_details: {
          amount: withdrawal.amount,
          formatted_amount: formatCurrency(withdrawal.amount),
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Cancel withdrawal error:', {
      error: error.message,
      stack: error.stack,
      withdrawalId: req.params?.id,
      userId: req.user?.userId
    });
    
    return res.status(500).json({
      success: false,
      code: 'CANCELLATION_ERROR',
      message: 'Failed to cancel withdrawal',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 UPDATE WITHDRAWAL STATUS
 */
exports.updateWithdrawalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const adminId = req.user.userId;

    // 🔥 VALIDATE STATUS
    if (!WITHDRAWAL_STATUS.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Invalid status. Must be one of: ${WITHDRAWAL_STATUS.join(', ')}`,
        valid_statuses: WITHDRAWAL_STATUS
      });
    }

    console.log(`🔄 Admin ${adminId} updating withdrawal ${id} to status: ${status}`);

    // 🔥 GET WITHDRAWAL
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

    // 🔥 VALIDATE STATUS TRANSITION
    const validTransitions = {
      'pending': ['processing', 'approved', 'rejected', 'cancelled'],
      'processing': ['approved', 'rejected', 'failed'],
      'approved': ['completed', 'failed'],
      'rejected': [],
      'cancelled': [],
      'failed': []
    };

    if (!validTransitions[withdrawal.status]?.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot change status from ${withdrawal.status} to ${status}`,
        current_status: withdrawal.status,
        requested_status: status,
        valid_transitions: validTransitions[withdrawal.status]
      });
    }

    // 🔥 UPDATE WITHDRAWAL
    withdrawal.status = status;
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.admin_notes = admin_notes || withdrawal.admin_notes;
    withdrawal.processed_at = new Date();
    
    // 🔥 ADD TO METADATA
    withdrawal.metadata = {
      ...withdrawal.metadata,
      status_updated_by: adminId,
      status_updated_at: new Date(),
      previous_status: withdrawal.status,
      new_status: status
    };

    await withdrawal.save({ session });

    // 🔥 UPDATE TRANSACTION
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
      {
        status: status === 'approved' || status === 'completed' ? 'completed' : status,
        description: `Withdrawal ${status} - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
        'metadata.status': status,
        'metadata.processedBy': adminId,
        'metadata.processedAt': new Date()
      },
      { session }
    );

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Withdrawal ${id} status updated to ${status} by admin ${adminId}`);

    return res.json({
      success: true,
      code: 'STATUS_UPDATED',
      message: `Withdrawal status updated to ${status}`,
      data: {
        withdrawal: {
          id: withdrawal._id,
          status: withdrawal.status,
          previous_status: withdrawal.metadata.previous_status,
          updated_at: withdrawal.processed_at
        },
        admin: {
          id: adminId
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Update withdrawal status error:', error);
    
    return res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_ERROR',
      message: 'Failed to update withdrawal status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 BULK UPDATE WITHDRAWAL STATUS
 */
exports.bulkUpdateWithdrawalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { withdrawal_ids, status, admin_notes } = req.body;
    const adminId = req.user.userId;

    // 🔥 VALIDATE INPUT
    if (!Array.isArray(withdrawal_ids) || withdrawal_ids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'withdrawal_ids must be a non-empty array'
      });
    }

    if (!WITHDRAWAL_STATUS.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Invalid status. Must be one of: ${WITHDRAWAL_STATUS.join(', ')}`
      });
    }

    console.log(`🔄 Admin ${adminId} bulk updating ${withdrawal_ids.length} withdrawals to status: ${status}`);

    // 🔥 GET WITHDRAWALS
    const withdrawals = await Withdrawal.find({
      _id: { $in: withdrawal_ids },
      status: 'pending'
    }).session(session);

    if (withdrawals.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_PENDING_WITHDRAWALS',
        message: 'No pending withdrawals found for the provided IDs'
      });
    }

    const results = [];
    const userIds = [...new Set(withdrawals.map(w => w.user_id))];

    // 🔥 PROCESS EACH WITHDRAWAL
    for (const withdrawal of withdrawals) {
      try {
        if (status === 'approved') {
          // 🔥 APPROVE LOGIC
          withdrawal.status = 'approved';
          withdrawal.approved_by = adminId;
          withdrawal.approved_at = new Date();
          withdrawal.admin_notes = admin_notes || withdrawal.admin_notes;
          withdrawal.processed_at = new Date();
          
          // 🔥 UPDATE TRANSACTION
          await Transaction.findOneAndUpdate(
            { 'metadata.withdrawalId': toObjectIdString(withdrawal._id) },
            {
              status: 'completed',
              description: `Withdrawal approved - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
              'metadata.status': 'approved',
              'metadata.processedBy': adminId,
              'metadata.processedAt': new Date()
            },
            { session }
          );

          results.push({
            withdrawal_id: withdrawal._id,
            status: 'approved',
            success: true,
            message: 'Approved successfully'
          });

        } else if (status === 'rejected') {
          // 🔥 REJECT LOGIC
          const refundAmount = withdrawal.amount;
          
          // 🔥 REFUND TO WALLET
          await Wallet.findOneAndUpdate(
            { user_id: withdrawal.user_id },
            { 
              $inc: { 
                balance: refundAmount,
                available_balance: refundAmount,
                total_earned: refundAmount,
                total_spent: -refundAmount,
                total_withdrawn: -refundAmount
              },
              last_activity: new Date()
            },
            { session }
          );

          // 🔥 REFUND TO USER
          await User.findByIdAndUpdate(
            withdrawal.user_id,
            { 
              $inc: { 
                wallet_balance: refundAmount 
              }
            },
            { session }
          );

          // 🔥 CREATE REFUND TRANSACTION
          await createTransaction({
            session,
            user_id: withdrawal.user_id,
            type: 'withdrawal_refund',
            amount: refundAmount,
            description: `Withdrawal rejected - ${withdrawal.payment_method?.toUpperCase() || 'BKASH'}`,
            metadata: {
              withdrawalId: String(withdrawal._id),
              status: 'rejected',
              refundedBy: adminId,
              reject_reason: admin_notes || 'Bulk rejection',
              refund_amount: refundAmount
            }
          });

          withdrawal.status = 'rejected';
          withdrawal.approved_by = adminId;
          withdrawal.approved_at = new Date();
          withdrawal.admin_notes = admin_notes || '';
          withdrawal.reject_reason = admin_notes || 'Bulk rejection';
          withdrawal.processed_at = new Date();

          results.push({
            withdrawal_id: withdrawal._id,
            status: 'rejected',
            success: true,
            message: 'Rejected and refunded',
            refund_amount: refundAmount
          });
        }

        // 🔥 UPDATE WITHDRAWAL METADATA
        withdrawal.metadata = {
          ...withdrawal.metadata,
          bulk_processed: true,
          bulk_processed_by: adminId,
          bulk_processed_at: new Date(),
          previous_status: 'pending',
          new_status: status
        };

        await withdrawal.save({ session });

      } catch (error) {
        console.error(`❌ Error processing withdrawal ${withdrawal._id}:`, error);
        results.push({
          withdrawal_id: withdrawal._id,
          status: 'error',
          success: false,
          message: error.message
        });
      }
    }

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Bulk update completed: ${successCount} successful, ${failCount} failed`);

    return res.json({
      success: true,
      code: 'BULK_UPDATE_COMPLETED',
      message: `Bulk update completed: ${successCount} successful, ${failCount} failed`,
      data: {
        total_processed: results.length,
        successful: successCount,
        failed: failCount,
        results: results,
        summary: {
          total_amount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
          formatted_total_amount: formatCurrency(withdrawals.reduce((sum, w) => sum + w.amount, 0)),
          affected_users: userIds.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Bulk update withdrawal status error:', error);
    
    return res.status(500).json({
      success: false,
      code: 'BULK_UPDATE_ERROR',
      message: 'Failed to perform bulk update',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

/**
 * 🔥 EXPORT WITHDRAWALS TO CSV/EXCEL
 */
exports.exportWithdrawals = async (req, res) => {
  try {
    // 🔥 CHECK ADMIN PERMISSION
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    const { 
      start_date, 
      end_date, 
      status,
      payment_method,
      format = 'json' 
    } = req.query;

    // 🔥 BUILD FILTER
    const filter = {};
    
    if (start_date || end_date) {
      filter.requested_at = {};
      if (start_date) filter.requested_at.$gte = new Date(start_date);
      if (end_date) filter.requested_at.$lte = new Date(end_date);
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (payment_method) {
      filter.payment_method = payment_method;
    }

    // 🔥 GET WITHDRAWALS WITH USER DATA
    const withdrawals = await Withdrawal.find(filter)
      .populate('user_id', 'username email phone')
      .populate('approved_by', 'username')
      .sort({ requested_at: -1 })
      .lean();

    if (format === 'csv') {
      // 🔥 CSV FORMAT
      const csvHeaders = [
        'Withdrawal ID',
        'User',
        'Email',
        'Phone',
        'Amount',
        'Payment Method',
        'Account Details',
        'Status',
        'Requested At',
        'Processed At',
        'Approved By',
        'Admin Notes'
      ];

      const csvRows = withdrawals.map(wd => [
        wd.withdrawal_number || wd._id,
        wd.user_id?.username || 'N/A',
        wd.user_id?.email || 'N/A',
        wd.user_id?.phone || 'N/A',
        wd.amount,
        wd.payment_method,
        JSON.stringify(wd.account_details),
        wd.status,
        wd.requested_at ? wd.requested_at.toISOString() : 'N/A',
        wd.processed_at ? wd.processed_at.toISOString() : 'N/A',
        wd.approved_by?.username || 'N/A',
        wd.admin_notes || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=withdrawals_${Date.now()}.csv`);
      return res.send(csvContent);

    } else {
      // 🔥 JSON FORMAT
      const formattedWithdrawals = withdrawals.map(wd => ({
        withdrawal_id: wd._id,
        withdrawal_number: wd.withdrawal_number,
        user: {
          username: wd.user_id?.username,
          email: wd.user_id?.email,
          phone: wd.user_id?.phone
        },
        amount: wd.amount,
        formatted_amount: formatCurrency(wd.amount),
        payment_method: wd.payment_method,
        account_details: wd.account_details,
        status: wd.status,
        requested_at: wd.requested_at ? wd.requested_at.toISOString() : null,
        processed_at: wd.processed_at ? wd.processed_at.toISOString() : null,
        approved_by: wd.approved_by?.username,
        admin_notes: wd.admin_notes,
        metadata: wd.metadata
      }));

      return res.json({
        success: true,
        code: 'EXPORT_COMPLETED',
        message: 'Withdrawals exported successfully',
        data: formattedWithdrawals,
        summary: {
          total_records: withdrawals.length,
          total_amount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
          formatted_total_amount: formatCurrency(withdrawals.reduce((sum, w) => sum + w.amount, 0)),
          date_range: {
            start: start_date || 'N/A',
            end: end_date || 'N/A'
          }
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Export withdrawals error:', error);
    return res.status(500).json({ 
      success: false, 
      code: 'EXPORT_ERROR',
      message: 'Failed to export withdrawals',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};
