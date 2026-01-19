// models/Match.js - PRODUCTION PRO VERSION
const mongoose = require('mongoose');

const matchParticipantSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'registered', 'checked_in', 'playing', 'disqualified', 'finished', 'left'],
    default: 'registered'
  },
  joined_at: { 
    type: Date, 
    default: Date.now 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'free', 'refunded', 'failed'], 
    default: 'pending' 
  },
  amount_paid: { 
    type: Number, 
    default: 0 
  },
  check_in_status: { 
    type: String, 
    enum: ['pending', 'checked_in', 'auto_checked', 'missed'], 
    default: 'pending' 
  },
  check_in_time: Date,
  game_data: {
    uid: String,
    name: String,
    region: { type: String, default: 'BD' },
    device: { type: String, default: 'mobile' },
    player_name: String
  },
  metadata: {
    ip_address: String,
    user_agent: String,
    join_method: String,
    join_timestamp: Date
  },
  performance: {
    kills: { type: Number, default: 0 },
    damage: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    survival_time: Number,
    headshots: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    revives: { type: Number, default: 0 }
  },
  result_submitted: { 
    type: Boolean, 
    default: false 
  },
  result_data: {
    screenshot: String,
    submitted_at: Date,
    verified: { type: Boolean, default: false },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verified_at: Date,
    admin_notes: String
  },
  admin_notes: String,
  status_history: [{
    status: String,
    timestamp: Date,
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }]
}, { _id: true });

const matchResultSchema = new mongoose.Schema({
  player_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  player_name: String,
  team_name: String,
  kills: { 
    type: Number, 
    default: 0 
  },
  damage: { 
    type: Number, 
    default: 0 
  },
  rank: { 
    type: Number, 
    required: true 
  },
  survival_time: Number,
  headshots: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  revives: { type: Number, default: 0 },
  total_score: { 
    type: Number, 
    default: 0 
  },
  screenshot: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'disputed'], 
    default: 'pending' 
  },
  submitted_at: { 
    type: Date, 
    default: Date.now 
  },
  verified_at: Date,
  verified_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  admin_notes: { 
    type: String, 
    default: '' 
  },
  verification_history: [{
    status: String,
    timestamp: Date,
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }]
}, { _id: true });

const matchWinnerSchema = new mongoose.Schema({
  rank: { 
    type: Number, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: String,
  team_name: String,
  kills: { 
    type: Number, 
    default: 0 
  },
  damage: { 
    type: Number, 
    default: 0 
  },
  prize_amount: { 
    type: Number, 
    required: true 
  },
  kill_prize: { 
    type: Number, 
    default: 0 
  },
  total_prize: { 
    type: Number, 
    default: 0 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  payment_method: String,
  transaction_id: String,
  paid_at: Date,
  payment_details: {
    phone_number: String,
    bank_name: String,
    account_number: String,
    transaction_ref: String
  },
  notes: String
}, { _id: true });

const statusHistorySchema = new mongoose.Schema({
  status: String,
  old_status: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  changed_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  notes: String
});

const matchSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  title: { 
    type: String, 
    required: [true, 'Match title is required'], 
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  game: { 
    type: String, 
    required: [true, 'Game is required'], 
    trim: true,
    enum: ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'BGMI', 'Other']
  },
  description: { 
    type: String, 
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  rules: { 
    type: String, 
    default: '',
    maxlength: [5000, 'Rules cannot exceed 5000 characters']
  },
  
  // ==================== FINANCIAL ====================
  entry_fee: { 
    type: Number, 
    default: 0,
    min: [0, 'Entry fee cannot be negative']
  },
  total_prize: { 
    type: Number, 
    default: 0,
    min: [0, 'Total prize cannot be negative']
  },
  per_kill: { 
    type: Number, 
    default: 0,
    min: [0, 'Per kill prize cannot be negative']
  },
  kill_prize_enabled: { 
    type: Boolean, 
    default: true 
  },
  
  // ==================== PARTICIPANTS ====================
  max_participants: { 
    type: Number, 
    required: [true, 'Maximum participants is required'],
    min: [1, 'Minimum 1 participant required'],
    max: [100, 'Maximum 100 participants allowed']
  },
  min_participants: { 
    type: Number, 
    default: 2,
    min: [1, 'Minimum 1 participant required'],
    max: [100, 'Maximum 100 participants allowed']
  },
  current_participants: { 
    type: Number, 
    default: 0,
    min: [0, 'Current participants cannot be negative']
  },
  participants: [matchParticipantSchema],
  
  // ==================== GAME SETTINGS ====================
  type: { 
    type: String, 
    default: 'Solo',
    enum: ['Solo', 'Duo', 'Squad', 'Custom', 'Team Deathmatch', 'Battle Royale']
  },
  map: { 
    type: String, 
    default: 'Bermuda'
  },
  mode: { 
    type: String, 
    default: 'Classic'
  },
  match_type: { 
    type: String, 
    enum: ['match', 'tournament', 'scrim', 'friendly'], 
    default: 'match' 
  },
  platform: { 
    type: String, 
    default: 'Mobile',
    enum: ['Mobile', 'PC', 'Console', 'Cross-Platform']
  },
  version: { 
    type: String, 
    default: 'Latest' 
  },
  server_region: { 
    type: String, 
    default: 'Asia' 
  },
  
  // ==================== ROOM INFO ====================
  room_id: { 
    type: String, 
    default: '',
    trim: true
  },
  room_password: { 
    type: String, 
    default: '',
    trim: true
  },
  streaming_link: { 
    type: String, 
    default: '',
    trim: true
  },
  custom_room_settings: {
    password_protected: { type: Boolean, default: false },
    auto_join: { type: Boolean, default: false },
    spectator_allowed: { type: Boolean, default: false },
    max_spectators: { type: Number, default: 10 }
  },
  
  // ==================== TIMING ====================
  schedule_time: { 
    type: Date, 
    required: [true, 'Schedule time is required'] 
  },
  start_time: { 
    type: Date, 
    required: [true, 'Start time is required'] 
  },
  end_time: { 
    type: Date 
  },
  estimated_duration: { 
    type: Number, 
    default: 30 
  }, // minutes
  registration_deadline: Date,
  check_in_required: { 
    type: Boolean, 
    default: false 
  },
  check_in_time: Date,
  check_in_window: { 
    type: Number, 
    default: 10 
  }, // minutes
  
  // ==================== STATUS & APPROVAL ====================
  status: { 
    type: String, 
    enum: [
      'draft', 
      'pending_approval', 
      'upcoming', 
      'registration_open',
      'check_in_open',
      'live', 
      'completed', 
      'cancelled',
      'archived'
    ],
    default: 'draft' 
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // ==================== ADMIN FIELDS ====================
  approved_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approved_at: { 
    type: Date 
  },
  rejected_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  rejected_at: { 
    type: Date 
  },
  rejection_reason: { 
    type: String, 
    default: '' 
  },
  admin_notes: { 
    type: String, 
    default: '' 
  },
  approval_reason: { 
    type: String, 
    default: '' 
  },
  
  // ==================== MATCH RESULTS ====================
  results: [matchResultSchema],
  result_status: { 
    type: String, 
    enum: ['pending', 'submission_open', 'submission_closed', 'calculating', 'calculated', 'verified', 'disputed'], 
    default: 'pending' 
  },
  result_submission_deadline: Date,
  result_verification_deadline: Date,
  allow_result_edit: { 
    type: Boolean, 
    default: true 
  },
  auto_calculate_results: { 
    type: Boolean, 
    default: false 
  },
  
  // ==================== WINNERS & PRIZE DISTRIBUTION ====================
  winners: [matchWinnerSchema],
  prize_distribution: { 
    type: [Number], 
    default: [50, 30, 20] 
  },
  prize_status: { 
    type: String, 
    enum: ['pending', 'calculating', 'ready', 'distributing', 'distributed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  distribution_date: Date,
  refund_date: Date,
  distributed_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // ==================== SCORING SYSTEM ====================
  scoring_settings: {
    kill_points: { type: Number, default: 10 },
    rank_points: { 
      type: Map, 
      of: Number,
      default: { 1: 100, 2: 80, 3: 60, 4: 50, 5: 40, 6: 30, 7: 20, 8: 10, 9: 5, 10: 2 }
    },
    damage_multiplier: { type: Number, default: 0.01 },
    survival_bonus: { type: Number, default: 5 },
    headshot_bonus: { type: Number, default: 2 }
  },
  
  // ==================== STATISTICS ====================
  stats: {
    total_joins: { type: Number, default: 0 },
    total_collection: { type: Number, default: 0 },
    check_in_rate: { type: Number, default: 0 },
    result_submission_rate: { type: Number, default: 0 },
    average_kills: { type: Number, default: 0 },
    average_damage: { type: Number, default: 0 },
    total_kills: { type: Number, default: 0 },
    total_damage: { type: Number, default: 0 }
  },
  
  // ==================== ADDITIONAL FIELDS ====================
  thumbnail: { 
    type: String, 
    default: '' 
  },
  tags: { 
    type: [String], 
    default: [] 
  },
  is_featured: { 
    type: Boolean, 
    default: false 
  },
  is_private: { 
    type: Boolean, 
    default: false 
  },
  requires_verification: { 
    type: Boolean, 
    default: false 
  },
  has_waiting_list: { 
    type: Boolean, 
    default: false 
  },
  waiting_list: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joined_at: { type: Date, default: Date.now },
    position: Number
  }],
  status_history: [statusHistorySchema],
  update_history: [{
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_at: { type: Date, default: Date.now },
    changes: [String],
    reason: String
  }],
  
  // ==================== TIMESTAMPS ====================
  started_at: Date,
  completed_at: Date,
  cancelled_at: Date,
  result_calculated_at: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'matches'
});

// ==================== VIRTUAL FIELDS ====================
matchSchema.virtual('prizePool').get(function() { 
  return this.total_prize; 
});

matchSchema.virtual('entryFee').get(function() { 
  return this.entry_fee; 
});

matchSchema.virtual('perKill').get(function() { 
  return this.per_kill; 
});

matchSchema.virtual('maxPlayers').get(function() { 
  return this.max_participants; 
});

matchSchema.virtual('currentPlayers').get(function() { 
  return this.current_participants; 
});

matchSchema.virtual('roomId').get(function() { 
  return this.room_id; 
});

matchSchema.virtual('password').get(function() { 
  return this.room_password; 
});

matchSchema.virtual('scheduleTime').get(function() { 
  return this.schedule_time; 
});

matchSchema.virtual('matchType').get(function() { 
  return this.match_type; 
});

matchSchema.virtual('approvalStatus').get(function() { 
  return this.approval_status; 
});

matchSchema.virtual('streamingLink').get(function() { 
  return this.streaming_link; 
});

matchSchema.virtual('registrationDeadline').get(function() { 
  return this.registration_deadline; 
});

matchSchema.virtual('checkInTime').get(function() { 
  return this.check_in_time; 
});

matchSchema.virtual('spots_left').get(function() {
  return Math.max(0, this.max_participants - this.current_participants);
});

matchSchema.virtual('is_joinable').get(function() {
  const now = new Date();
  const isApproved = this.approval_status === 'approved';
  const isJoinableStatus = ['upcoming', 'registration_open', 'check_in_open'].includes(this.status);
  const hasSpots = this.current_participants < this.max_participants;
  const registrationOpen = !this.registration_deadline || now < this.registration_deadline;
  
  return isApproved && isJoinableStatus && hasSpots && registrationOpen;
});

matchSchema.virtual('time_until_start').get(function() {
  const now = new Date();
  const start = new Date(this.start_time);
  const diffMs = start - now;
  
  if (diffMs <= 0) return 'Started';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
});

matchSchema.virtual('result_submission_open').get(function() {
  if (!this.result_submission_deadline) return false;
  const now = new Date();
  return now < this.result_submission_deadline && 
         this.status === 'completed' && 
         this.result_status === 'submission_open';
});

// ==================== INDEXES ====================
matchSchema.index({ status: 1 });
matchSchema.index({ approval_status: 1 });
matchSchema.index({ game: 1 });
matchSchema.index({ schedule_time: 1 });
matchSchema.index({ created_by: 1 });
matchSchema.index({ 'participants.user': 1 });
matchSchema.index({ is_featured: 1 });
matchSchema.index({ total_prize: -1 });
matchSchema.index({ match_type: 1 });
matchSchema.index({ title: 'text', description: 'text', game: 'text' });

// ==================== MIDDLEWARE ====================
matchSchema.pre('save', function(next) {
  // Ensure end_time is after start_time
  if (!this.end_time && this.start_time) {
    this.end_time = new Date(this.start_time.getTime() + (this.estimated_duration || 30) * 60 * 1000);
  }
  
  if (this.end_time && this.start_time && this.end_time <= this.start_time) {
    this.end_time = new Date(this.start_time.getTime() + (this.estimated_duration || 30) * 60 * 1000);
  }
  
  // Ensure schedule_time is before start_time
  if (this.schedule_time && this.start_time && this.schedule_time >= this.start_time) {
    this.schedule_time = new Date(this.start_time.getTime() - 15 * 60 * 1000); // 15 minutes before start
  }
  
  // Set registration_deadline if not provided
  if (!this.registration_deadline && this.schedule_time) {
    this.registration_deadline = new Date(this.schedule_time.getTime() - 10 * 60 * 1000);
  }
  
  // Set check_in_time if check_in_required is true
  if (this.check_in_required && !this.check_in_time && this.start_time) {
    this.check_in_time = new Date(this.start_time.getTime() - 10 * 60 * 1000);
  }
  
  // Set result submission deadline if not provided
  if (!this.result_submission_deadline && this.end_time) {
    this.result_submission_deadline = new Date(this.end_time.getTime() + 30 * 60 * 1000);
  }
  
  next();
});

// ==================== METHODS ====================
matchSchema.methods.addParticipant = function(userId, participantData = {}) {
  const participant = {
    user: userId,
    status: 'registered',
    joined_at: new Date(),
    payment_status: participantData.payment_status || 'pending',
    amount_paid: participantData.amount_paid || 0,
    game_data: participantData.game_data || {},
    metadata: participantData.metadata || {}
  };
  
  this.participants.push(participant);
  this.current_participants += 1;
  
  return participant;
};

matchSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.user && p.user.toString() === userId.toString()
  );
  
  if (participantIndex !== -1) {
    const participant = this.participants[participantIndex];
    this.participants.splice(participantIndex, 1);
    this.current_participants = Math.max(0, this.current_participants - 1);
    return participant;
  }
  
  return null;
};

matchSchema.methods.isUserJoined = function(userId) {
  return this.participants.some(p => 
    p.user && p.user.toString() === userId.toString()
  );
};

matchSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => 
    p.user && p.user.toString() === userId.toString()
  );
};

matchSchema.methods.submitResult = function(userId, resultData) {
  const participant = this.getParticipant(userId);
  if (!participant) {
    return { success: false, message: 'Participant not found' };
  }
  
  const existingResultIndex = this.results.findIndex(r => 
    r.player_id.toString() === userId.toString()
  );
  
  const result = {
    player_id: userId,
    player_name: resultData.player_name || participant.game_data?.player_name,
    team_name: resultData.team_name || '',
    kills: resultData.kills || 0,
    damage: resultData.damage || 0,
    rank: resultData.rank,
    survival_time: resultData.survival_time,
    headshots: resultData.headshots || 0,
    assists: resultData.assists || 0,
    revives: resultData.revives || 0,
    screenshot: resultData.screenshot || '',
    submitted_at: new Date(),
    status: 'pending'
  };
  
  // Calculate total score
  const scoring = this.scoring_settings;
  const killPoints = (result.kills || 0) * (scoring.kill_points || 10);
  const rankPoints = scoring.rank_points?.get(result.rank.toString()) || 0;
  const damagePoints = (result.damage || 0) * (scoring.damage_multiplier || 0.01);
  const headshotBonus = (result.headshots || 0) * (scoring.headshot_bonus || 2);
  const survivalBonus = result.survival_time ? (scoring.survival_bonus || 5) : 0;
  
  result.total_score = killPoints + rankPoints + damagePoints + headshotBonus + survivalBonus;
  
  if (existingResultIndex !== -1) {
    this.results[existingResultIndex] = result;
  } else {
    this.results.push(result);
  }
  
  participant.result_submitted = true;
  participant.result_data = {
    screenshot: resultData.screenshot,
    submitted_at: new Date()
  };
  
  return { success: true, result };
};

matchSchema.methods.verifyResult = function(userId, verifiedBy, status = 'verified', notes = '') {
  const resultIndex = this.results.findIndex(r => 
    r.player_id.toString() === userId.toString()
  );
  
  if (resultIndex === -1) {
    return { success: false, message: 'Result not found' };
  }
  
  const result = this.results[resultIndex];
  const oldStatus = result.status;
  result.status = status;
  result.verified_at = new Date();
  result.verified_by = verifiedBy;
  result.admin_notes = notes;
  
  // Add to verification history
  if (!result.verification_history) {
    result.verification_history = [];
  }
  
  result.verification_history.push({
    status: status,
    timestamp: new Date(),
    verified_by: verifiedBy,
    notes: notes
  });
  
  return { success: true, result, oldStatus };
};

// ==================== STATIC METHODS ====================
matchSchema.statics.findByGame = function(game) {
  return this.find({ game, approval_status: 'approved' });
};

matchSchema.statics.findUpcoming = function() {
  return this.find({ 
    status: { $in: ['upcoming', 'registration_open', 'check_in_open'] },
    approval_status: 'approved',
    schedule_time: { $gt: new Date() }
  });
};

matchSchema.statics.findLive = function() {
  return this.find({ 
    status: 'live',
    approval_status: 'approved'
  });
};

matchSchema.statics.findCompleted = function() {
  return this.find({ 
    status: 'completed',
    approval_status: 'approved'
  });
};

matchSchema.statics.findPendingApproval = function() {
  return this.find({ approval_status: 'pending' });
};

matchSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_matches: { $sum: 1 },
        total_prize_pool: { $sum: '$total_prize' },
        total_participants: { $sum: '$current_participants' },
        total_collection: { $sum: { $multiply: ['$entry_fee', '$current_participants'] } },
        upcoming_count: { $sum: { $cond: [{ $in: ['$status', ['upcoming', 'registration_open', 'check_in_open']] }, 1, 0] } },
        live_count: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
        completed_count: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        approved_count: { $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } },
        pending_count: { $sum: { $cond: [{ $eq: ['$approval_status', 'pending'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    total_matches: 0,
    total_prize_pool: 0,
    total_participants: 0,
    total_collection: 0,
    upcoming_count: 0,
    live_count: 0,
    completed_count: 0,
    approved_count: 0,
    pending_count: 0
  };
};

module.exports = mongoose.model('Match', matchSchema);
