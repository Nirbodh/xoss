const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  title: {
    type: String,
    required: true
  },
  game: {
    type: String,
    required: true
  },
  match_type: {
    type: String,
    enum: ['solo', 'duo', 'squad', 'custom'],
    default: 'solo'
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  total_prize: {
    type: Number,
    default: 0
  },
  entry_fee: {
    type: Number,
    default: 0
  },
  spots_total: {
    type: Number,
    required: true
  },
  spots_filled: {
    type: Number,
    default: 0
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date
  },
  room_code: {
    type: String
  },
  room_password: {
    type: String
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);
