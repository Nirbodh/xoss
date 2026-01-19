// models/Tournament.js - UPDATED FOR PRODUCTION
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'registered', 'checked_in', 'playing', 'disqualified', 'finished'],
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
  position: Number,
  kills: { type: Number, default: 0 },
  damage: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  admin_notes: String,
  status_history: [{
    status: String,
    timestamp: Date,
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }]
}, { _id: true });

const winnerSchema = new mongoose.Schema({
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
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  payment_method: String,
  transaction_id: String,
  paid_at: Date,
  phone_number: String,
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

const tournamentSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  title: { 
    type: String, 
    required: [true, 'Tournament title is required'], 
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
  
  // ==================== PARTICIPANTS ====================
  max_participants: { 
    type: Number, 
    required: [true, 'Maximum participants is required'],
    min: [2, 'Minimum 2 participants required'],
    max: [200, 'Maximum 200 participants allowed']
  },
  min_participants: { 
    type: Number, 
    default: 4,
    min: [2, 'Minimum 2 participants required'],
    max: [200, 'Maximum 200 participants allowed']
  },
  current_participants: { 
    type: Number, 
    default: 0,
    min: [0, 'Current participants cannot be negative']
  },
  participants: [participantSchema],
  
  // ==================== GAME SETTINGS ====================
  type: { 
    type: String, 
    default: 'Squad',
    enum: ['Solo', 'Duo', 'Squad', 'Custom']
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
    enum: ['match', 'tournament'], 
    default: 'tournament' 
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
    type: Date, 
    required: [true, 'End time is required'] 
  },
  registration_deadline: Date,
  check_in_required: { 
    type: Boolean, 
    default: false 
  },
  check_in_time: Date,
  check_in_window: { 
    type: Number, 
    default: 15 
  }, // minutes
  
  // ==================== STATUS & APPROVAL ====================
  status: { 
    type: String, 
    enum: [
      'pending_approval', 
      'upcoming', 
      'registration_open',
      'live', 
      'completed', 
      'cancelled',
      'archived'
    ],
    default: 'pending_approval' 
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
  
  // ==================== TOURNAMENT STRUCTURE ====================
  bracket_type: { 
    type: String, 
    default: 'single_elimination',
    enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss']
  },
  prize_distribution: { 
    type: [Number], 
    default: [50, 30, 20] 
  },
  requires_verification: { 
    type: Boolean, 
    default: false 
  },
  has_waiting_list: { 
    type: Boolean, 
    default: false 
  },
  
  // ==================== WINNERS & PRIZE DISTRIBUTION ====================
  winners: [winnerSchema],
  prize_status: { 
    type: String, 
    enum: ['pending', 'distributing', 'distributed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  distribution_date: Date,
  refund_date: Date,
  distributed_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // ==================== STATISTICS ====================
  stats: {
    total_joins: { type: Number, default: 0 },
    total_collection: { type: Number, default: 0 },
    average_join_time: Date,
    check_in_rate: { type: Number, default: 0 },
    completion_rate: { type: Number, default: 0 }
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
  cancelled_at: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== VIRTUAL FIELDS ====================
tournamentSchema.virtual('prizePool').get(function() { 
  return this.total_prize; 
});

tournamentSchema.virtual('entryFee').get(function() { 
  return this.entry_fee; 
});

tournamentSchema.virtual('perKill').get(function() { 
  return this.per_kill; 
});

tournamentSchema.virtual('maxPlayers').get(function() { 
  return this.max_participants; 
});

tournamentSchema.virtual('currentPlayers').get(function() { 
  return this.current_participants; 
});

tournamentSchema.virtual('roomId').get(function() { 
  return this.room_id; 
});

tournamentSchema.virtual('password').get(function() { 
  return this.room_password; 
});

tournamentSchema.virtual('scheduleTime').get(function() { 
  return this.schedule_time; 
});

tournamentSchema.virtual('matchType').get(function() { 
  return this.match_type; 
});

tournamentSchema.virtual('approvalStatus').get(function() { 
  return this.approval_status; 
});

tournamentSchema.virtual('streamingLink').get(function() { 
  return this.streaming_link; 
});

tournamentSchema.virtual('registrationDeadline').get(function() { 
  return this.registration_deadline; 
});

tournamentSchema.virtual('checkInTime').get(function() { 
  return this.check_in_time; 
});

tournamentSchema.virtual('spots_left').get(function() {
  return Math.max(0, this.max_participants - this.current_participants);
});

tournamentSchema.virtual('is_joinable').get(function() {
  const now = new Date();
  const isApproved = this.approval_status === 'approved';
  const isUpcoming = ['upcoming', 'registration_open'].includes(this.status);
  const hasSpots = this.current_participants < this.max_participants;
  const registrationOpen = !this.registration_deadline || now < this.registration_deadline;
  
  return isApproved && isUpcoming && hasSpots && registrationOpen;
});

tournamentSchema.virtual('time_until_start').get(function() {
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

// ==================== INDEXES ====================
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ approval_status: 1 });
tournamentSchema.index({ game: 1 });
tournamentSchema.index({ schedule_time: 1 });
tournamentSchema.index({ created_by: 1 });
tournamentSchema.index({ 'participants.user': 1 });
tournamentSchema.index({ is_featured: 1 });
tournamentSchema.index({ total_prize: -1 });
tournamentSchema.index({ title: 'text', description: 'text', game: 'text' });

// ==================== MIDDLEWARE ====================
tournamentSchema.pre('save', function(next) {
  // Ensure end_time is after start_time
  if (this.end_time && this.start_time && this.end_time <= this.start_time) {
    this.end_time = new Date(this.start_time.getTime() + 3 * 60 * 60 * 1000); // 3 hours after start
  }
  
  // Ensure schedule_time is before start_time
  if (this.schedule_time && this.start_time && this.schedule_time >= this.start_time) {
    this.schedule_time = new Date(this.start_time.getTime() - 30 * 60 * 1000); // 30 minutes before start
  }
  
  // Set registration_deadline if not provided
  if (!this.registration_deadline && this.schedule_time) {
    this.registration_deadline = new Date(this.schedule_time.getTime() - 30 * 60 * 1000);
  }
  
  // Set check_in_time if check_in_required is true
  if (this.check_in_required && !this.check_in_time && this.start_time) {
    this.check_in_time = new Date(this.start_time.getTime() - 15 * 60 * 1000);
  }
  
  next();
});

// ==================== METHODS ====================
tournamentSchema.methods.addParticipant = function(userId, participantData = {}) {
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

tournamentSchema.methods.removeParticipant = function(userId) {
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

tournamentSchema.methods.isUserJoined = function(userId) {
  return this.participants.some(p => 
    p.user && p.user.toString() === userId.toString()
  );
};

tournamentSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => 
    p.user && p.user.toString() === userId.toString()
  );
};

tournamentSchema.methods.updateParticipantStatus = function(userId, status, notes = '') {
  const participant = this.getParticipant(userId);
  if (participant) {
    const oldStatus = participant.status;
    participant.status = status;
    participant.updated_at = new Date();
    
    if (notes) {
      participant.admin_notes = notes;
    }
    
    // Add to status history
    if (!participant.status_history) {
      participant.status_history = [];
    }
    
    participant.status_history.push({
      old_status: oldStatus,
      new_status: status,
      timestamp: new Date(),
      notes: notes
    });
    
    return { success: true, participant, oldStatus };
  }
  
  return { success: false, message: 'Participant not found' };
};

// ==================== STATIC METHODS ====================
tournamentSchema.statics.findByGame = function(game) {
  return this.find({ game, approval_status: 'approved' });
};

tournamentSchema.statics.findUpcoming = function() {
  return this.find({ 
    status: { $in: ['upcoming', 'registration_open'] },
    approval_status: 'approved',
    schedule_time: { $gt: new Date() }
  });
};

tournamentSchema.statics.findLive = function() {
  return this.find({ 
    status: 'live',
    approval_status: 'approved'
  });
};

tournamentSchema.statics.findCompleted = function() {
  return this.find({ 
    status: 'completed',
    approval_status: 'approved'
  });
};

tournamentSchema.statics.findPendingApproval = function() {
  return this.find({ approval_status: 'pending' });
};

tournamentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_tournaments: { $sum: 1 },
        total_prize_pool: { $sum: '$total_prize' },
        total_participants: { $sum: '$current_participants' },
        total_collection: { $sum: { $multiply: ['$entry_fee', '$current_participants'] } },
        upcoming_count: { $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] } },
        live_count: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
        completed_count: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        approved_count: { $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } },
        pending_count: { $sum: { $cond: [{ $eq: ['$approval_status', 'pending'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    total_tournaments: 0,
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

module.exports = mongoose.model('Tournament', tournamentSchema);
