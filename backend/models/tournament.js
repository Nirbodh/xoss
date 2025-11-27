const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  game: {
    type: String,
    required: [true, 'Game is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'upcoming', 'live', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  matchType: {
    type: String,
    enum: ['match', 'tournament'],
    default: 'match'
  },
  total_prize: {
    type: Number,
    default: 0
  },
  entry_fee: {
    type: Number,
    default: 0
  },
  start_time: {
    type: Date,
    required: [true, 'Start time is required']
  },
  scheduleTime: {
    type: Date,
    required: [true, 'Schedule time is required']
  },
  end_time: {
    type: Date,
    required: [true, 'End time is required']
  },
  max_participants: {
    type: Number,
    required: [true, 'Max participants is required']
  },
  current_participants: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  rules: {
    type: String,
    default: ''
  },
  roomId: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  map: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'Solo'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Admin fields
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
  adminNotes: { type: String, default: '' }
}, {
  timestamps: true
});

// Virtuals for frontend compatibility
tournamentSchema.virtual('prizePool').get(function() {
  return this.total_prize;
});

tournamentSchema.virtual('entryFee').get(function() {
  return this.entry_fee;
});

tournamentSchema.virtual('maxPlayers').get(function() {
  return this.max_participants;
});

tournamentSchema.virtual('currentPlayers').get(function() {
  return this.current_participants;
});

tournamentSchema.set('toJSON', { virtuals: true });
tournamentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
