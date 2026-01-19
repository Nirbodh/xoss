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
      'admin_adjustment'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
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
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    depositId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deposit' },
    withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' },
    paymentMethod: String,
    transactionId: String
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
