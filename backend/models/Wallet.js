const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
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
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
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
    default: 0
  },
  total_earned: {
    type: Number,
    default: 0
  },
  total_spent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

walletSchema.methods.credit = async function(amount, description, metadata = {}) {
  this.balance += amount;
  this.total_earned += amount;
  await this.save();

  await Transaction.create({
    user_id: this.user_id,
    type: 'credit',
    amount,
    description,
    metadata
  });

  return this;
};

walletSchema.methods.debit = async function(amount, description, metadata = {}) {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }

  this.balance -= amount;
  this.total_spent += amount;
  await this.save();

  await Transaction.create({
    user_id: this.user_id,
    type: 'debit',
    amount,
    description,
    metadata
  });

  return this;
};

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  Transaction
};
