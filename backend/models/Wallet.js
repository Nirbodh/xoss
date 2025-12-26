// models/Wallet.js - COMPLETE WALLET MODEL WITH ALL SCHEMAS
const mongoose = require('mongoose');

// ============================
// 🔹 TRANSACTION SCHEMA
// ============================
const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'deposit', 'withdrawal', 'refund', 'bonus', 'entry_fee', 'prize', 'transfer'],
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
  method: String,
  reference_id: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  related_to: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'related_model'
  },
  related_model: {
    type: String,
    enum: ['Match', 'Tournament', 'Withdrawal', 'Deposit']
  }
}, {
  timestamps: true
});

// Indexes for transactions
transactionSchema.index({ user_id: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference_id: 1 });

// ============================
// 🔹 WALLET SCHEMA
// ============================
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
  total_withdrawn: {
    type: Number,
    default: 0
  },
  last_activity: {
    type: Date,
    default: Date.now
  },
  settings: {
    auto_withdraw: {
      type: Boolean,
      default: false
    },
    min_auto_withdraw: {
      type: Number,
      default: 500
    },
    preferred_method: {
      type: String,
      enum: ['bkash', 'nagad', 'rocket'],
      default: 'bkash'
    }
  }
}, {
  timestamps: true
});

// Indexes for wallet
walletSchema.index({ user_id: 1 });
walletSchema.index({ balance: -1 });
walletSchema.index({ 'settings.auto_withdraw': 1 });

// ============================
// 🔹 WALLET METHODS
// ============================

// Find or create wallet
walletSchema.statics.findOrCreate = async function(userId) {
  let wallet = await this.findOne({ user_id: userId });
  
  if (!wallet) {
    wallet = new this({ user_id: userId });
    await wallet.save();
    console.log(`✅ New wallet created for user: ${userId}`);
  }
  
  return wallet;
};

// Credit wallet
walletSchema.methods.credit = async function(amount, description = '', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  this.balance += amount;
  this.total_earned += amount;
  this.last_activity = new Date();
  
  await this.save();

  // Create transaction
  const Transaction = mongoose.model('Transaction');
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

  console.log(`✅ Wallet credited: ${amount}, New Balance: ${this.balance}`);
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

  // Create transaction
  const Transaction = mongoose.model('Transaction');
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

  console.log(`✅ Wallet debited: ${amount}, New Balance: ${this.balance}`);
  return { wallet: this, transaction };
};

// Check sufficient balance
walletSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// Get transaction history
walletSchema.methods.getTransactionHistory = async function(limit = 50, page = 1, type = null) {
  const Transaction = mongoose.model('Transaction');
  const filter = { user_id: this.user_id };
  if (type) filter.type = type;
  
  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
  
  const total = await Transaction.countDocuments(filter);
  
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

// Auto withdraw check (for future)
walletSchema.methods.checkAutoWithdraw = async function() {
  if (this.settings.auto_withdraw && this.balance >= this.settings.min_auto_withdraw) {
    console.log(`⚡ Auto withdraw triggered for user ${this.user_id}`);
    
    // This will be implemented when auto withdrawal is enabled
    /*
    const Withdrawal = require('./withdrawal');
    const withdrawal = new Withdrawal({
      user_id: this.user_id,
      amount: this.settings.min_auto_withdraw,
      payment_method: this.settings.preferred_method,
      account_details: await this.getUserAccountDetails(),
      withdrawal_type: 'auto',
      status: 'processing'
    });
    
    await withdrawal.save();
    await this.debit(this.settings.min_auto_withdraw, 'Auto withdrawal');
    */
    
    return { triggered: true, amount: this.settings.min_auto_withdraw };
  }
  
  return { triggered: false };
};

// ============================
// 🔹 CREATE MODELS
// ============================
const Transaction = mongoose.model('Transaction', transactionSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = {
  Transaction,
  Wallet,
  // Withdrawal model will be imported separately
};
