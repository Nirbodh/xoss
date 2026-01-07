// models/Wallet.js - UPDATED WITH USER SYNC
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'deposit', 'withdrawal', 'withdrawal_request', 'withdrawal_refund', 'payment', 'refund', 'bonus', 'match_entry', 'tournament_entry'],
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

// ✅ FIXED: findOrCreate method WITH USER SYNC
walletSchema.statics.findOrCreate = async function(userId) {
  try {
    console.log('🔄 Wallet findOrCreate called with userId:', userId);
    
    let wallet = await this.findOne({ user_id: userId });
    
    if (!wallet) {
      console.log('🆕 Creating new wallet for user:', userId);
      
      // Get User model
      const User = require('./User');
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      wallet = new this({ 
        user_id: userId,
        balance: user.wallet_balance || 0,
        total_earned: user.total_earnings || 0,
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

// ✅ HELPER: Sync wallet balance with user
walletSchema.methods.syncWithUser = async function() {
  try {
    const User = require('./User');
    await User.findByIdAndUpdate(this.user_id, {
      wallet_balance: this.balance,
      total_earnings: this.total_earned
    });
    console.log(`✅ Wallet synced with user: ${this.user_id}, Balance: ${this.balance}`);
  } catch (error) {
    console.error('❌ Error syncing wallet with user:', error);
    throw error;
  }
};

// ✅ FIXED: Add money to wallet WITH USER SYNC
walletSchema.methods.credit = async function(amount, description = '', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  const session = metadata.session;
  const updateData = {
    $inc: {
      balance: amount,
      total_earned: amount
    },
    last_activity: new Date()
  };

  if (session) {
    this.balance += amount;
    this.total_earned += amount;
    this.last_activity = new Date();
    await this.save({ session });
  } else {
    await this.updateOne(updateData);
    this.balance += amount;
    this.total_earned += amount;
  }

  // Sync with User
  const User = require('./User');
  await User.findByIdAndUpdate(this.user_id, {
    $inc: {
      wallet_balance: amount,
      total_earnings: amount
    }
  });

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

// ✅ FIXED: Remove money from wallet WITH USER SYNC
walletSchema.methods.debit = async function(amount, description = '', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }

  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const session = metadata.session;
  const updateData = {
    $inc: {
      balance: -amount,
      total_spent: amount
    },
    last_activity: new Date()
  };

  if (session) {
    this.balance -= amount;
    this.total_spent += amount;
    this.last_activity = new Date();
    await this.save({ session });
  } else {
    await this.updateOne(updateData);
    this.balance -= amount;
    this.total_spent += amount;
  }

  // Sync with User
  const User = require('./User');
  await User.findByIdAndUpdate(this.user_id, {
    $inc: {
      wallet_balance: -amount
    }
  });

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

// ✅ Get transaction history
walletSchema.methods.getTransactionHistory = async function(limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  
  const transactions = await Transaction.find({ user_id: this.user_id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Transaction.countDocuments({ user_id: this.user_id });
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  Transaction
};
