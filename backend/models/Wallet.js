// models/Wallet.js - ENHANCED VERSION
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
    enum: ['credit', 'debit', 'deposit', 'withdrawal', 'payment', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  method: {
    type: String
  },
  reference_id: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for better performance
transactionSchema.index({ user_id: 1, createdAt: -1 });
transactionSchema.index({ reference_id: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

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

// Index for better performance
walletSchema.index({ user_id: 1 });
walletSchema.index({ balance: -1 });

/* ============================
   WALLET METHODS
============================ */

// Add money to wallet
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

// Remove money from wallet
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

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  Transaction
};
