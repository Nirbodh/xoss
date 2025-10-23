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
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
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
  thumbnail: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);
