// models/Tournament.js
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
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
  match_type: { type: String, enum: ['match', 'tournament'], default: 'tournament' },

  // Room Info
  room_id: { type: String, default: '' },
  room_password: { type: String, default: '' },

  // Timing
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
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
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Admin fields
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  rejection_reason: { type: String, default: '' },
  admin_notes: { type: String, default: '' },

  // ----------------------------------------------------
  // ✅ PRIZE DISTRIBUTION SYSTEM (Merged like Match.js)
  // ----------------------------------------------------
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
    paymentMethod: String,     // bkash, nagad, rocket etc.
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

// ----------------------------------------------------
// Virtual Fields for Frontend
// ----------------------------------------------------
tournamentSchema.virtual('prizePool').get(function() { return this.total_prize; });
tournamentSchema.virtual('entryFee').get(function() { return this.entry_fee; });
tournamentSchema.virtual('perKill').get(function() { return this.per_kill; });
tournamentSchema.virtual('maxPlayers').get(function() { return this.max_participants; });
tournamentSchema.virtual('currentPlayers').get(function() { return this.current_participants; });
tournamentSchema.virtual('roomId').get(function() { return this.room_id; });
tournamentSchema.virtual('password').get(function() { return this.room_password; });
tournamentSchema.virtual('scheduleTime').get(function() { return this.schedule_time; });
tournamentSchema.virtual('matchType').get(function() { return this.match_type; });
tournamentSchema.virtual('approvalStatus').get(function() { return this.approval_status; });

tournamentSchema.set('toJSON', { virtuals: true });
tournamentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
