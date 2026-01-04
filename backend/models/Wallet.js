// models/Wallet.js - DATABASE SAFE FIX
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'deposit', 'withdrawal', 'payment', 'refund', 'bonus', 'match_entry', 'tournament_entry'],
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

const Transaction = mongoose.model('Transaction', transactionSchema);

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

// ✅ FIXED: findOrCreate method - DATABASE SAFE
walletSchema.statics.findOrCreate = async function(userId) {
  try {
    console.log('🔄 Wallet findOrCreate called with userId:', userId);
    
    let wallet = await this.findOne({ user_id: userId });
    
    if (!wallet) {
      console.log('🆕 Creating new wallet for user:', userId);
      wallet = new this({ 
        user_id: userId,
        balance: 0,
        total_earned: 0,
        total_spent: 0,
        last_activity: new Date()
      });
      await wallet.save();
      console.log(`✅ New wallet created for user: ${userId}`);
    } else {
      console.log(`✅ Found existing wallet for user: ${userId}, Balance: ${wallet.balance}`);
      
      // ✅ Ensure all required fields exist (for old documents)
      if (!wallet.total_earned) wallet.total_earned = 0;
      if (!wallet.total_spent) wallet.total_spent = 0;
      if (!wallet.last_activity) wallet.last_activity = new Date();
    }
    
    return wallet;
  } catch (error) {
    console.error('❌ Wallet findOrCreate error:', error);
    throw new Error(`Failed to find or create wallet: ${error.message}`);
  }
};

// ✅ FIXED: Add money to wallet
walletSchema.methods.credit = async function(amount, description = '', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  this.balance += amount;
  this.total_earned += amount;
  this.last_activity = new Date();
  
  await this.save();

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

// ✅ FIXED: Remove money from wallet
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

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  Transaction
};
