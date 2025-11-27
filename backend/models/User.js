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
    trim: true,
    minlength: 3,
    maxlength: 30
  },

  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true
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
    minlength: 6
  },

  // 🔥 ROLE MANAGEMENT
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // 🔥 WALLET SYSTEM
  wallet_balance: {
    type: Number,
    default: 0
  },

  balance: {       // OLD SYSTEM → kept for backwards compatibility
    type: Number,
    default: 0
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


// 🔥 PASSWORD HASH (only if password exists)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🔥 PASSWORD COMPARE
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🔥 HIDE PASSWORD IN RESPONSE
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
