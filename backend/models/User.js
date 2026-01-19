const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // 🔥 CORE IDENTIFIERS
  id: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  // 🔥 AUTHENTICATION & PERSONAL INFO
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    lowercase: true,
    index: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    index: true
  },

  phone: {
    type: String,
    trim: true,
    match: [/^01[3-9]\d{8}$/, 'Please provide a valid Bangladeshi mobile number']
  },

  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/xoss/image/upload/v1/default_avatar.png',
    validate: {
      validator: function(v) {
        return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },

  // 🔥 AUTHENTICATION SECURITY
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },

  password_changed_at: {
    type: Date
  },

  password_reset_token: {
    type: String,
    select: false
  },

  password_reset_expires: {
    type: Date,
    select: false
  },

  email_verification_token: {
    type: String,
    select: false
  },

  email_verification_expires: {
    type: Date,
    select: false
  },

  // 🔥 ROLE & PERMISSIONS
  role: {
    type: String,
    enum: {
      values: ['user', 'premium_user', 'moderator', 'admin', 'super_admin'],
      message: 'Role is either: user, premium_user, moderator, admin, super_admin'
    },
    default: 'user'
  },

  permissions: {
    type: [String],
    default: ['basic_access'],
    enum: [
      'basic_access',
      'create_match',
      'join_match',
      'withdraw_funds',
      'deposit_funds',
      'create_tournament',
      'moderate_content',
      'manage_users',
      'view_reports',
      'system_settings'
    ]
  },

  // 🔥 WALLET & FINANCIAL SYSTEM
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative']
    },
    total_earned: {
      type: Number,
      default: 0
    },
    total_deposited: {
      type: Number,
      default: 0
    },
    total_withdrawn: {
      type: Number,
      default: 0
    },
    total_won: {
      type: Number,
      default: 0
    },
    total_lost: {
      type: Number,
      default: 0
    },
    last_transaction: {
      type: Date
    },
    transaction_count: {
      type: Number,
      default: 0
    }
  },

  // 🔥 GAMING STATISTICS & PERFORMANCE
  stats: {
    matches_played: {
      type: Number,
      default: 0
    },
    matches_won: {
      type: Number,
      default: 0
    },
    matches_lost: {
      type: Number,
      default: 0
    },
    tournaments_joined: {
      type: Number,
      default: 0
    },
    tournaments_won: {
      type: Number,
      default: 0
    },
    win_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    total_kills: {
      type: Number,
      default: 0
    },
    total_deaths: {
      type: Number,
      default: 0
    },
    kd_ratio: {
      type: Number,
      default: 0
    },
    rank_score: {
      type: Number,
      default: 1000
    },
    highest_rank: {
      type: String,
      default: 'Bronze V'
    }
  },

  // 🔥 GAMING PREFERENCES
  gaming: {
    favorite_game: {
      type: String,
      default: 'Free Fire'
    },
    favorite_mode: {
      type: String,
      default: 'Ranked'
    },
    preferred_device: {
      type: String,
      enum: ['mobile', 'pc', 'console'],
      default: 'mobile'
    },
    play_style: {
      type: String,
      enum: ['aggressive', 'defensive', 'balanced', 'support'],
      default: 'balanced'
    },
    squad_preference: {
      type: String,
      enum: ['solo', 'duo', 'squad', 'any'],
      default: 'squad'
    }
  },

  // 🔥 LEVEL & PROGRESSION SYSTEM
  level: {
    current: {
      type: Number,
      default: 1,
      min: 1,
      max: 100
    },
    experience: {
      type: Number,
      default: 0
    },
    next_level_xp: {
      type: Number,
      default: 1000
    },
    badges: {
      type: [String],
      default: []
    },
    achievements: {
      type: [String],
      default: []
    }
  },

  // 🔥 SOCIAL & NETWORKING
  social: {
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    friend_requests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }],
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clan'
    },
    social_links: {
      facebook: String,
      youtube: String,
      discord: String,
      twitch: String
    }
  },

  // 🔥 SECURITY & ACTIVITY TRACKING
  security: {
    two_factor_enabled: {
      type: Boolean,
      default: false
    },
    two_factor_secret: {
      type: String,
      select: false
    },
    login_attempts: {
      type: Number,
      default: 0,
      select: false
    },
    lock_until: {
      type: Date,
      select: false
    },
    last_login: {
      type: Date
    },
    last_login_ip: {
      type: String
    },
    login_history: [{
      timestamp: Date,
      ip_address: String,
      user_agent: String,
      location: String,
      successful: Boolean
    }],
    device_tokens: [{
      device_id: String,
      platform: String,
      token: String,
      last_used: Date
    }]
  },

  // 🔥 ACCOUNT STATUS & VERIFICATION
  account_status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned', 'deleted'],
    default: 'active'
  },

  verification: {
    email_verified: {
      type: Boolean,
      default: false
    },
    phone_verified: {
      type: Boolean,
      default: false
    },
    kyc_verified: {
      type: Boolean,
      default: false
    },
    kyc_level: {
      type: String,
      enum: ['none', 'basic', 'advanced', 'verified'],
      default: 'none'
    },
    kyc_documents: [{
      type: {
        type: String,
        enum: ['nid', 'passport', 'driving_license']
      },
      front_url: String,
      back_url: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      verified_at: Date,
      verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // 🔥 SETTINGS & PREFERENCES
  settings: {
    notifications: {
      email: {
        promotions: { type: Boolean, default: true },
        matches: { type: Boolean, default: true },
        results: { type: Boolean, default: true },
        withdrawals: { type: Boolean, default: true },
        security: { type: Boolean, default: true }
      },
      push: {
        matches: { type: Boolean, default: true },
        results: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false }
      },
      sms: {
        withdrawals: { type: Boolean, default: true },
        security: { type: Boolean, default: true }
      }
    },
    privacy: {
      profile_visibility: {
        type: String,
        enum: ['public', 'friends_only', 'private'],
        default: 'public'
      },
      stats_visibility: {
        type: String,
        enum: ['public', 'friends_only', 'private'],
        default: 'public'
      },
      online_status: {
        type: String,
        enum: ['visible', 'invisible', 'friends_only'],
        default: 'visible'
      }
    },
    gaming_preferences: {
      auto_join: { type: Boolean, default: false },
      sound_effects: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'dark'
      }
    }
  },

  // 🔥 REFERRAL SYSTEM
  referral: {
    code: {
      type: String,
      unique: true,
      uppercase: true
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referred_users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    total_referrals: {
      type: Number,
      default: 0
    },
    referral_earnings: {
      type: Number,
      default: 0
    },
    bonus_received: {
      type: Boolean,
      default: false
    }
  },

  // 🔥 ANALYTICS & METADATA
  metadata: {
    registration_source: {
      type: String,
      enum: ['web', 'android', 'ios', 'admin'],
      default: 'web'
    },
    registration_ip: {
      type: String
    },
    first_deposit_date: Date,
    first_withdrawal_date: Date,
    last_active: {
      type: Date,
      default: Date.now
    },
    session_count: {
      type: Number,
      default: 0
    },
    total_play_time: {
      type: Number, // in minutes
      default: 0
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔥 VIRTUAL PROPERTIES
userSchema.virtual('win_percentage').get(function() {
  if (this.stats.matches_played === 0) return 0;
  return ((this.stats.matches_won / this.stats.matches_played) * 100).toFixed(2);
});

userSchema.virtual('matches_drawn').get(function() {
  return this.stats.matches_played - (this.stats.matches_won + this.stats.matches_lost);
});

userSchema.virtual('full_name').get(function() {
  return this.name || this.username;
});

userSchema.virtual('profile_completion').get(function() {
  let completion = 0;
  const fields = ['username', 'email', 'phone', 'name', 'avatar'];
  
  fields.forEach(field => {
    if (this[field]) completion += 20;
  });
  
  return completion;
});

// 🔥 INDEXES FOR PERFORMANCE
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'wallet.balance': -1 });
userSchema.index({ 'stats.rank_score': -1 });
userSchema.index({ 'level.current': -1 });
userSchema.index({ 'referral.code': 1 });
userSchema.index({ 'account_status': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'metadata.last_active': -1 });

// 🔥 MIDDLEWARE
userSchema.pre('save', async function(next) {
  // Generate referral code if not exists
  if (!this.referral?.code) {
    this.referral = this.referral || {};
    this.referral.code = generateReferralCode(this.username);
  }

  // Calculate win rate
  if (this.stats.matches_played > 0) {
    this.stats.win_rate = (this.stats.matches_won / this.stats.matches_played) * 100;
  }

  // Calculate KD ratio
  if (this.stats.total_deaths > 0) {
    this.stats.kd_ratio = (this.stats.total_kills / this.stats.total_deaths).toFixed(2);
  }

  // Update rank based on score
  this.stats.highest_rank = calculateRank(this.stats.rank_score);

  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.password_changed_at = Date.now() - 1000;
  }

  next();
});

userSchema.pre(/^find/, function(next) {
  this.select('-__v -password -password_reset_token -password_reset_expires -email_verification_token -email_verification_expires');
  next();
});

// 🔥 INSTANCE METHODS
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.password_reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.email_verification_token = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.email_verification_expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      role: this.role,
      email: this.email,
      username: this.username 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

userSchema.methods.updateLastActive = function() {
  this.metadata.last_active = Date.now();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.addLoginHistory = function(ip, userAgent, location, successful) {
  this.security.login_history.unshift({
    timestamp: new Date(),
    ip_address: ip,
    user_agent: userAgent,
    location: location,
    successful: successful
  });
  
  // Keep only last 50 login attempts
  if (this.security.login_history.length > 50) {
    this.security.login_history = this.security.login_history.slice(0, 50);
  }
  
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.incrementPlayTime = function(minutes) {
  this.metadata.total_play_time += minutes;
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.updateWallet = async function(amount, type) {
  const update = {};
  
  switch(type) {
    case 'deposit':
      update['wallet.balance'] = this.wallet.balance + amount;
      update['wallet.total_deposited'] = this.wallet.total_deposited + amount;
      break;
      
    case 'withdrawal':
      update['wallet.balance'] = this.wallet.balance - amount;
      update['wallet.total_withdrawn'] = this.wallet.total_withdrawn + amount;
      break;
      
    case 'win':
      update['wallet.balance'] = this.wallet.balance + amount;
      update['wallet.total_earned'] = this.wallet.total_earned + amount;
      update['wallet.total_won'] = this.wallet.total_won + amount;
      break;
      
    case 'loss':
      update['wallet.total_lost'] = this.wallet.total_lost + amount;
      break;
  }
  
  update['wallet.last_transaction'] = new Date();
  update['wallet.transaction_count'] = this.wallet.transaction_count + 1;
  
  Object.assign(this.wallet, update);
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.updateStats = async function(matchResult, kills, deaths) {
  this.stats.matches_played += 1;
  
  if (matchResult === 'win') {
    this.stats.matches_won += 1;
  } else if (matchResult === 'loss') {
    this.stats.matches_lost += 1;
  }
  
  this.stats.total_kills += kills || 0;
  this.stats.total_deaths += deaths || 0;
  
  // Update rank score (ELO-like system)
  const rankChange = calculateRankChange(matchResult, this.stats.rank_score);
  this.stats.rank_score += rankChange;
  
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.addExperience = async function(xp) {
  this.level.experience += xp;
  
  // Level up if enough XP
  while (this.level.experience >= this.level.next_level_xp) {
    this.level.current += 1;
    this.level.experience -= this.level.next_level_xp;
    this.level.next_level_xp = calculateNextLevelXP(this.level.current);
  }
  
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.isAccountLocked = function() {
  return this.security.lock_until && this.security.lock_until > Date.now();
};

userSchema.methods.lockAccount = function(minutes = 15) {
  this.security.lock_until = Date.now() + minutes * 60 * 1000;
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.unlockAccount = function() {
  this.security.login_attempts = 0;
  this.security.lock_until = undefined;
  return this.save({ validateBeforeSave: false });
};

// 🔥 STATIC METHODS
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

userSchema.statics.getLeaderboard = async function(limit = 100, sortBy = 'rank_score') {
  return this.find({ 'account_status': 'active' })
    .sort({ [`stats.${sortBy}`]: -1 })
    .limit(limit)
    .select('username avatar stats.win_rate stats.rank_score level.current wallet.balance');
};

userSchema.statics.getTopEarners = async function(limit = 50) {
  return this.find({ 'account_status': 'active' })
    .sort({ 'wallet.total_earned': -1 })
    .limit(limit)
    .select('username avatar wallet.total_earned wallet.balance stats.matches_won');
};

userSchema.statics.getActiveUsers = async function(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    'account_status': 'active',
    'metadata.last_active': { $gte: cutoff }
  }).countDocuments();
};

// 🔥 HELPER FUNCTIONS
function generateReferralCode(username) {
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  const initials = username.slice(0, 3).toUpperCase();
  return `XOSS${initials}${random}`;
}

function calculateRank(score) {
  if (score >= 2500) return 'Grandmaster';
  if (score >= 2200) return 'Master';
  if (score >= 1900) return 'Diamond';
  if (score >= 1600) return 'Platinum';
  if (score >= 1300) return 'Gold';
  if (score >= 1000) return 'Silver';
  return 'Bronze';
}

function calculateRankChange(result, currentScore) {
  const baseChange = 25;
  const kFactor = 32; // ELO K-factor
  
  let expectedScore;
  if (result === 'win') {
    expectedScore = 1;
  } else if (result === 'loss') {
    expectedScore = 0;
  } else {
    expectedScore = 0.5; // draw
  }
  
  return kFactor * (expectedScore - (1 / (1 + Math.pow(10, (1500 - currentScore) / 400))));
}

function calculateNextLevelXP(currentLevel) {
  return Math.floor(1000 * Math.pow(1.5, currentLevel - 1));
}

// 🔥 COMPOUND INDEXES
userSchema.index({
  'stats.rank_score': -1,
  'level.current': -1,
  'wallet.balance': -1
});

userSchema.index({
  'account_status': 1,
  'metadata.last_active': -1
});

userSchema.index({
  'referral.referred_by': 1,
  createdAt: -1
});

module.exports = mongoose.model('User', userSchema);
