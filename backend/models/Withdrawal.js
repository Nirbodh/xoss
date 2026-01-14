// models/Wallet.js - PROFESSIONAL VERSION WITH ADVANCED FEATURES
const mongoose = require('mongoose');

// 🔥 TRANSACTION SCHEMA (Enhanced)
const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  type: {
    type: String,
    enum: [
      'deposit', 'deposit_request', 'deposit_approved', 'deposit_rejected',
      'withdrawal', 'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected', 'withdrawal_refund',
      'credit', 'debit', 
      'match_entry', 'match_refund', 'match_win', 'match_bonus',
      'tournament_entry', 'tournament_refund', 'tournament_win', 'tournament_bonus',
      'referral_bonus', 'signup_bonus', 'daily_bonus', 'promo_bonus',
      'transfer_in', 'transfer_out',
      'admin_credit', 'admin_debit',
      'chargeback', 'refund', 'adjustment'
    ],
    required: [true, 'Transaction type is required']
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed', 'on_hold'],
    default: 'pending',
    index: true
  },
  
  payment_method: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank', 'card', 'wallet', 'cash', 'system', 'manual', 'other'],
    default: 'system'
  },
  
  gateway_response: {
    type: Object,
    default: {}
  },
  
  reference_id: {
    type: String,
    index: true
  },
  
  transaction_id: {
    type: String,
    unique: true,
    sparse: true
  },
  
  metadata: {
    type: Object,
    default: {}
  },
  
  // 🔥 AUDIT FIELDS
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  processed_at: Date,
  
  notes: {
    type: String,
    default: '',
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // 🔥 SECURITY FIELDS
  ip_address: String,
  user_agent: String,
  device_id: String

}, {
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

// 🔥 WALLET SCHEMA (Enhanced)
const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  
  // 🔥 BALANCE FIELDS
  balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100,
    required: true
  },
  
  available_balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  pending_balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  locked_balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  // 🔥 STATISTICS
  total_earned: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  total_spent: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  total_deposited: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  total_withdrawn: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  total_bonus: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  // 🔥 LIMITS & SETTINGS
  limits: {
    daily_deposit_limit: { type: Number, default: 50000 },
    daily_withdrawal_limit: { type: Number, default: 50000 },
    max_deposit: { type: Number, default: 100000 },
    max_withdrawal: { type: Number, default: 50000 },
    min_deposit: { type: Number, default: 10 },
    min_withdrawal: { type: Number, default: 100 }
  },
  
  settings: {
    auto_withdraw: { type: Boolean, default: false },
    low_balance_alert: { type: Boolean, default: true },
    notify_on_deposit: { type: Boolean, default: true },
    notify_on_withdrawal: { type: Boolean, default: true },
    notify_on_large_transaction: { type: Boolean, default: true }
  },
  
  // 🔥 SECURITY
  security: {
    pin_code: { type: String, select: false },
    two_factor_enabled: { type: Boolean, default: false },
    last_password_change: Date,
    suspicious_activity_count: { type: Number, default: 0 },
    locked_until: Date
  },
  
  // 🔥 ACTIVITY TRACKING
  last_activity: {
    type: Date,
    default: Date.now
  },
  
  last_deposit: Date,
  last_withdrawal: Date,
  
  daily_stats: {
    deposits_today: { type: Number, default: 0 },
    withdrawals_today: { type: Number, default: 0 },
    deposit_amount_today: { type: Number, default: 0 },
    withdrawal_amount_today: { type: Number, default: 0 },
    last_reset: { type: Date, default: Date.now }
  },
  
  // 🔥 REFERRAL SYSTEM
  referral_earnings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 🔥 VERSIONING
  version: {
    type: Number,
    default: 1
  },
  
  // 🔥 METADATA
  metadata: {
    type: Object,
    default: {}
  }

}, {
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

// 🔥 MIDDLEWARE: Sync with User model
walletSchema.pre('save', async function(next) {
  try {
    // Sync available balance
    this.available_balance = this.balance - this.locked_balance;
    
    // Reset daily stats if new day
    const now = new Date();
    const lastReset = this.daily_stats.last_reset || new Date();
    
    if (now.toDateString() !== lastReset.toDateString()) {
      this.daily_stats = {
        deposits_today: 0,
        withdrawals_today: 0,
        deposit_amount_today: 0,
        withdrawal_amount_today: 0,
        last_reset: now
      };
    }
    
    // Update User's wallet_balance
    if (this.isModified('balance')) {
      const User = require('./User');
      await User.findByIdAndUpdate(
        this.user_id,
        { 
          wallet_balance: this.balance,
          total_earnings: this.total_earned
        },
        { timestamps: false }
      );
      
      console.log(`[WALLET SYNC] User ${this.user_id}: Balance synced to ${this.balance}`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// 🔥 STATIC METHODS

// Find or create wallet with atomic operation
walletSchema.statics.findOrCreate = async function(userId, options = {}) {
  const session = options.session;
  const defaults = {
    balance: 0,
    total_earned: 0,
    total_spent: 0,
    available_balance: 0,
    pending_balance: 0,
    locked_balance: 0
  };
  
  try {
    let wallet = await this.findOne({ user_id: userId }).session(session || null);
    
    if (!wallet) {
      // Get user info
      const User = require('./User');
      const user = await User.findById(userId).session(session || null);
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      wallet = new this({
        user_id: userId,
        balance: user.wallet_balance || defaults.balance,
        total_earned: user.total_earnings || defaults.total_earned,
        total_spent: 0,
        available_balance: user.wallet_balance || defaults.available_balance,
        daily_stats: {
          last_reset: new Date()
        }
      });
      
      await wallet.save({ session });
      
      console.log(`[WALLET] Created new wallet for user ${userId}`);
    }
    
    return wallet;
  } catch (error) {
    console.error('[WALLET ERROR] findOrCreate failed:', error);
    throw error;
  }
};

// Get wallet summary
walletSchema.statics.getSummary = async function(userId) {
  const wallet = await this.findOne({ user_id: userId });
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Get recent transactions
  const Transaction = mongoose.model('Transaction');
  const recentTransactions = await Transaction.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  
  // Calculate daily limits remaining
  const today = new Date();
  const lastReset = wallet.daily_stats.last_reset;
  const isSameDay = today.toDateString() === lastReset.toDateString();
  
  const dailyDepositRemaining = isSameDay 
    ? Math.max(0, wallet.limits.daily_deposit_limit - wallet.daily_stats.deposit_amount_today)
    : wallet.limits.daily_deposit_limit;
  
  const dailyWithdrawalRemaining = isSameDay
    ? Math.max(0, wallet.limits.daily_withdrawal_limit - wallet.daily_stats.withdrawal_amount_today)
    : wallet.limits.daily_withdrawal_limit;
  
  return {
    wallet: {
      balance: wallet.balance,
      available_balance: wallet.available_balance,
      locked_balance: wallet.locked_balance,
      pending_balance: wallet.pending_balance
    },
    stats: {
      total_earned: wallet.total_earned,
      total_spent: wallet.total_spent,
      total_deposited: wallet.total_deposited,
      total_withdrawn: wallet.total_withdrawn,
      total_bonus: wallet.total_bonus
    },
    limits: {
      daily_deposit_remaining: dailyDepositRemaining,
      daily_withdrawal_remaining: dailyWithdrawalRemaining,
      max_deposit: wallet.limits.max_deposit,
      max_withdrawal: wallet.limits.max_withdrawal,
      min_deposit: wallet.limits.min_deposit,
      min_withdrawal: wallet.limits.min_withdrawal
    },
    recent_transactions: recentTransactions,
    last_activity: wallet.last_activity
  };
};

// 🔥 INSTANCE METHODS

// Credit wallet (add money)
walletSchema.methods.credit = async function(amount, options = {}) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  
  const session = options.session;
  const metadata = options.metadata || {};
  const type = options.type || 'credit';
  const description = options.description || 'Wallet credit';
  
  // Update wallet
  this.balance += amount;
  this.total_earned += amount;
  this.available_balance += amount;
  this.last_activity = new Date();
  
  // Update daily stats if deposit
  if (type.includes('deposit')) {
    this.total_deposited += amount;
    this.daily_stats.deposits_today += 1;
    this.daily_stats.deposit_amount_today += amount;
    this.last_deposit = new Date();
  }
  
  // Update bonus total if bonus
  if (type.includes('bonus')) {
    this.total_bonus += amount;
  }
  
  await this.save({ session });
  
  // Create transaction
  const transaction = await Transaction.create([{
    user_id: this.user_id,
    type: type,
    amount: amount,
    description: description,
    status: 'completed',
    payment_method: metadata.method || 'system',
    reference_id: metadata.reference_id,
    transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    metadata: metadata,
    ip_address: metadata.ip_address,
    user_agent: metadata.user_agent
  }], { session });
  
  console.log(`[WALLET CREDIT] User ${this.user_id}: +${amount} (${type}). New balance: ${this.balance}`);
  
  return {
    wallet: this,
    transaction: transaction[0]
  };
};

// Debit wallet (remove money)
walletSchema.methods.debit = async function(amount, options = {}) {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }
  
  if (this.available_balance < amount) {
    throw new Error('Insufficient available balance');
  }
  
  const session = options.session;
  const metadata = options.metadata || {};
  const type = options.type || 'debit';
  const description = options.description || 'Wallet debit';
  
  // Update wallet
  this.balance -= amount;
  this.total_spent += amount;
  this.available_balance -= amount;
  this.last_activity = new Date();
  
  // Update daily stats if withdrawal
  if (type.includes('withdrawal')) {
    this.total_withdrawn += amount;
    this.daily_stats.withdrawals_today += 1;
    this.daily_stats.withdrawal_amount_today += amount;
    this.last_withdrawal = new Date();
  }
  
  await this.save({ session });
  
  // Create transaction
  const transaction = await Transaction.create([{
    user_id: this.user_id,
    type: type,
    amount: amount,
    description: description,
    status: 'completed',
    payment_method: metadata.method || 'system',
    reference_id: metadata.reference_id,
    transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    metadata: metadata,
    ip_address: metadata.ip_address,
    user_agent: metadata.user_agent
  }], { session });
  
  console.log(`[WALLET DEBIT] User ${this.user_id}: -${amount} (${type}). New balance: ${this.balance}`);
  
  return {
    wallet: this,
    transaction: transaction[0]
  };
};

// 🔥 NEW: WITHDRAW METHOD (For withdrawal requests)
walletSchema.methods.withdraw = async function(amount, options = {}) {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }
  
  if (this.available_balance < amount) {
    throw new Error('Insufficient available balance for withdrawal');
  }
  
  const session = options.session;
  const metadata = options.metadata || {};
  const description = options.description || 'Withdrawal request';
  
  // Update wallet
  this.balance -= amount;
  this.total_spent += amount;
  this.total_withdrawn += amount;
  this.available_balance -= amount;
  this.last_activity = new Date();
  this.last_withdrawal = new Date();
  
  // Update daily stats
  this.daily_stats.withdrawals_today += 1;
  this.daily_stats.withdrawal_amount_today += amount;
  
  await this.save({ session });
  
  // Create transaction record
  const transaction = await Transaction.create([{
    user_id: this.user_id,
    type: 'withdrawal_request',
    amount: amount,
    description: description,
    status: 'pending',
    payment_method: metadata.payment_method || 'system',
    reference_id: metadata.reference_id,
    transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    metadata: {
      ...metadata,
      withdrawal_number: metadata.withdrawal_number,
      previous_balance: metadata.previous_balance,
      new_balance: this.balance
    },
    ip_address: metadata.ip_address,
    user_agent: metadata.user_agent
  }], { session });
  
  console.log(`[WALLET WITHDRAW] User ${this.user_id}: -${amount} (withdrawal). New balance: ${this.balance}`);
  
  return {
    wallet: this,
    transaction: transaction[0]
  };
};

// 🔥 NEW: REFUND WITHDRAWAL METHOD (For withdrawal cancellation/rejection)
walletSchema.methods.refundWithdrawal = async function(amount, options = {}) {
  if (amount <= 0) {
    throw new Error('Refund amount must be positive');
  }
  
  const session = options.session;
  const metadata = options.metadata || {};
  const description = options.description || 'Withdrawal refund';
  
  // Update wallet
  this.balance += amount;
  this.total_spent -= amount;
  this.total_withdrawn -= amount;
  this.available_balance += amount;
  this.last_activity = new Date();
  
  // Update daily stats
  this.daily_stats.withdrawals_today = Math.max(0, this.daily_stats.withdrawals_today - 1);
  this.daily_stats.withdrawal_amount_today = Math.max(0, this.daily_stats.withdrawal_amount_today - amount);
  
  await this.save({ session });
  
  // Create transaction record for refund
  const transaction = await Transaction.create([{
    user_id: this.user_id,
    type: 'withdrawal_refund',
    amount: amount,
    description: description,
    status: 'completed',
    payment_method: metadata.payment_method || 'system',
    reference_id: metadata.reference_id,
    transaction_id: `REFUND${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    metadata: {
      ...metadata,
      refund_reason: metadata.reason,
      refunded_by: metadata.refunded_by,
      previous_balance: metadata.previous_balance,
      new_balance: this.balance
    },
    ip_address: metadata.ip_address,
    user_agent: metadata.user_agent
  }], { session });
  
  console.log(`[WALLET REFUND] User ${this.user_id}: +${amount} (withdrawal refund). New balance: ${this.balance}`);
  
  return {
    wallet: this,
    transaction: transaction[0]
  };
};

// Lock balance (for pending transactions)
walletSchema.methods.lockBalance = async function(amount, reason = '') {
  if (amount <= 0) {
    throw new Error('Lock amount must be positive');
  }
  
  if (this.available_balance < amount) {
    throw new Error('Insufficient available balance to lock');
  }
  
  this.locked_balance += amount;
  this.available_balance -= amount;
  this.last_activity = new Date();
  
  await this.save();
  
  console.log(`[BALANCE LOCKED] User ${this.user_id}: Locked ${amount} for "${reason}". Locked: ${this.locked_balance}, Available: ${this.available_balance}`);
  
  return this;
};

// Unlock balance
walletSchema.methods.unlockBalance = async function(amount, reason = '') {
  if (amount <= 0) {
    throw new Error('Unlock amount must be positive');
  }
  
  if (this.locked_balance < amount) {
    throw new Error('Cannot unlock more than locked balance');
  }
  
  this.locked_balance -= amount;
  this.available_balance += amount;
  this.last_activity = new Date();
  
  await this.save();
  
  console.log(`[BALANCE UNLOCKED] User ${this.user_id}: Unlocked ${amount} for "${reason}". Locked: ${this.locked_balance}, Available: ${this.available_balance}`);
  
  return this;
};

// Get transaction history with pagination
walletSchema.methods.getTransactionHistory = async function(options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    status = null,
    startDate = null,
    endDate = null,
    sortBy = '-createdAt'
  } = options;
  
  const query = { user_id: this.user_id };
  
  if (type) query.type = type;
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query)
  ]);
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Get balance history (for charts)
walletSchema.methods.getBalanceHistory = async function(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const transactions = await Transaction.aggregate([
    {
      $match: {
        user_id: this.user_id,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        credits: {
          $sum: {
            $cond: [
              { $in: ['$type', ['credit', 'deposit', 'win', 'bonus', 'refund']] },
              '$amount',
              0
            ]
          }
        },
        debits: {
          $sum: {
            $cond: [
              { $in: ['$type', ['debit', 'withdrawal', 'entry_fee', 'payment']] },
              '$amount',
              0
            ]
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        credits: 1,
        debits: 1,
        net_change: { $subtract: ['$credits', '$debits'] },
        transaction_count: '$count'
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  return transactions;
};

// Check if operation is within limits
walletSchema.methods.checkLimits = function(operation, amount) {
  const now = new Date();
  const lastReset = this.daily_stats.last_reset;
  const isSameDay = now.toDateString() === lastReset.toDateString();
  
  switch (operation) {
    case 'deposit':
      if (amount < this.limits.min_deposit) {
        return { allowed: false, reason: `Minimum deposit is ${this.limits.min_deposit}` };
      }
      if (amount > this.limits.max_deposit) {
        return { allowed: false, reason: `Maximum deposit is ${this.limits.max_deposit}` };
      }
      if (isSameDay && this.daily_stats.deposit_amount_today + amount > this.limits.daily_deposit_limit) {
        return { allowed: false, reason: 'Daily deposit limit exceeded' };
      }
      break;
      
    case 'withdrawal':
      if (amount < this.limits.min_withdrawal) {
        return { allowed: false, reason: `Minimum withdrawal is ${this.limits.min_withdrawal}` };
      }
      if (amount > this.limits.max_withdrawal) {
        return { allowed: false, reason: `Maximum withdrawal is ${this.limits.max_withdrawal}` };
      }
      if (isSameDay && this.daily_stats.withdrawal_amount_today + amount > this.limits.daily_withdrawal_limit) {
        return { allowed: false, reason: 'Daily withdrawal limit exceeded' };
      }
      break;
  }
  
  return { allowed: true };
};

// 🔥 VIRTUAL FIELDS
walletSchema.virtual('total_transactions').get(function() {
  return this.total_earned + this.total_spent;
});

walletSchema.virtual('profit_loss').get(function() {
  return this.total_earned - this.total_spent;
});

// 🔥 INDEXES
walletSchema.index({ user_id: 1 }, { unique: true });
walletSchema.index({ balance: -1 });
walletSchema.index({ 'daily_stats.last_reset': 1 });
walletSchema.index({ last_activity: -1 });
walletSchema.index({ 'security.locked_until': 1 });

// Create models
const Wallet = mongoose.model('Wallet', walletSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  Wallet,
  Transaction
};
