// models/Payment.js - COMPLETE PAYMENT MODEL
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction_id: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'BDT',
    enum: ['BDT', 'USD']
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['bkash', 'nagad', 'rocket', 'bank', 'card', 'crypto']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  gateway_response: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  payment_details: {
    phone_number: String,
    transaction_number: String,
    bank_name: String,
    account_number: String,
    routing_number: String,
    card_last_four: String,
    wallet_address: String
  },
  fees: {
    gateway_fee: { type: Number, default: 0 },
    processing_fee: { type: Number, default: 0 },
    total_fee: { type: Number, default: 0 },
    net_amount: { type: Number }
  },
  metadata: {
    ip_address: String,
    user_agent: String,
    device_info: String,
    referral_code: String
  },
  processed_at: Date,
  completed_at: Date,
  refunded_at: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for better performance
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ transaction_id: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ payment_method: 1 });
PaymentSchema.index({ 'payment_details.phone_number': 1 });
PaymentSchema.index({ createdAt: 1 });

// Calculate fees before saving
PaymentSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    // Calculate fees based on payment method
    let gatewayFee = 0;
    let processingFee = 0;
    
    switch(this.payment_method) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        gatewayFee = this.amount * 0.0185; // 1.85%
        processingFee = 5; // BDT 5 fixed
        break;
      case 'bank':
        gatewayFee = 15; // BDT 15 fixed
        break;
      case 'card':
        gatewayFee = this.amount * 0.025; // 2.5%
        processingFee = 10;
        break;
      case 'crypto':
        gatewayFee = this.amount * 0.01; // 1%
        break;
    }
    
    this.fees = {
      gateway_fee: gatewayFee,
      processing_fee: processingFee,
      total_fee: gatewayFee + processingFee,
      net_amount: this.amount - (gatewayFee + processingFee)
    };
  }
  next();
});

// Virtual for formatted amount
PaymentSchema.virtual('formatted_amount').get(function() {
  return `৳${this.amount.toFixed(2)}`;
});

// Virtual for formatted net amount
PaymentSchema.virtual('formatted_net_amount').get(function() {
  return `৳${this.fees.net_amount.toFixed(2)}`;
});

// Method to check if payment is successful
PaymentSchema.methods.isSuccessful = function() {
  return this.status === 'completed';
};

// Method to check if payment is pending
PaymentSchema.methods.isPending = function() {
  return this.status === 'pending';
};

// Method to mark payment as completed
PaymentSchema.methods.markAsCompleted = function(gatewayResponse = {}) {
  this.status = 'completed';
  this.gateway_response = gatewayResponse;
  this.completed_at = new Date();
  return this.save();
};

// Method to mark payment as failed
PaymentSchema.methods.markAsFailed = function(reason = '') {
  this.status = 'failed';
  this.notes = reason;
  return this.save();
};

// Static method to get user's payment summary
PaymentSchema.statics.getUserSummary = async function(userId) {
  const result = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        total_payments: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        total_fees: { $sum: '$fees.total_fee' },
        net_amount: { $sum: '$fees.net_amount' },
        first_payment: { $min: '$createdAt' },
        last_payment: { $max: '$createdAt' }
      }
    }
  ]);
  
  return result[0] || {
    total_payments: 0,
    total_amount: 0,
    total_fees: 0,
    net_amount: 0,
    first_payment: null,
    last_payment: null
  };
};

// Static method to get payment statistics
PaymentSchema.statics.getPaymentStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_payments: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        pending_payments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completed_payments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failed_payments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        by_method: {
          $push: {
            method: '$payment_method',
            amount: '$amount'
          }
        }
      }
    },
    {
      $project: {
        total_payments: 1,
        total_amount: 1,
        pending_payments: 1,
        completed_payments: 1,
        failed_payments: 1,
        success_rate: {
          $cond: [
            { $eq: ['$total_payments', 0] },
            0,
            { $divide: ['$completed_payments', '$total_payments'] }
          ]
        },
        average_amount: {
          $cond: [
            { $eq: ['$completed_payments', 0] },
            0,
            { $divide: ['$total_amount', '$completed_payments'] }
          ]
        }
      }
    }
  ]);
  
  return stats[0] || {
    total_payments: 0,
    total_amount: 0,
    pending_payments: 0,
    completed_payments: 0,
    failed_payments: 0,
    success_rate: 0,
    average_amount: 0
  };
};

// Check if model already exists to prevent overwrite error
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
