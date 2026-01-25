const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  wallet_balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
    index: true
  },
  
  level: {
    type: Number,
    default: 1,
    min: [1, 'Level must be at least 1'],
    max: [100, 'Maximum level is 100'],
    index: true
  },
  
  experience: {
    type: Number,
    default: 0
  },
  
  total_earnings: {
    type: Number,
    default: 0
  },
  
  balance: {
    type: Number,
    default: 0
  },
  
  matches_played: {
    type: Number,
    default: 0
  },
  
  matches_won: {
    type: Number,
    default: 0
  },
  
  favorite_game: {
    type: String,
    default: 'Free Fire'
  },
  
  is_verified: {
    type: Boolean,
    default: false
  },
  
  is_active: {
    type: Boolean,
    default: true
  },
  
  id: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

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
        if (!v) return true;
        return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },

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

  progression: {
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
      type: Number,
      default: 0
    }
  }

}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.password_reset_token;
      delete ret.password_reset_expires;
      delete ret.email_verification_token;
      delete ret.email_verification_expires;
      delete ret.security?.two_factor_secret;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.virtual('win_percentage').get(function() {
  const played = this.stats.matches_played || this.matches_played || 0;
  const won = this.stats.matches_won || this.matches_won || 0;
  if (played === 0) return 0;
  return ((won / played) * 100).toFixed(2);
});

userSchema.virtual('current_balance').get(function() {
  if (this.wallet?.balance !== undefined) return this.wallet.balance;
  if (this.wallet_balance !== undefined) return this.wallet_balance;
  if (this.balance !== undefined) return this.balance;
  return 0;
});

userSchema.virtual('current_level').get(function() {
  if (this.progression?.current !== undefined) return this.progression.current;
  if (this.level !== undefined) return this.level;
  return 1;
});

userSchema.virtual('current_experience').get(function() {
  if (this.progression?.experience !== undefined) return this.progression.experience;
  if (this.experience !== undefined) return this.experience;
  return 0;
});

userSchema.virtual('total_matches_played').get(function() {
  if (this.stats?.matches_played !== undefined) return this.stats.matches_played;
  if (this.matches_played !== undefined) return this.matches_played;
  return 0;
});

userSchema.virtual('total_matches_won').get(function() {
  if (this.stats?.matches_won !== undefined) return this.stats.matches_won;
  if (this.matches_won !== undefined) return this.matches_won;
  return 0;
});

userSchema.virtual('full_name').get(function() {
  return this.name || this.username || 'Anonymous';
});

userSchema.virtual('profile_completion').get(function() {
  let completion = 0;
  const fields = ['username', 'email', 'phone', 'name', 'avatar'];
  
  fields.forEach(field => {
    if (this[field]) completion += 20;
  });
  
  return completion;
});

userSchema.virtual('is_authenticated').get(function() {
  return this.account_status === 'active' && this.is_active !== false;
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'wallet.balance': -1 });
userSchema.index({ wallet_balance: -1 });
userSchema.index({ balance: -1 });
userSchema.index({ 'stats.rank_score': -1 });
userSchema.index({ level: -1 });
userSchema.index({ 'progression.current': -1 });
userSchema.index({ 'referral.code': 1 });
userSchema.index({ account_status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'metadata.last_active': -1 });

userSchema.pre('save', async function(next) {
  try {
    this.syncSchemaData();
    
    if (!this.referral?.code) {
      this.referral = this.referral || {};
      this.referral.code = this.generateReferralCode();
    }

    this.calculateWinRate();
    
    this.calculateKDRatio();
    
    if (this.stats?.rank_score) {
      this.stats.highest_rank = this.calculateRank(this.stats.rank_score);
    }

    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 12);
      this.password_changed_at = Date.now() - 1000;
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre(/^find/, function(next) {
  this.select('-__v -password -password_reset_token -password_reset_expires -email_verification_token -email_verification_expires -security.two_factor_secret');
  next();
});

userSchema.methods.syncSchemaData = function() {
  if (this.wallet?.balance !== undefined) {
    this.wallet_balance = this.wallet.balance;
   // this.balance = this.wallet.balance;
  } 
   // else if (this.wallet_balance !== undefined) {
   // this.wallet = this.wallet || {};
   // this.wallet.balance = this.wallet_balance;
// }
  
  if (this.progression?.current !== undefined) {
    this.level = this.progression.current;
  } else if (this.level !== undefined) {
    this.progression = this.progression || {};
    this.progression.current = this.level;
  }
  
  if (this.progression?.experience !== undefined) {
    this.experience = this.progression.experience;
  } else if (this.experience !== undefined) {
    this.progression = this.progression || {};
    this.progression.experience = this.experience;
  }
  
  if (this.stats?.matches_played !== undefined) {
    this.matches_played = this.stats.matches_played;
  } else if (this.matches_played !== undefined) {
    this.stats = this.stats || {};
    this.stats.matches_played = this.matches_played;
  }
  
  if (this.stats?.matches_won !== undefined) {
    this.matches_won = this.stats.matches_won;
  } else if (this.matches_won !== undefined) {
    this.stats = this.stats || {};
    this.stats.matches_won = this.matches_won;
  }
  
  if (this.total_earnings !== undefined && this.wallet) {
    this.wallet.total_earned = this.total_earnings;
  }
};

userSchema.methods.calculateWinRate = function() {
  const played = this.stats?.matches_played || this.matches_played || 0;
  const won = this.stats?.matches_won || this.matches_won || 0;
  
  if (played > 0) {
    const winRate = (won / played) * 100;
    if (this.stats) {
      this.stats.win_rate = parseFloat(winRate.toFixed(2));
    }
  }
};

userSchema.methods.calculateKDRatio = function() {
  if (this.stats?.total_deaths > 0) {
    this.stats.kd_ratio = parseFloat(
      (this.stats.total_kills / this.stats.total_deaths).toFixed(2)
    );
  }
};

userSchema.methods.generateReferralCode = function() {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const initials = (this.username || 'XOSS').slice(0, 3).toUpperCase();
  return `XOSS${initials}${random}`;
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('Password not available');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.password_reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.password_reset_expires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.email_verification_token = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.email_verification_expires = Date.now() + 24 * 60 * 60 * 1000;
  
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
    process.env.JWT_SECRET || 'xoss-gaming-secret-key-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET || 'xoss-gaming-refresh-secret-2024',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

userSchema.methods.updateLastActive = function() {
  this.metadata.last_active = Date.now();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.addLoginHistory = function(ip, userAgent, location, successful) {
  this.security = this.security || {};
  this.security.login_history = this.security.login_history || [];
  
  this.security.login_history.unshift({
    timestamp: new Date(),
    ip_address: ip,
    user_agent: userAgent,
    location: location,
    successful: successful
  });
  
  if (this.security.login_history.length > 50) {
    this.security.login_history = this.security.login_history.slice(0, 50);
  }
  
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.getFormattedUser = function() {
  return {
    _id: this._id,
    id: this.id,
    username: this.username,
    email: this.email,
    phone: this.phone,
    name: this.name,
    avatar: this.avatar,
    role: this.role,
    
    wallet_balance: this.current_balance,
    wallet: {
      balance: this.current_balance,
      total_earned: this.wallet?.total_earned || this.total_earnings || 0,
      total_deposited: this.wallet?.total_deposited || 0,
      total_withdrawn: this.wallet?.total_withdrawn || 0,
      total_won: this.wallet?.total_won || 0,
      total_lost: this.wallet?.total_lost || 0,
      last_transaction: this.wallet?.last_transaction,
      transaction_count: this.wallet?.transaction_count || 0
    },
    
    level: this.current_level,
    experience: this.current_experience,
    progression: this.progression || {
      current: this.current_level,
      experience: this.current_experience,
      next_level_xp: 1000,
      badges: [],
      achievements: []
    },
    
    matches_played: this.total_matches_played,
    matches_won: this.total_matches_won,
    stats: {
      ...this.stats,
      matches_played: this.total_matches_played,
      matches_won: this.total_matches_won,
      matches_lost: this.stats?.matches_lost || 0,
      win_rate: this.stats?.win_rate || 0,
      rank_score: this.stats?.rank_score || 1000,
      highest_rank: this.stats?.highest_rank || 'Bronze V'
    },
    
    favorite_game: this.gaming?.favorite_game || this.favorite_game || 'Free Fire',
    gaming: this.gaming || {
      favorite_game: this.favorite_game || 'Free Fire',
      favorite_mode: 'Ranked',
      preferred_device: 'mobile',
      play_style: 'balanced',
      squad_preference: 'squad'
    },
    
    social: this.social || {},
    
    is_verified: this.is_verified || this.verification?.email_verified || false,
    is_active: this.is_active !== false,
    account_status: this.account_status || 'active',
    
    settings: this.settings || {},
    
    verification: this.verification || {
      email_verified: this.is_verified || false,
      phone_verified: false,
      kyc_verified: false,
      kyc_level: 'none'
    },
    
    win_percentage: this.win_percentage,
    profile_completion: this.profile_completion,
    is_authenticated: this.is_authenticated,
    full_name: this.full_name,
    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    last_active: this.metadata?.last_active,
    
    referral: this.referral || {
      code: this.generateReferralCode(),
      total_referrals: 0,
      referral_earnings: 0
    },
    
    metadata: this.metadata || {}
  };
};

userSchema.methods.updateWallet = async function(amount, type) {
  this.wallet = this.wallet || {};
  
  const update = {};
  
  switch(type) {
    case 'deposit':
      update['wallet.balance'] = (this.wallet.balance || this.current_balance) + amount;
      update['wallet.total_deposited'] = (this.wallet.total_deposited || 0) + amount;
      break;
      
    case 'withdrawal':
      update['wallet.balance'] = (this.wallet.balance || this.current_balance) - amount;
      update['wallet.total_withdrawn'] = (this.wallet.total_withdrawn || 0) + amount;
      break;
      
    case 'win':
      update['wallet.balance'] = (this.wallet.balance || this.current_balance) + amount;
      update['wallet.total_earned'] = (this.wallet.total_earned || 0) + amount;
      update['wallet.total_won'] = (this.wallet.total_won || 0) + amount;
      break;
      
    case 'loss':
      update['wallet.total_lost'] = (this.wallet.total_lost || 0) + amount;
      break;
  }
  
  update['wallet.last_transaction'] = new Date();
  update['wallet.transaction_count'] = (this.wallet.transaction_count || 0) + 1;
  
  Object.assign(this.wallet, update);
  
  this.wallet_balance = this.wallet.balance;
  this.balance = this.wallet.balance;
  
  if (type === 'win') {
    this.total_earnings = (this.total_earnings || 0) + amount;
  }
  
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.isAccountLocked = function() {
  return this.security?.lock_until && this.security.lock_until > Date.now();
};

userSchema.methods.lockAccount = function(minutes = 15) {
  this.security = this.security || {};
  this.security.lock_until = Date.now() + minutes * 60 * 1000;
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.unlockAccount = function() {
  this.security = this.security || {};
  this.security.login_attempts = 0;
  this.security.lock_until = undefined;
  return this.save({ validateBeforeSave: false });
};

userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

userSchema.statics.getFormattedUserById = async function(userId) {
  const user = await this.findById(userId);
  if (!user) return null;
  return user.getFormattedUser();
};

userSchema.statics.getLeaderboard = async function(limit = 100, sortBy = 'rank_score') {
  return this.find({ 'account_status': 'active' })
    .sort({ [`stats.${sortBy}`]: -1 })
    .limit(limit)
    .select('username avatar stats.win_rate stats.rank_score level wallet_balance progression.current wallet.balance')
    .lean();
};

userSchema.methods.calculateRank = function(score) {
  if (score >= 2500) return 'Grandmaster';
  if (score >= 2200) return 'Master';
  if (score >= 1900) return 'Diamond';
  if (score >= 1600) return 'Platinum';
  if (score >= 1300) return 'Gold';
  if (score >= 1000) return 'Silver';
  return 'Bronze';
};

userSchema.index({
  'stats.rank_score': -1,
  level: -1,
  wallet_balance: -1
});

userSchema.index({
  'progression.current': -1,
  'wallet.balance': -1
});

userSchema.index({
  account_status: 1,
  'metadata.last_active': -1
});

module.exports = mongoose.model('User', userSchema);
