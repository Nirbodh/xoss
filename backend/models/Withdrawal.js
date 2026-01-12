// models/Withdrawal.js - HYBRID FINAL VERSION
const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  // 🔹 BASIC INFORMATION
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  withdrawal_number: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: [100, 'Minimum withdrawal amount is ৳100'],
    max: [50000, 'Maximum withdrawal amount is ৳50,000']
  },
  
  payment_method: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank'],
    required: true,
    index: true
  },
  
  // 🔹 WITHDRAWAL TYPE (Manual by default, Auto for future)
  withdrawal_type: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  
  // 🔹 ACCOUNT DETAILS
  account_details: {
    phone: {
      type: String,
      required: function() {
        return ['bkash', 'nagad', 'rocket'].includes(this.payment_method);
      },
      validate: {
        validator: function(v) {
          return /^01[3-9]\d{8}$/.test(v);
        },
        message: props => `${props.value} is not a valid Bangladeshi mobile number!`
      }
    },
    account_name: String,
    bank_name: String,
    branch: String,
    account_number: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  
  // 🔹 STATUS & PROCESSING
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'rejected', 'cancelled', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  
  // 🔹 MANUAL PROCESSING FIELDS
  transaction_id: String,
  admin_notes: String,
  reject_reason: String,
  cancellation_reason: String,
  
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 🔹 AUTO PROCESSING FIELDS (FOR FUTURE - OPTIONAL)
  auto_processed: {
    type: Boolean,
    default: false
  },
  api_reference_id: String,     // Gateway transaction ID
  api_response: {
    type: Object,
    default: null
  },
  retry_count: {
    type: Number,
    default: 0
  },
  next_retry_at: Date,
  
  // 🔹 USER NOTES
  user_note: String,
  
  // 🔹 METADATA FOR FLEXIBILITY
  metadata: {
    type: Object,
    default: {}
  },
  
  // 🔹 TIMESTAMPS
  requested_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  processed_at: Date,
  approved_at: Date,
  rejected_at: Date,
  cancelled_at: Date,
  completed_at: Date

}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 🔹 VIRTUAL FIELDS
withdrawalSchema.virtual('formatted_amount').get(function() {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(this.amount);
});

withdrawalSchema.virtual('formatted_requested_at').get(function() {
  return this.requested_at ? this.requested_at.toLocaleDateString('bn-BD') : '';
});

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

withdrawalSchema.virtual('canceller', {
  ref: 'User',
  localField: 'cancelled_by',
  foreignField: '_id',
  justOne: true
});

// 🔹 INDEXES FOR PERFORMANCE
withdrawalSchema.index({ user_id: 1, status: 1 });
withdrawalSchema.index({ user_id: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, requested_at: -1 });
withdrawalSchema.index({ payment_method: 1, requested_at: -1 });
withdrawalSchema.index({ withdrawal_number: 1 }, { unique: true });
withdrawalSchema.index({ 'account_details.phone': 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ withdrawal_type: 1, status: 1 });

// 🔹 PRE-SAVE HOOK
withdrawalSchema.pre('save', function(next) {
  // Generate withdrawal number for new withdrawals
  if (this.isNew && !this.withdrawal_number) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.withdrawal_number = `WD${timestamp}${random}`;
  }
  
  // Update timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'approved':
        this.approved_at = now;
        this.processed_at = now;
        break;
      case 'rejected':
        this.rejected_at = now;
        this.processed_at = now;
        break;
      case 'cancelled':
        this.cancelled_at = now;
        this.processed_at = now;
        break;
      case 'completed':
        this.completed_at = now;
        this.processed_at = this.processed_at || now;
        break;
      case 'processing':
        this.processed_at = now;
        break;
    }
  }
  
  // Auto-processed flag for auto withdrawals
  if (this.withdrawal_type === 'auto' && this.status === 'completed') {
    this.auto_processed = true;
  }
  
  next();
});

// 🔹 INSTANCE METHODS
withdrawalSchema.methods.approve = async function(adminId, transactionId = '', notes = '') {
  this.status = 'approved';
  this.approved_by = adminId;
  this.transaction_id = transactionId || `MANUAL_${Date.now()}`;
  this.admin_notes = notes;
  
  return await this.save();
};

withdrawalSchema.methods.reject = async function(adminId, reason = '', notes = '') {
  this.status = 'rejected';
  this.approved_by = adminId;
  this.reject_reason = reason;
  this.admin_notes = notes;
  
  return await this.save();
};

withdrawalSchema.methods.cancel = async function(userId, reason = '') {
  this.status = 'cancelled';
  this.cancelled_by = userId;
  this.cancellation_reason = reason;
  
  return await this.save();
};

withdrawalSchema.methods.processAuto = async function() {
  if (this.withdrawal_type !== 'auto') {
    throw new Error('Not an auto withdrawal');
  }
  
  try {
    // Call payment gateway API
    const paymentResult = await this.callPaymentGateway();
    
    if (paymentResult.success) {
      this.status = 'completed';
      this.auto_processed = true;
      this.api_reference_id = paymentResult.transactionId;
      this.api_response = paymentResult;
      this.processed_at = new Date();
      this.completed_at = new Date();
      
      return await this.save();
    } else {
      throw new Error(paymentResult.message || 'Payment failed');
    }
  } catch (error) {
    this.status = 'failed';
    this.admin_notes = `Auto processing failed: ${error.message}`;
    this.retry_count += 1;
    this.next_retry_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes later
    
    await this.save();
    throw error;
  }
};

withdrawalSchema.methods.callPaymentGateway = async function() {
  // This will be implemented when you have payment gateway
  // For now, return a mock response
  
  return {
    success: true,
    transactionId: `GATEWAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: 'Payment processed successfully',
    timestamp: new Date()
  };
};

// 🔹 STATIC METHODS
withdrawalSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_amount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };
  
  stats.forEach(stat => {
    if (result[stat._id]) {
      result[stat._id].count = stat.count;
      result[stat._id].amount = stat.total_amount;
    }
    result.total.count += stat.count;
    result.total.amount += stat.total_amount;
  });
  
  return result;
};

withdrawalSchema.statics.getDailyStats = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const result = await this.aggregate([
    {
      $match: {
        user_id: mongoose.Types.ObjectId(userId),
        requested_at: {
          $gte: today,
          $lt: tomorrow
        }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
        successful: {
          $sum: {
            $cond: [{ $in: ['$status', ['completed', 'approved']] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $in: ['$status', ['rejected', 'failed', 'cancelled']] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return result[0] || { count: 0, amount: 0, successful: 0, failed: 0 };
};

withdrawalSchema.statics.findByWithdrawalNumber = async function(withdrawalNumber) {
  return await this.findOne({ withdrawal_number: withdrawalNumber })
    .populate('user', 'name email phone')
    .populate('approver', 'name email')
    .populate('canceller', 'name email');
};

withdrawalSchema.statics.getPendingWithdrawals = async function() {
  return await this.find({ status: 'pending' })
    .populate('user', 'name email phone')
    .sort({ requested_at: 1 })
    .limit(100);
};

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;
