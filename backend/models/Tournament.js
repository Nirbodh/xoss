// backend/models/Tournament.js - UPDATED VERSION
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled', 'pending'],
    default: 'upcoming'
  },
  // ✅ ADD THESE NEW FIELDS
  matchType: {
    type: String,
    enum: ['match', 'tournament'],
    default: 'match'
  },
  total_prize: {
    type: Number,
    default: 0
  },
  prizePool: { // ✅ ALIAS FIELD
    type: Number,
    default: 0
  },
  entry_fee: {
    type: Number,
    default: 0
  },
  entryFee: { // ✅ ALIAS FIELD
    type: Number,
    default: 0
  },
  start_time: {
    type: Date,
    required: true
  },
  scheduleTime: { // ✅ ALIAS FIELD
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  max_participants: {
    type: Number,
    required: true
  },
  maxPlayers: { // ✅ ALIAS FIELD
    type: Number,
    required: true
  },
  current_participants: {
    type: Number,
    default: 0
  },
  currentPlayers: { // ✅ ALIAS FIELD
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
  thumbnail: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // ✅ ADD TOURNAMENT-SPECIFIC FIELDS
  roomId: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  prizeDistributed: {
    type: Boolean,
    default: false
  },
  map: {
    type: String,
    default: ''
  },
  type: { // Solo, Duo, Squad
    type: String,
    default: 'Squad'
  },
  format: { // Single Elimination, etc.
    type: String,
    default: 'Single Elimination'
  }
}, {
  timestamps: true
});

// ✅ CREATE ALIASES FOR FRONTEND COMPATIBILITY
tournamentSchema.virtual('totalPrize').get(function() {
  return this.prizePool || this.total_prize;
});

tournamentSchema.virtual('maxParticipants').get(function() {
  return this.maxPlayers || this.max_participants;
});

tournamentSchema.virtual('currentParticipants').get(function() {
  return this.currentPlayers || this.current_participants;
});

module.exports = mongoose.model('Tournament', tournamentSchema);
