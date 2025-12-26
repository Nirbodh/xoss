// models/Wallet.js - ENHANCED VERSION WITH WITHDRAWAL SUPPORT
const mongoose = require('mongoose');

/* ============================
   TRANSACTION SCHEMA
============================ */
const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'deposit', 'withdrawal', 'refund', 'bonus', 'entry_fee', 'prize'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
    default: 'completed'
  },
  method: {
    type: String
  },
  reference_id: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ user_id: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

/* ============================
   WALLET SCHEMA
============================ */
const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  total_earned: {
    type: Number,
    default: 0
  },
  total_spent: {
    type: Number,
    default: 0
  },
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ user_id: 1 });
walletSchema.index({ balance: -1 });

/* ============================
   WITHDRAWAL SCHEMA
============================ */
const withdrawalSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100,
    max: 25000
  },
  payment_method: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank'],
    required: true
  },
  account_details: {
    phone: { type: String, required: true },
    account_name: String,
    bank_name: String,
    branch: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
    default: 'pending'
  },
  transaction_id: String,
  admin_notes: String,
  user_note: String,
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: Date,
  processed_at: Date
}, {
  timestamps: true
});

// Virtuals for population
withdrawalSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

withdrawalSchema.virtual('approver', {
  ref: 'User',
  localField: 'approved_by',
  foreignField: '_id',
  justOne: true
});

withdrawalSchema.set('toJSON', { virtuals: true });
withdrawalSchema.set('toObject', { virtuals: true });

// Indexes
withdrawalSchema.index({ user_id: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ payment_method: 1 });

/* ============================
   WALLET METHODS
============================ */

// Credit wallet
walletSchema.methods.credit = async function(amount, description = '', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  this.balance += amount;
  this.total_earned += amount;
  this.last_activity = new Date();
  
  await this.save();

  // Create transaction record
  const transaction = await Transaction.create({
    user_id: this.user_id,
    type: 'credit',
    amount,
    description,
    status: 'completed',
    method: metadata.method || 'system',
    reference_id: metadata.reference_id,
    metadata
  });

  console.log(`✅ Wallet credited: User ${this.user_id}, Amount: ${amount}, New Balance: ${this.balance}`);

  return { wallet: this, transaction };
};

// Debit wallet
walletSchema.methods.debit = async function(amount, description = '', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }

  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }

  this.balance -= amount;
  this.total_spent += amount;
  this.last_activity = new Date();
  
  await this.save();

  // Create transaction record
  const transaction = await Transaction.create({
    user_id: this.user_id,
    type: 'debit',
    amount,
    description,
    status: 'completed',
    method: metadata.method || 'system',
    reference_id: metadata.reference_id,
    metadata
  });

  console.log(`✅ Wallet debited: User ${this.user_id}, Amount: ${amount}, New Balance: ${this.balance}`);

  return { wallet: this, transaction };
};

// Check if user has sufficient balance
walletSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// Get transaction history
walletSchema.methods.getTransactionHistory = async function(limit = 50, page = 1) {
  const transactions = await Transaction.find({ user_id: this.user_id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await Transaction.countDocuments({ user_id: this.user_id });

  return {
    transactions,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  };
};

// Static method to find or create wallet
walletSchema.statics.findOrCreate = async function(userId) {
  let wallet = await this.findOne({ user_id: userId });
  
  if (!wallet) {
    wallet = new this({ user_id: userId });
    await wallet.save();
    console.log(`🆕 New wallet created for user: ${userId}`);
  }
  
  return wallet;
};

/* ============================
   WITHDRAWAL METHODS
============================ */

// Withdrawal approval method
withdrawalSchema.methods.approve = async function(adminId, transactionId, notes = '') {
  this.status = 'approved';
  this.approved_by = adminId;
  this.approved_at = new Date();
  this.transaction_id = transactionId;
  this.admin_notes = notes;
  this.processed_at = new Date();
  
  return await this.save();
};

// Withdrawal rejection method
withdrawalSchema.methods.reject = async function(adminId, notes = '') {
  this.status = 'rejected';
  this.approved_by = adminId;
  this.approved_at = new Date();
  this.admin_notes = notes;
  this.processed_at = new Date();
  
  return await this.save();
};

/* ============================
   CREATE MODELS
============================ */
const Transaction = mongoose.model('Transaction', transactionSchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = {
  Transaction,
  Wallet,
  Withdrawal
};
