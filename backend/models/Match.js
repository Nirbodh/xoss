const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', default: null },
  title: { type: String, required: true, trim: true },
  game: { type: String, required: true, trim: true },
  matchType: { type: String, enum: ['match', 'tournament'], default: 'match' },
  type: { type: String, enum: ['Solo', 'Duo', 'Squad', 'Clash Squad', 'MP', 'Battle Royale', 'Classic', 'Custom'], default: 'Solo' },
  map: { type: String, default: 'Bermuda' },
  total_prize: { type: Number, default: 0 },
  perKill: { type: Number, default: 0 },
  entry_fee: { type: Number, default: 0 },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['joined', 'left', 'banned'], default: 'joined' }
  }],
  max_participants: { type: Number, required: true },
  current_participants: { type: Number, default: 0 },
  scheduleTime: { type: Date, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date },
  roomId: { type: String },
  room_code: { type: String },
  password: { type: String },
  room_password: { type: String },
  description: { type: String, trim: true },
  rules: { type: String, trim: true },
  status: { type: String, enum: ['upcoming','scheduled','live','completed','cancelled','pending'], default: 'upcoming' },
  created_by: { type: String, default: null }
}, { timestamps: true, strictPopulate: false });

// ✅ Virtual fields for frontend
matchSchema.virtual('prizePool').get(function() { return this.total_prize; });
matchSchema.virtual('entryFee').get(function() { return this.entry_fee; });
matchSchema.virtual('maxPlayers').get(function() { return this.max_participants; });
matchSchema.virtual('currentPlayers').get(function() { return this.current_participants; });
matchSchema.virtual('spots_total').get(function() { return this.max_participants; });
matchSchema.virtual('spots_filled').get(function() { return this.current_participants; });
matchSchema.virtual('spotsLeft').get(function() { return this.max_participants - this.current_participants; });

// Serialize virtuals
matchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Match', matchSchema);
