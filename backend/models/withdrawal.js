// models/withdrawal.js - COMPLETE WITHDRAWAL MODEL (MANUAL + AUTO)
const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  // 🔹 BASIC INFORMATION
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100,      // Minimum withdrawal amount
    max: 25000     // Maximum withdrawal amount
  },
  payment_method: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank'],
    required: true
  },
  
  // 🔹 ACCOUNT DETAILS
  account_details: {
    phone: {
      type: String,
      required: true,
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
    account_number: String
  },
  
  // 🔹 STATUS & PROCESSING
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // 🔹 WITHDRAWAL TYPE (Manual by default, Auto for future)
  withdrawal_type: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  
  // 🔹 MANUAL PROCESSING FIELDS
  transaction_id: String,       // Admin provided transaction ID
  admin_notes: String,          // Admin notes/reason
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: Date,
  
  // 🔹 AUTO PROCESSING FIELDS (FOR FUTURE - COMMENTED)
  /*
  auto_processed: {
    type: Boolean,
    default: false
  },
  api_reference_id: String,     // Gateway transaction ID
  api_response: Object,         // Full gateway response
  retry_count: {
    type: Number,
    default: 0
  },
  next_retry_at: Date,
  */
  
  // 🔹 USER NOTES
  user_note: String,
  
  // 🔹 TIMESTAMPS
  processed_at: Date,
  completed_at: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 VIRTUAL FIELDS FOR POPULATION
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

// 🔹 INDEXES FOR PERFORMANCE
withdrawalSchema.index({ user_id: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ payment_method: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ 'account_details.phone': 1 });

// 🔹 PRE-SAVE HOOK
withdrawalSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'approved' || this.status === 'completed') {
      this.processed_at = new Date();
    }
    if (this.status === 'completed') {
      this.completed_at = new Date();
    }
  }
  next();
});

// 🔹 INSTANCE METHODS
withdrawalSchema.methods.approve = async function(adminId, transactionId = '', notes = '') {
  this.status = 'approved';
  this.approved_by = adminId;
  this.approved_at = new Date();
  this.transaction_id = transactionId || `MANUAL_${Date.now()}`;
  this.admin_notes = notes;
  this.processed_at = new Date();
  
  return await this.save();
};

withdrawalSchema.methods.reject = async function(adminId, notes = '') {
  this.status = 'rejected';
  this.approved_by = adminId;
  this.approved_at = new Date();
  this.admin_notes = notes;
  this.processed_at = new Date();
  
  return await this.save();
};

// 🔹 STATIC METHODS
withdrawalSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };
  
  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      amount: stat.totalAmount
    };
    result.total.count += stat.count;
    result.total.amount += stat.totalAmount;
  });
  
  return result;
};

// 🔹 AUTO WITHDRAWAL METHODS (FOR FUTURE - COMMENTED)
/*
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
*/

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;
