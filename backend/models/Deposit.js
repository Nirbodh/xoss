// models/Deposit.js - FINAL FIXED VERSION
const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  method: {
    type: String,
    required: true,
    enum: ['bkash', 'nagad', 'rocket', 'paypal']
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  screenshot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    default: ''
  },
  approvedAt: Date,
  rejectedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better performance
depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ status: 1 });
depositSchema.index({ transactionId: 1 }, { unique: true });

// Virtual for formatted date
depositSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to approve deposit
depositSchema.methods.approve = function(adminId, note = '') {
  this.status = 'approved';
  this.adminNote = note;
  this.approvedAt = new Date();
  this.approvedBy = adminId;
  return this.save();
};

// Method to reject deposit
depositSchema.methods.reject = function(note = '') {
  this.status = 'rejected';
  this.adminNote = note;
  this.rejectedAt = new Date();
  return this.save();
};

// Static method to get pending deposits
depositSchema.statics.getPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

// Static method to get user deposits
depositSchema.statics.getUserDeposits = function(userId, limit = 20) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

module.exports = mongoose.model('Deposit', depositSchema);
