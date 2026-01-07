const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  // 🔥 BASIC USER INFO
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    unique: true
  },

  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },

  phone: {
    type: String,
    trim: true
  },

  avatar: {
    type: String,
    default: ''
  },

  // 🔥 AUTHENTICATION
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // 🔥 ROLE MANAGEMENT
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // 🔥 WALLET SYSTEM - শুধু একটি balance ফিল্ড রাখছি
  wallet_balance: {
    type: Number,
    default: 0,
    min: 0
  },

  // 🔥 GAMING / STATISTICS
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  total_earnings: {
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
    default: ''
  },
  rank: {
    type: String,
    default: 'Bronze'
  },

  // 🔥 ACCOUNT STATUS
  is_verified: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },

  // 🔥 POINT SYSTEM
  points: {
    type: Number,
    default: 0
  },
  total_points_earned: {
    type: Number,
    default: 0
  },
  points_converted: {
    type: Number,
    default: 0
  },
  last_points_activity: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

// 🔥 PASSWORD HASH
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🔥 PASSWORD COMPARE
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🔥 HIDE PASSWORD IN RESPONSE
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// 🔥 VIRTUAL: Wallet balance sync (optional)
userSchema.virtual('balance').get(function() {
  return this.wallet_balance;
});

userSchema.virtual('balance').set(function(value) {
  this.wallet_balance = value;
});

module.exports = mongoose.model('User', userSchema);
