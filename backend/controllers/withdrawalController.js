// controllers/withdrawalController.js - PRODUCTION PRO VERSION
const mongoose = require('mongoose');
const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet').Wallet;
const Transaction = require('../models/Wallet').Transaction;
const User = require('../models/User');
const Notification = require('../models/Notification');
const Redis = require('ioredis');

// Redis for rate limiting and caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 🔥 CONSTANTS
const WITHDRAWAL_CONFIG = {
  MIN_AMOUNT: parseInt(process.env.MIN_WITHDRAWAL) || 100,
  MAX_AMOUNT: parseInt(process.env.MAX_WITHDRAWAL) || 50000,
  DAILY_MAX_AMOUNT: parseInt(process.env.DAILY_WITHDRAWAL_LIMIT) || 100000,
  DAILY_MAX_COUNT: 5,
  PROCESSING_FEE_PERCENTAGE: parseFloat(process.env.WITHDRAWAL_FEE) || 1.5,
  PROCESSING_TIME_HOURS: 24,
  MAX_PENDING_PER_USER: 3
};

const PAYMENT_METHODS = {
  BKASH: { min: 100, max: 25000, fee: 0, processing: '24 hours' },
  NAGAD: { min: 100, max: 25000, fee: 0, processing: '24 hours' },
  ROCKET: { min: 100, max: 25000, fee: 0, processing: '24 hours' },
  BANK: { min: 1000, max: 50000, fee: 15, processing: '48-72 hours' }
};

// 🔥 HELPER FUNCTIONS
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

const validateBankAccount = (account) => {
  return account.account_number && account.account_name && account.bank_name;
};

const generateWithdrawalNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `WD${timestamp}${random}`;
};

const calculateProcessingFee = (amount, method) => {
  const config = PAYMENT_METHODS[method.toUpperCase()];
  return config ? (amount * (config.fee / 100)) : 0;
};

const getNetAmount = (amount, method) => {
  const fee = calculateProcessingFee(amount, method);
  return amount - fee;
};

// 🔥 RATE LIMITING
const checkRateLimit = async (userId, action) => {
  const key = `rate_limit:${action}:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = action === 'withdrawal' ? 5 : 10;

  const requests = await redis.lrange(key, 0, -1);
  const recentRequests = requests.filter(time => now - parseInt(time) < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  await redis.lpush(key, now.toString());
  await redis.ltrim(key, 0, maxRequests - 1);
  await redis.expire(key, windowMs / 1000);

  return true;
};

// ==================== REQUEST WITHDRAWAL ====================
exports.requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, payment_method, account_details = {}, user_note = '' } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const ipAddress = req.headers['x-forwarded-for'] || req.ip;
    const userAgent = req.headers['user-agent'];

    console.log(`💰 WITHDRAWAL REQUEST | User: ${req.user.username} | Amount: ${amount} | Method: ${payment_method}`);

    // 🔥 VALIDATION PHASE
    const validation = await validateWithdrawalRequest({
      userId,
      amount,
      paymentMethod: payment_method,
      accountDetails: account_details,
      ipAddress
    }, session);

    if (!validation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(validation.status).json(validation.response);
    }

    // 🔥 CALCULATE AMOUNTS
    const parsedAmount = Number(amount);
    const processingFee = calculateProcessingFee(parsedAmount, payment_method);
    const netAmount = getNetAmount(parsedAmount, payment_method);
    const previousBalance = validation.wallet.balance;

    // 🔥 CREATE WITHDRAWAL RECORD
    const withdrawalData = {
      user_id: userId,
      withdrawal_number: generateWithdrawalNumber(),
      amount: parsedAmount,
      processing_fee: processingFee,
      net_amount: netAmount,
      payment_method: payment_method,
      account_details: {
        ...account_details,
        verified: false,
        verification_status: 'pending'
      },
      status: 'pending',
      requested_at: new Date(),
      estimated_completion: new Date(Date.now() + WITHDRAWAL_CONFIG.PROCESSING_TIME_HOURS * 60 * 60 * 1000),
      user_note: user_note,
      metadata: {
        ip_address: ipAddress,
        user_agent: userAgent,
        user_role: userRole,
        device_info: req.headers['sec-ch-ua'] || 'Unknown',
        location: req.headers['x-geo-location'] || 'Unknown',
        previous_balance: previousBalance,
        new_balance: previousBalance - parsedAmount,
        processing_fee_percentage: PAYMENT_METHODS[payment_method.toUpperCase()]?.fee || 0
      }
    };

    const [withdrawal] = await Withdrawal.create([withdrawalData], { session });

    // 🔥 PROCESS PAYMENT FROM WALLET
    const walletResult = await validation.wallet.processWithdrawal(parsedAmount, {
      session,
      withdrawalId: withdrawal._id,
      withdrawalNumber: withdrawal.withdrawal_number,
      description: `Withdrawal via ${payment_method.toUpperCase()}`,
      metadata: {
        payment_method: payment_method,
        account_details: account_details,
        processing_fee: processingFee,
        net_amount: netAmount,
        ip_address: ipAddress,
        user_agent: userAgent
      }
    });

    // 🔥 UPDATE USER BALANCE
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          wallet_balance: -parsedAmount,
          total_withdrawals: parsedAmount
        },
        $set: { last_withdrawal: new Date() }
      },
      { new: true, session }
    ).select('wallet_balance username email phone');

    // 🔥 CREATE NOTIFICATION
    await createWithdrawalNotification({
      userId,
      withdrawal,
      type: 'requested',
      session
    });

    // 🔥 UPDATE ADMIN DASHBOARD STATS
    await updateWithdrawalStats({
      userId,
      amount: parsedAmount,
      method: payment_method,
      session
    });

    // 🔥 COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    // 🔥 CLEAR RELEVANT CACHES
    await clearUserWithdrawalCache(userId);

    // 🔥 LOG SUCCESS
    logWithdrawalRequest({
      withdrawal,
      user: req.user,
      ipAddress,
      processingFee
    });

    // 🔥 SEND SUCCESS RESPONSE
    return res.status(201).json({
      success: true,
      code: 'WITHDRAWAL_REQUEST_CREATED',
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal: formatWithdrawalResponse(withdrawal),
        financial: {
          requested_amount: parsedAmount,
          formatted_requested: formatCurrency(parsedAmount),
          processing_fee: processingFee,
          formatted_fee: formatCurrency(processingFee),
          net_amount: netAmount,
          formatted_net: formatCurrency(netAmount),
          fee_percentage: PAYMENT_METHODS[payment_method.toUpperCase()]?.fee || 0
        },
        user: {
          id: user._id,
          username: user.username,
          wallet_balance: user.wallet_balance,
          formatted_balance: formatCurrency(user.wallet_balance)
        },
        timeline: {
          requested: withdrawal.requested_at,
          estimated_completion: withdrawal.estimated_completion,
          processing_time: WITHDRAWAL_CONFIG.PROCESSING_TIME_HOURS + ' hours',
          current_status: 'Under review'
        },
        transaction: {
          id: walletResult.transaction._id,
          transaction_id: walletResult.transaction.transaction_id,
          reference: withdrawal.withdrawal_number
        },
        next_steps: [
          'Wait for admin approval (24-48 hours)',
          'Keep your phone nearby for verification',
          'Check email for updates'
        ]
      },
      timestamp: new Date().toISOString(),
      reference_id: withdrawal.withdrawal_number
    });

  } catch (error) {
    // 🔥 ERROR HANDLING
    await session.abortTransaction();
    session.endSession();

    console.error('❌ WITHDRAWAL REQUEST ERROR:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
      endpoint: req.originalUrl
    });

    return handleWithdrawalError(res, error);
  }
};

// 🔥 VALIDATION FUNCTION
const validateWithdrawalRequest = async (data, session) => {
  const { userId, amount, paymentMethod, accountDetails, ipAddress } = data;

  // Check amount validity
  if (!amount || isNaN(amount) || amount <= 0) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'Please enter a valid withdrawal amount'
      }
    };
  }

  const parsedAmount = Number(amount);

  // Check minimum amount
  if (parsedAmount < WITHDRAWAL_CONFIG.MIN_AMOUNT) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'BELOW_MINIMUM',
        message: `Minimum withdrawal amount is ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}`,
        min_amount: WITHDRAWAL_CONFIG.MIN_AMOUNT,
        formatted_min: formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)
      }
    };
  }

  // Check maximum amount
  if (parsedAmount > WITHDRAWAL_CONFIG.MAX_AMOUNT) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'EXCEEDS_MAXIMUM',
        message: `Maximum withdrawal amount is ${formatCurrency(WITHDRAWAL_CONFIG.MAX_AMOUNT)}`,
        max_amount: WITHDRAWAL_CONFIG.MAX_AMOUNT,
        formatted_max: formatCurrency(WITHDRAWAL_CONFIG.MAX_AMOUNT)
      }
    };
  }

  // Check payment method validity
  const methodUpper = paymentMethod.toUpperCase();
  if (!PAYMENT_METHODS[methodUpper]) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'INVALID_PAYMENT_METHOD',
        message: `Invalid payment method. Available: ${Object.keys(PAYMENT_METHODS).join(', ')}`,
        available_methods: Object.keys(PAYMENT_METHODS)
      }
    };
  }

  // Check method-specific limits
  const methodConfig = PAYMENT_METHODS[methodUpper];
  if (parsedAmount < methodConfig.min) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'METHOD_MINIMUM',
        message: `Minimum amount for ${paymentMethod} is ${formatCurrency(methodConfig.min)}`,
        method_min: methodConfig.min,
        formatted_method_min: formatCurrency(methodConfig.min)
      }
    };
  }

  if (parsedAmount > methodConfig.max) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'METHOD_MAXIMUM',
        message: `Maximum amount for ${paymentMethod} is ${formatCurrency(methodConfig.max)}`,
        method_max: methodConfig.max,
        formatted_method_max: formatCurrency(methodConfig.max)
      }
    };
  }

  // Validate account details
  const accountValidation = validateAccountDetails(paymentMethod, accountDetails);
  if (!accountValidation.valid) {
    return {
      valid: false,
      status: 400,
      response: accountValidation.response
    };
  }

  // Check rate limiting
  const canProceed = await checkRateLimit(userId, 'withdrawal');
  if (!canProceed) {
    return {
      valid: false,
      status: 429,
      response: {
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many withdrawal attempts. Please try again later.',
        retry_after: '1 hour'
      }
    };
  }

  // Get user and wallet
  const [user, wallet] = await Promise.all([
    User.findById(userId).session(session),
    Wallet.findOrCreate(userId, { session })
  ]);

  if (!user) {
    return {
      valid: false,
      status: 404,
      response: {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found'
      }
    };
  }

  if (!wallet) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'WALLET_NOT_FOUND',
        message: 'Wallet not found'
      }
    };
  }

  // Check wallet balance
  if (wallet.available_balance < parsedAmount) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient wallet balance',
        available_balance: wallet.available_balance,
        formatted_available: formatCurrency(wallet.available_balance),
        required_amount: parsedAmount,
        short_by: parsedAmount - wallet.available_balance
      }
    };
  }

  // Check user balance (sync check)
  if (user.wallet_balance < parsedAmount) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'USER_BALANCE_INSUFFICIENT',
        message: 'Insufficient account balance',
        user_balance: user.wallet_balance,
        formatted_user_balance: formatCurrency(user.wallet_balance)
      }
    };
  }

  // Check daily limits
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStats = await Withdrawal.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        status: { $in: ['pending', 'approved', 'processing'] },
        requested_at: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        total_amount: { $sum: '$amount' }
      }
    }
  ]).session(session);

  const todayCount = todayStats[0]?.count || 0;
  const todayAmount = todayStats[0]?.total_amount || 0;

  if (todayCount >= WITHDRAWAL_CONFIG.DAILY_MAX_COUNT) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: `Maximum ${WITHDRAWAL_CONFIG.DAILY_MAX_COUNT} withdrawals allowed per day`,
        today_count: todayCount,
        max_daily: WITHDRAWAL_CONFIG.DAILY_MAX_COUNT
      }
    };
  }

  if (todayAmount + parsedAmount > WITHDRAWAL_CONFIG.DAILY_MAX_AMOUNT) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'DAILY_AMOUNT_EXCEEDED',
        message: `Daily withdrawal limit exceeded`,
        today_amount: todayAmount,
        requested_additional: parsedAmount,
        daily_limit: WITHDRAWAL_CONFIG.DAILY_MAX_AMOUNT,
        available_today: WITHDRAWAL_CONFIG.DAILY_MAX_AMOUNT - todayAmount
      }
    };
  }

  // Check pending withdrawals
  const pendingCount = await Withdrawal.countDocuments({
    user_id: userId,
    status: { $in: ['pending', 'processing'] }
  }).session(session);

  if (pendingCount >= WITHDRAWAL_CONFIG.MAX_PENDING_PER_USER) {
    return {
      valid: false,
      status: 400,
      response: {
        success: false,
        code: 'MAX_PENDING_REACHED',
        message: `You have ${pendingCount} pending withdrawals. Maximum ${WITHDRAWAL_CONFIG.MAX_PENDING_PER_USER} allowed.`,
        pending_count: pendingCount,
        max_pending: WITHDRAWAL_CONFIG.MAX_PENDING_PER_USER
      }
    };
  }

  return {
    valid: true,
    wallet,
    user
  };
};

// 🔥 ACCOUNT VALIDATION
const validateAccountDetails = (method, details) => {
  switch (method.toLowerCase()) {
    case 'bkash':
    case 'nagad':
    case 'rocket':
      if (!details.phone || !validatePhoneNumber(details.phone)) {
        return {
          valid: false,
          response: {
            success: false,
            code: 'INVALID_PHONE',
            message: 'Valid 11-digit Bangladeshi mobile number required (01XXXXXXXXX)'
          }
        };
      }
      break;

    case 'bank':
      if (!validateBankAccount(details)) {
        return {
          valid: false,
          response: {
            success: false,
            code: 'INVALID_BANK_DETAILS',
            message: 'Bank account requires: account_number, account_name, and bank_name'
          }
        };
      }
      break;

    default:
      return {
        valid: false,
        response: {
          success: false,
          code: 'UNSUPPORTED_METHOD',
          message: 'Unsupported payment method'
        }
      };
  }

  return { valid: true };
};

// 🔥 NOTIFICATION SYSTEM
const createWithdrawalNotification = async ({ userId, withdrawal, type, session }) => {
  try {
    const notificationTypes = {
      requested: {
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for ${formatCurrency(withdrawal.amount)} has been submitted.`,
        priority: 'high'
      },
      approved: {
        title: 'Withdrawal Approved',
        message: `Your withdrawal of ${formatCurrency(withdrawal.amount)} has been approved.`,
        priority: 'urgent'
      },
      rejected: {
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request has been rejected.`,
        priority: 'high'
      },
      completed: {
        title: 'Withdrawal Completed',
        message: `৳${withdrawal.net_amount} has been sent to your ${withdrawal.payment_method} account.`,
        priority: 'urgent'
      }
    };

    const config = notificationTypes[type];
    if (!config) return;

    await Notification.create([{
      user_id: userId,
      type: `withdrawal_${type}`,
      title: config.title,
      message: config.message,
      data: {
        withdrawal_id: withdrawal._id,
        withdrawal_number: withdrawal.withdrawal_number,
        amount: withdrawal.amount,
        status: withdrawal.status,
        payment_method: withdrawal.payment_method
      },
      priority: config.priority,
      read: false
    }], { session });

  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// 🔥 STATS UPDATER
const updateWithdrawalStats = async ({ userId, amount, method, session }) => {
  try {
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          'stats.total_withdrawals': 1,
          'stats.total_withdrawal_amount': amount,
          [`stats.${method}_withdrawals`]: 1,
          [`stats.${method}_withdrawal_amount`]: amount
        }
      },
      { session }
    );
  } catch (error) {
    console.error('Stats update error:', error);
  }
};

// 🔥 CACHE MANAGEMENT
const clearUserWithdrawalCache = async (userId) => {
  const keys = [
    `withdrawals:user:${userId}`,
    `withdrawal_stats:${userId}`,
    'withdrawals:dashboard'
  ];
  
  try {
    await redis.del(...keys);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// 🔥 LOGGING
const logWithdrawalRequest = ({ withdrawal, user, ipAddress, processingFee }) => {
  console.log(`✅ WITHDRAWAL REQUESTED | ID: ${withdrawal.withdrawal_number} | User: ${user.username} | Amount: ${formatCurrency(withdrawal.amount)} | Fee: ${formatCurrency(processingFee)} | IP: ${ipAddress}`);
};

// 🔥 RESPONSE FORMATTER
const formatWithdrawalResponse = (withdrawal) => {
  return {
    id: withdrawal._id,
    withdrawal_number: withdrawal.withdrawal_number,
    amount: withdrawal.amount,
    formatted_amount: formatCurrency(withdrawal.amount),
    processing_fee: withdrawal.processing_fee,
    net_amount: withdrawal.net_amount,
    formatted_net: formatCurrency(withdrawal.net_amount),
    payment_method: withdrawal.payment_method,
    account_details: {
      ...withdrawal.account_details,
      masked: maskAccountDetails(withdrawal.payment_method, withdrawal.account_details)
    },
    status: withdrawal.status,
    status_history: withdrawal.status_history || [],
    requested_at: withdrawal.requested_at,
    estimated_completion: withdrawal.estimated_completion,
    user_note: withdrawal.user_note,
    admin_notes: withdrawal.admin_notes,
    transaction_id: withdrawal.transaction_id
  };
};

const maskAccountDetails = (method, details) => {
  if (!details) return {};
  
  switch (method.toLowerCase()) {
    case 'bkash':
    case 'nagad':
    case 'rocket':
      const phone = details.phone || '';
      return { phone: phone.replace(/(\d{4})\d{4}(\d{3})/, '$1****$2') };
    
    case 'bank':
      const acc = details.account_number || '';
      return {
        account_number: acc.replace(/\d(?=\d{4})/g, '*'),
        account_name: details.account_name,
        bank_name: details.bank_name
      };
    
    default:
      return {};
  }
};

// 🔥 ERROR HANDLER
const handleWithdrawalError = (res, error) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An error occurred while processing your request';

  if (error.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (error.name === 'MongoError' && error.code === 11000) {
    status = 409;
    code = 'DUPLICATE_REQUEST';
    message = 'Similar withdrawal request already exists';
  } else if (error.message.includes('insufficient')) {
    status = 400;
    code = 'INSUFFICIENT_FUNDS';
    message = error.message;
  }

  const response = {
    success: false,
    code,
    message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }

  return res.status(status).json(response);
};

// ==================== GET USER WITHDRAWALS (ENHANCED) ====================
exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `withdrawals:user:${userId}:${JSON.stringify(req.query)}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const { 
      page = 1, 
      limit = 20, 
      status,
      payment_method,
      start_date,
      end_date,
      sort_by = '-requested_at',
      include_stats = 'true'
    } = req.query;

    // Build filter
    const filter = { user_id: userId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (payment_method && payment_method !== 'all') {
      filter.payment_method = payment_method;
    }
    
    if (start_date || end_date) {
      filter.requested_at = {};
      if (start_date) filter.requested_at.$gte = new Date(start_date);
      if (end_date) filter.requested_at.$lte = new Date(end_date);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build sort
    const sort = {};
    if (sort_by.startsWith('-')) {
      sort[sort_by.substring(1)] = -1;
    } else {
      sort[sort_by] = 1;
    }

    // Execute queries
    const [withdrawals, total, user, stats] = await Promise.all([
      Withdrawal.find(filter)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      
      Withdrawal.countDocuments(filter),
      
      User.findById(userId).select('wallet_balance username email phone avatar'),
      
      include_stats === 'true' ? getWithdrawalStats(userId) : null
    ]);

    // Format withdrawals
    const formattedWithdrawals = withdrawals.map(wd => formatWithdrawalResponse(wd));

    // Prepare response
    const response = {
      success: true,
      code: 'WITHDRAWALS_FETCHED',
      message: `Found ${withdrawals.length} withdrawals`,
      data: {
        withdrawals: formattedWithdrawals,
        meta: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum,
          has_next: pageNum * limitNum < total,
          has_prev: pageNum > 1
        },
        user: {
          id: user._id,
          username: user.username,
          wallet_balance: user.wallet_balance,
          formatted_balance: formatCurrency(user.wallet_balance),
          total_withdrawals: stats?.total_withdrawals || 0
        },
        stats: stats || undefined,
        filters: {
          status: status || 'all',
          payment_method: payment_method || 'all',
          date_range: { start_date, end_date },
          sort_by: sort_by
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 60 // 1 minute cache
      }
    };

    // Cache response
    await redis.setex(cacheKey, 60, JSON.stringify(response));

    return res.json(response);

  } catch (error) {
    console.error('❌ GET USER WITHDRAWALS ERROR:', error);
    return res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch withdrawal history',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: APPROVE WITHDRAWAL ====================
exports.approveWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { transaction_id, admin_notes, verification_code } = req.body;
    const adminId = req.user.userId;
    const adminName = req.user.username;

    console.log(`👑 ADMIN APPROVAL | Withdrawal: ${id} | Admin: ${adminName}`);

    // Get withdrawal with user details
    const withdrawal = await Withdrawal.findById(id)
      .populate('user_id', 'username email phone')
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

    // Validate status
    if (withdrawal.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Cannot approve withdrawal with status: ${withdrawal.status}`,
        current_status: withdrawal.status
      });
    }

    // Verify account details for mobile banking
    if (['bkash', 'nagad', 'rocket'].includes(withdrawal.payment_method)) {
      if (!verification_code) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          code: 'VERIFICATION_REQUIRED',
          message: 'Verification code required for mobile banking approval'
        });
      }

      // In production, integrate with SMS verification service
      const isValid = await verifySmsCode(
        withdrawal.account_details.phone,
        verification_code
      );

      if (!isValid) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          code: 'INVALID_VERIFICATION',
          message: 'Invalid verification code'
        });
      }
    }

    // Update withdrawal
    withdrawal.status = 'approved';
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();
    withdrawal.transaction_id = transaction_id || generateTransactionId();
    withdrawal.admin_notes = admin_notes || '';
    withdrawal.processed_at = new Date();
    withdrawal.account_details.verified = true;
    withdrawal.account_details.verification_status = 'verified';
    
    // Add to status history
    if (!withdrawal.status_history) {
      withdrawal.status_history = [];
    }
    
    withdrawal.status_history.push({
      status: 'approved',
      timestamp: new Date(),
      changed_by: adminId,
      notes: admin_notes || 'Approved by admin'
    });

    await withdrawal.save({ session });

    // Update transaction record
    await Transaction.findOneAndUpdate(
      { 'metadata.withdrawalId': withdrawal._id.toString() },
      {
        status: 'completed',
        description: `Withdrawal approved - ${withdrawal.payment_method.toUpperCase()}`,
        'metadata.status': 'completed',
        'metadata.processedBy': adminId,
        'metadata.processedAt': new Date()
      },
      { session }
    );

    // Create notification for user
    await createWithdrawalNotification({
      userId: withdrawal.user_id._id,
      withdrawal,
      type: 'approved',
      session
    });

    // Send SMS notification to user
    await sendWithdrawalSms({
      phone: withdrawal.account_details.phone,
      amount: withdrawal.net_amount,
      method: withdrawal.payment_method,
      transactionId: withdrawal.transaction_id
    });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Clear caches
    await clearWithdrawalCaches(withdrawal.user_id._id);

    // Log approval
    console.log(`✅ WITHDRAWAL APPROVED | ID: ${withdrawal.withdrawal_number} | Amount: ${formatCurrency(withdrawal.amount)} | Admin: ${adminName}`);

    // Send response
    return res.json({
      success: true,
      code: 'WITHDRAWAL_APPROVED',
      message: 'Withdrawal approved successfully',
      data: {
        withdrawal: formatWithdrawalResponse(withdrawal),
        user: {
          id: withdrawal.user_id._id,
          username: withdrawal.user_id.username,
          phone: withdrawal.user_id.phone
        },
        processing: {
          next_step: 'Payment processing',
          estimated_delivery: 'Within 24 hours',
          payment_reference: withdrawal.transaction_id
        },
        admin: {
          id: adminId,
          name: adminName,
          approved_at: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ APPROVE WITHDRAWAL ERROR:', error);
    return res.status(500).json({
      success: false,
      code: 'APPROVAL_FAILED',
      message: 'Failed to approve withdrawal',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 SMS VERIFICATION (Mock - integrate with real service)
const verifySmsCode = async (phone, code) => {
  // In production, integrate with SMS service like Twilio, Nexmo, etc.
  // This is a mock implementation
  return code === '123456'; // For development only
};

// 🔥 SMS NOTIFICATION
const sendWithdrawalSms = async ({ phone, amount, method, transactionId }) => {
  try {
    // In production, integrate with SMS service
    const message = `Your withdrawal of ৳${amount} via ${method} has been approved. Txn ID: ${transactionId}. - XOSS Gaming`;
    
    console.log(`📱 SMS SENT | To: ${phone} | Message: ${message}`);
    
    // Actual SMS sending code would go here
    // await smsService.send(phone, message);
    
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

// 🔥 GENERATE TRANSACTION ID
const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// 🔥 CLEAR CACHES
const clearWithdrawalCaches = async (userId) => {
  const patterns = [
    `withdrawals:user:${userId}:*`,
    `withdrawal_stats:${userId}`,
    'withdrawals:dashboard',
    'withdrawals:admin:*'
  ];

  for (const pattern of patterns) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
};

// 🔥 STATS FUNCTION
const getWithdrawalStats = async (userId) => {
  const stats = await Withdrawal.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_amount: { $sum: '$amount' }
      }
    }
  ]);

  const result = {
    total_withdrawals: 0,
    total_amount: 0,
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    by_method: {}
  };

  stats.forEach(stat => {
    const status = stat._id;
    if (result[status]) {
      result[status].count = stat.count;
      result[status].amount = stat.total_amount;
    }
    result.total_withdrawals += stat.count;
    result.total_amount += stat.total_amount;
  });

  // Get method breakdown
  const methodStats = await Withdrawal.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$payment_method',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  methodStats.forEach(stat => {
    result.by_method[stat._id] = {
      count: stat.count,
      amount: stat.amount,
      formatted_amount: formatCurrency(stat.amount)
    };
  });

  return result;
};

// Export all functions
module.exports = exports;
