// backend/models/Tournament.js - FIXED VERSION
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  // Basic Info
  title: String,
  game: String,
  matchType: {
    type: String,
    default: 'match' // ✅ FIXED: Default to match
  },
  
  // Game Details
  type: String,
  format: String,
  mode: String,
  map: String,
  
  // Prize & Entry
  entryFee: {
    type: Number,
    default: 0
  },
  prizePool: {
    type: Number,
    default: 0
  },
  totalPrize: {
    type: Number,
    default: 0
  },
  perKill: {
    type: Number,
    default: 0
  },
  
  // Participants
  maxPlayers: {
    type: Number,
    default: 50
  },
  maxParticipants: {
    type: Number,
    default: 50
  },
  maxTeams: {
    type: Number,
    default: 16
  },
  currentPlayers: {
    type: Number,
    default: 0
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  currentTeams: {
    type: Number,
    default: 0
  },
  
  // Room Info
  roomId: String,
  password: String,
  
  // Status & Timing
  status: {
    type: String,
    default: 'upcoming'
  },
  scheduleTime: Date,
  
  // Additional Info
  description: String,
  matchDescription: String,
  rules: String,
  
  // System
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);
