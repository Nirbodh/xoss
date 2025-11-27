const mongoose = require('mongoose');

/* -------------------------------------
   TRANSACTION SCHEMA
------------------------------------- */
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
  reference_id: { type: String },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);


/* -------------------------------------
   WALLET SCHEMA
------------------------------------- */
const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: { type: Number, default: 0 },
  total_earned: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 }
}, { timestamps: true });

// CREDIT METHOD
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

// DEBIT METHOD
walletSchema.methods.debit = async function(amount, description, metadata = {}) {
  if (this.balance < amount) throw new Error('Insufficient balance');

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

const Wallet = mongoose.model('Wallet', walletSchema);


/* -------------------------------------
   WITHDRAWAL SCHEMA
------------------------------------- */
const withdrawalSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 100,
    max: 50000
  },
  payment_method: { 
    type: String, 
    enum: ['bkash', 'nagad', 'rocket', 'bank'], 
    required: true 
  },
  account_details: {
    phone: { type: String, required: true },
    account_name: String,
    bank_name: String,
    branch: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed'], 
    default: 'pending' 
  },
  transaction_id: String,
  admin_notes: String,
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: Date,
  processed_at: Date,
  user_note: String
}, { timestamps: true });


// **Virtual: User Info**
withdrawalSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// **Virtual: Admin Info**
withdrawalSchema.virtual('approved_by_user', {
  ref: 'User',
  localField: 'approved_by',
  foreignField: '_id',
  justOne: true
});

withdrawalSchema.set('toJSON', { virtuals: true });


// ---------------------------------------
//   APPROVE / REJECT METHODS
// ---------------------------------------
withdrawalSchema.methods.approve = async function(adminId, transactionId, notes = '') {
  this.status = 'approved';
  this.approved_by = adminId;
  this.approved_at = new Date();
  this.transaction_id = transactionId;
  this.admin_notes = notes;
  return await this.save();
};

withdrawalSchema.methods.reject = async function(adminId, notes = '') {
  this.status = 'rejected';
  this.approved_by = adminId;
  this.approved_at = new Date();
  this.admin_notes = notes;
  return await this.save();
};

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);


/* -------------------------------------
   EXPORT ALL MODELS
------------------------------------- */
module.exports = {
  Wallet,
  Transaction,
  Withdrawal
};
