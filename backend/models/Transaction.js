// models/Transaction.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'deposit', 
      'withdrawal', 
      'match_entry', 
      'tournament_entry',
      'winning', 
      'bonus', 
      'refund', 
      'referral',
      'admin_adjustment',
      'transfer',
      'fee',
      'prize'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String
  },
  reference: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  adminNotes: {
    type: String
  },
  transactionId: {
    type: String,
    unique: true
  },
  paymentMethod: {
    type: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: 1 });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ status: 1, type: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `৳${this.amount.toFixed(2)}`;
});

// Method to check if transaction is successful
transactionSchema.methods.isSuccessful = function() {
  return this.status === 'completed';
};

// Method to get transaction summary
transactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    amount: this.amount,
    status: this.status,
    description: this.description,
    date: this.createdAt,
    formattedAmount: this.formattedAmount
  };
};

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = async function(userId) {
  const result = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result.reduce((acc, curr) => {
    acc[curr._id] = {
      totalAmount: curr.totalAmount,
      count: curr.count
    };
    return acc;
  }, {});
};

// ✅ FIX: Check if model already exists to prevent OverwriteModelError
let Transaction;
try {
  Transaction = mongoose.model('Transaction');
} catch (error) {
  Transaction = mongoose.model('Transaction', transactionSchema);
}

module.exports = Transaction;
