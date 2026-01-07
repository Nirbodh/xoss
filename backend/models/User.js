const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  // 🔥 UNIVERSAL UNIQUE ID (optional external ID)
  id: {
    type: String,
    unique: true,
    sparse: true
  },

  // 🔥 BASIC USER INFO
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    unique: true,
    index: true
  },

  name: {
    type: String,
    trim: true,
    default: ''
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  phone: {
    type: String,
    trim: true,
    default: '',
    index: true
  },

  avatar: {
    type: String,
    default: ''
  },

  // 🔥 AUTHENTICATION
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // 🔥 ROLE MANAGEMENT
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'agent'],
    default: 'user'
  },

  // 🔥 WALLET SYSTEM - SINGLE SOURCE OF TRUTH
  wallet_balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100, // Precision handling
    set: v => Math.round(v * 100) / 100
  },

  // OLD balance field - DEPRECATED (keep for migration)
  balance: {
    type: Number,
    default: 0,
    select: false // Hide from queries
  },

  // 🔥 GAMING / STATISTICS
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_earnings: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  
  matches_played: {
    type: Number,
    default: 0,
    min: 0
  },
  
  matches_won: {
    type: Number,
    default: 0,
    min: 0
  },
  
  win_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    get: v => Math.round(v * 100) / 100
  },
  
  favorite_game: {
    type: String,
    default: '',
    enum: ['', 'freefire', 'pubg', 'cod', 'ludo', 'coc', 'other']
  },
  
  rank: {
    type: String,
    default: 'Bronze',
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Champion']
  },

  // 🔥 SECURITY & VERIFICATION
  is_verified: {
    type: Boolean,
    default: false
  },
  
  is_active: {
    type: Boolean,
    default: true
  },
  
  verification_token: String,
  verification_expires: Date,
  
  reset_password_token: String,
  reset_password_expires: Date,

  // 🔥 SOCIAL & REFERRAL
  referral_code: {
    type: String,
    unique: true,
    sparse: true
  },
  
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  referral_count: {
    type: Number,
    default: 0
  },
  
  referral_earnings: {
    type: Number,
    default: 0
  },

  // 🔥 POINT SYSTEM
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_points_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  points_converted: {
    type: Number,
    default: 0,
    min: 0
  },
  
  last_points_activity: {
    type: Date,
    default: Date.now
  },

  // 🔥 SETTINGS & PREFERENCES
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      profile_public: { type: Boolean, default: true },
      show_balance: { type: Boolean, default: false }
    },
    gaming: {
      auto_join: { type: Boolean, default: false },
      sound_effects: { type: Boolean, default: true }
    }
  },

  // 🔥 ANALYTICS & METADATA
  last_login: {
    type: Date,
    default: Date.now
  },
  
  login_count: {
    type: Number,
    default: 0
  },
  
  device_info: [{
    device_id: String,
    platform: String,
    last_used: Date,
    ip_address: String
  }],
  
  metadata: {
    type: Object,
    default: {}
  }

}, { 
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

// 🔥 MIDDLEWARE: Calculate win rate before save
userSchema.pre('save', function(next) {
  if (this.matches_played > 0) {
    this.win_rate = (this.matches_won / this.matches_played) * 100;
  }
  
  // Auto-generate referral code if not exists
  if (!this.referral_code) {
    this.referral_code = this._id.toString().slice(-8).toUpperCase() + 
                        Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  
  next();
});

// 🔥 PASSWORD HASH MIDDLEWARE
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔥 COMPARE PASSWORD METHOD
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// 🔥 VIRTUAL FIELDS
userSchema.virtual('display_name').get(function() {
  return this.name || this.username;
});

userSchema.virtual('avatar_url').get(function() {
  if (this.avatar) {
    return this.avatar.startsWith('http') ? this.avatar : `/uploads/avatars/${this.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.display_name)}&background=random&color=fff&size=128`;
});

// 🔥 STATIC METHODS
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

userSchema.statics.findByReferralCode = function(code) {
  return this.findOne({ referral_code: code.toUpperCase() });
};

// 🔥 INSTANCE METHODS
userSchema.methods.addBalance = async function(amount, description = '') {
  if (amount <= 0) throw new Error('Amount must be positive');
  
  this.wallet_balance += amount;
  this.total_earnings += amount;
  
  // Log this transaction
  console.log(`[BALANCE] User ${this._id}: +${amount} (${description}). New balance: ${this.wallet_balance}`);
  
  return this.save();
};

userSchema.methods.deductBalance = async function(amount, description = '') {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (this.wallet_balance < amount) throw new Error('Insufficient balance');
  
  this.wallet_balance -= amount;
  
  // Log this transaction
  console.log(`[BALANCE] User ${this._id}: -${amount} (${description}). New balance: ${this.wallet_balance}`);
  
  return this.save();
};

userSchema.methods.getBalanceInfo = function() {
  return {
    wallet_balance: this.wallet_balance,
    total_earnings: this.total_earnings,
    points: this.points,
    rank: this.rank,
    level: this.level
  };
};

// 🔥 INDEXES
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ referral_code: 1 }, { sparse: true });
userSchema.index({ 'settings.privacy.show_balance': 1 });
userSchema.index({ rank: 1, level: -1 });
userSchema.index({ wallet_balance: -1 });
userSchema.index({ created_at: -1 });

// 🔥 AUTO-REMOVE OLD DEVICES
userSchema.pre('save', function(next) {
  if (this.device_info && this.device_info.length > 5) {
    this.device_info = this.device_info
      .sort((a, b) => new Date(b.last_used) - new Date(a.last_used))
      .slice(0, 5);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
