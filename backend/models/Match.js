// models/Match.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // Basic Info
  title: { type: String, required: true, trim: true },
  game: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  rules: { type: String, default: '' },

  // Financial
  entry_fee: { type: Number, default: 0 },
  total_prize: { type: Number, default: 0 },
  per_kill: { type: Number, default: 0 },

  // Participants
  max_participants: { type: Number, required: true },
  current_participants: { type: Number, default: 0 },

  // Game Settings
  type: { type: String, default: 'Solo' },
  map: { type: String, default: 'Bermuda' },
  match_type: { type: String, enum: ['match', 'tournament'], default: 'match' },

  // Room Info
  room_id: { type: String, default: '' },
  room_password: { type: String, default: '' },

  // Timing
  start_time: { type: Date, required: true },
  end_time: { type: Date },
  schedule_time: { type: Date, required: true },

  // Status & Approval
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'upcoming', 'live', 'completed', 'cancelled'],
    default: 'pending' 
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Admin fields
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  rejection_reason: { type: String, default: '' },
  admin_notes: { type: String, default: '' },

  // ---------------------------------------
  // ✅ RESULT SYSTEM (NEW - ADD THIS)
  // ---------------------------------------
  results: [{
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    teamName: { type: String, default: '' },
    kills: { type: Number, default: 0 },
    damage: { type: Number, default: 0 },
    rank: { type: Number, required: true },
    screenshot: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    adminNotes: { type: String, default: '' }
  }],

  calculatedWinners: [{
    rank: Number,
    playerId: String,
    playerName: String,
    teamName: String,
    kills: Number,
    damage: Number,
    totalScore: Number,
    prizeAmount: Number
  }],

  resultStatus: { 
    type: String, 
    enum: ['pending', 'calculated', 'distributed'], 
    default: 'pending' 
  },

  // ---------------------------------------
  // ✅ PRIZE DISTRIBUTION SYSTEM (Existing)
  // ---------------------------------------
  winners: [{
    rank: Number,
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    playerName: String,
    teamName: String,
    kills: Number,
    damage: Number,
    prizeAmount: Number,
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed'], 
      default: 'pending' 
    },
    paymentMethod: String,
    transactionId: String,
    paidAt: Date,
    phoneNumber: String
  }],

  prizeStatus: { 
    type: String, 
    enum: ['pending', 'distributed', 'failed', 'refunded'], 
    default: 'pending' 
  },

  distributionDate: Date,
  refundDate: Date,
  distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

// Virtual Fields (Frontend)
matchSchema.virtual('prizePool').get(function() { return this.total_prize; });
matchSchema.virtual('entryFee').get(function() { return this.entry_fee; });
matchSchema.virtual('perKill').get(function() { return this.per_kill; });
matchSchema.virtual('maxPlayers').get(function() { return this.max_participants; });
matchSchema.virtual('currentPlayers').get(function() { return this.current_participants; });
matchSchema.virtual('roomId').get(function() { return this.room_id; });
matchSchema.virtual('password').get(function() { return this.room_password; });
matchSchema.virtual('scheduleTime').get(function() { return this.schedule_time; });
matchSchema.virtual('matchType').get(function() { return this.match_type; });
matchSchema.virtual('approvalStatus').get(function() { return this.approval_status; });

matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Match', matchSchema);
