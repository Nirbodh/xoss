// models/Result.js - XOSS Gaming Result Management System
const mongoose = require('mongoose');

const resultVerificationHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'disputed'],
    required: true
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verified_at: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  screenshot_url: String,
  verification_method: {
    type: String,
    enum: ['manual', 'auto', 'admin', 'system'],
    default: 'manual'
  }
}, { _id: true });

const resultScoreDetailSchema = new mongoose.Schema({
  kill_points: {
    type: Number,
    default: 0
  },
  rank_points: {
    type: Number,
    default: 0
  },
  damage_points: {
    type: Number,
    default: 0
  },
  survival_points: {
    type: Number,
    default: 0
  },
  headshot_points: {
    type: Number,
    default: 0
  },
  assist_points: {
    type: Number,
    default: 0
  },
  revive_points: {
    type: Number,
    default: 0
  },
  bonus_points: {
    type: Number,
    default: 0
  },
  penalty_points: {
    type: Number,
    default: 0
  },
  total_score: {
    type: Number,
    default: 0
  }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  // 🔹 BASIC INFORMATION
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  event_type: {
    type: String,
    enum: ['match', 'tournament'],
    required: true,
    index: true
  },
  
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  username: {
    type: String,
    required: true,
    trim: true
  },
  
  team_name: {
    type: String,
    default: '',
    trim: true
  },
  
  // 🔹 GAME PERFORMANCE DATA
  kills: {
    type: Number,
    default: 0,
    min: 0
  },
  
  damage: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rank: {
    type: Number,
    required: true,
    min: 1
  },
  
  survival_time: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  
  headshots: {
    type: Number,
    default: 0,
    min: 0
  },
  
  assists: {
    type: Number,
    default: 0,
    min: 0
  },
  
  revives: {
    type: Number,
    default: 0,
    min: 0
  },
  
  deaths: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 🔹 SCORING SYSTEM
  score_details: {
    type: resultScoreDetailSchema,
    default: () => ({})
  },
  
  total_score: {
    type: Number,
    default: 0,
    required: true
  },
  
  // 🔹 MEDIA & PROOF
  screenshots: [{
    url: {
      type: String,
      required: true
    },
    upload_time: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    thumbnail_url: String,
    file_size: Number,
    file_type: String
  }],
  
  video_proof: {
    url: String,
    duration: Number, // in seconds
    upload_time: Date
  },
  
  // 🔹 VERIFICATION STATUS
  status: {
    type: String,
    enum: [
      'pending',           // Result submitted, awaiting verification
      'verified',          // Result verified and accepted
      'rejected',          // Result rejected (fraud, invalid proof)
      'disputed',          // Result is being disputed
      'under_review',      // Result under admin review
      'auto_verified',     // Automatically verified by system
      'corrected',         // Result was corrected
      'cancelled'          // Result cancelled (user left match, etc.)
    ],
    default: 'pending',
    index: true
  },
  
  verification_level: {
    type: String,
    enum: ['none', 'basic', 'advanced', 'verified', 'certified'],
    default: 'none'
  },
  
  verification_history: [resultVerificationHistorySchema],
  
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verified_at: Date,
  
  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  rejected_at: Date,
  
  rejection_reason: {
    type: String,
    default: ''
  },
  
  // 🔹 DISPUTE HANDLING
  disputed: {
    type: Boolean,
    default: false
  },
  
  disputed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  dispute_reason: String,
  
  dispute_resolved: {
    type: Boolean,
    default: false
  },
  
  dispute_resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  dispute_resolution: String,
  
  // 🔹 WINNER & PRIZE INFO
  is_winner: {
    type: Boolean,
    default: false
  },
  
  winner_rank: {
    type: Number,
    min: 1
  },
  
  prize_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  prize_paid: {
    type: Boolean,
    default: false
  },
  
  prize_paid_at: Date,
  
  prize_transaction_id: String,
  
  // 🔹 SYSTEM FIELDS
  submitted_via: {
    type: String,
    enum: ['web', 'mobile', 'api', 'admin', 'auto'],
    default: 'web'
  },
  
  ip_address: String,
  
  user_agent: String,
  
  device_info: {
    platform: String,
    os: String,
    browser: String,
    is_mobile: Boolean
  },
  
  metadata: {
    type: Object,
    default: {}
  },
  
  notes: {
    type: String,
    default: ''
  },
  
  admin_notes: {
    type: String,
    default: ''
  },
  
  // 🔹 TIMESTAMPS
  submitted_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 VIRTUAL FIELDS
resultSchema.virtual('formatted_survival_time').get(function() {
  if (!this.survival_time) return '0:00';
  
  const minutes = Math.floor(this.survival_time / 60);
  const seconds = this.survival_time % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

resultSchema.virtual('kd_ratio').get(function() {
  if (this.deaths === 0) return this.kills;
  return (this.kills / this.deaths).toFixed(2);
});

resultSchema.virtual('damage_per_kill').get(function() {
  if (this.kills === 0) return 0;
  return (this.damage / this.kills).toFixed(0);
});

resultSchema.virtual('headshot_percentage').get(function() {
  if (this.kills === 0) return 0;
  return ((this.headshots / this.kills) * 100).toFixed(1);
});

resultSchema.virtual('is_verified').get(function() {
  return this.status === 'verified' || this.status === 'auto_verified';
});

resultSchema.virtual('is_pending').get(function() {
  return this.status === 'pending' || this.status === 'under_review';
});

resultSchema.virtual('is_rejected').get(function() {
  return this.status === 'rejected' || this.status === 'cancelled';
});

resultSchema.virtual('formatted_submitted_at').get(function() {
  return this.submitted_at ? this.submitted_at.toLocaleString('bn-BD') : '';
});

resultSchema.virtual('formatted_verified_at').get(function() {
  return this.verified_at ? this.verified_at.toLocaleString('bn-BD') : '';
});

resultSchema.virtual('verification_time').get(function() {
  if (!this.verified_at || !this.submitted_at) return null;
  return this.verified_at.getTime() - this.submitted_at.getTime(); // in milliseconds
});

// 🔹 INDEXES
resultSchema.index({ event_id: 1, user_id: 1 }, { unique: true });
resultSchema.index({ event_id: 1, total_score: -1 });
resultSchema.index({ user_id: 1, submitted_at: -1 });
resultSchema.index({ status: 1, submitted_at: -1 });
resultSchema.index({ event_type: 1, event_id: 1 });
resultSchema.index({ is_winner: 1, submitted_at: -1 });
resultSchema.index({ 'score_details.total_score': -1 });
resultSchema.index({ rank: 1, event_id: 1 });

// 🔹 MIDDLEWARE
resultSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Calculate total score from score details
  if (this.score_details) {
    const scoreDetails = this.score_details;
    this.total_score = 
      (scoreDetails.kill_points || 0) +
      (scoreDetails.rank_points || 0) +
      (scoreDetails.damage_points || 0) +
      (scoreDetails.survival_points || 0) +
      (scoreDetails.headshot_points || 0) +
      (scoreDetails.assist_points || 0) +
      (scoreDetails.revive_points || 0) +
      (scoreDetails.bonus_points || 0) -
      (scoreDetails.penalty_points || 0);
  }
  
  // Update winner status based on rank
  if (this.rank && this.rank <= 10) { // Top 10 are winners
    this.is_winner = true;
    this.winner_rank = this.rank;
  }
  
  next();
});

// 🔹 STATIC METHODS
resultSchema.statics.findByEvent = function(eventId, options = {}) {
  const { 
    limit = 100, 
    skip = 0, 
    sort = { total_score: -1 },
    populateUser = true 
  } = options;
  
  let query = this.find({ event_id: eventId });
  
  if (populateUser) {
    query = query.populate('user_id', 'username avatar email phone stats');
  }
  
  return query
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

resultSchema.statics.findByUser = function(userId, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    sort = { submitted_at: -1 },
    status = null,
    event_type = null 
  } = options;
  
  let query = { user_id: userId };
  
  if (status) {
    query.status = status;
  }
  
  if (event_type) {
    query.event_type = event_type;
  }
  
  return this.find(query)
    .populate({
      path: 'event_id',
      select: 'title game type total_prize schedule_time'
    })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

resultSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_results: { $sum: 1 },
        total_kills: { $sum: '$kills' },
        total_damage: { $sum: '$damage' },
        total_headshots: { $sum: '$headshots' },
        total_assists: { $sum: '$assists' },
        total_revives: { $sum: '$revives' },
        total_deaths: { $sum: '$deaths' },
        total_score: { $sum: '$total_score' },
        wins: { 
          $sum: { 
            $cond: [{ $lte: ['$rank', 10] }, 1, 0] 
          } 
        },
        top3: { 
          $sum: { 
            $cond: [{ $lte: ['$rank', 3] }, 1, 0] 
          } 
        },
        top1: { 
          $sum: { 
            $cond: [{ $eq: ['$rank', 1] }, 1, 0] 
          } 
        },
        verified_results: {
          $sum: {
            $cond: [
              { $in: ['$status', ['verified', 'auto_verified']] },
              1,
              0
            ]
          }
        },
        pending_results: {
          $sum: {
            $cond: [
              { $in: ['$status', ['pending', 'under_review']] },
              1,
              0
            ]
          }
        },
        average_rank: { $avg: '$rank' },
        average_kills: { $avg: '$kills' },
        average_damage: { $avg: '$damage' },
        average_score: { $avg: '$total_score' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total_results: 0,
      total_kills: 0,
      total_damage: 0,
      total_headshots: 0,
      total_assists: 0,
      total_revives: 0,
      total_deaths: 0,
      total_score: 0,
      wins: 0,
      top3: 0,
      top1: 0,
      verified_results: 0,
      pending_results: 0,
      average_rank: 0,
      average_kills: 0,
      average_damage: 0,
      average_score: 0,
      win_rate: 0,
      kd_ratio: 0
    };
  }
  
  const stat = stats[0];
  const kdRatio = stat.total_deaths > 0 ? stat.total_kills / stat.total_deaths : stat.total_kills;
  const winRate = stat.total_results > 0 ? (stat.wins / stat.total_results) * 100 : 0;
  
  return {
    ...stat,
    kd_ratio: kdRatio.toFixed(2),
    win_rate: winRate.toFixed(2),
    headshot_percentage: stat.total_kills > 0 ? 
      ((stat.total_headshots / stat.total_kills) * 100).toFixed(1) : 0,
    damage_per_kill: stat.total_kills > 0 ? 
      (stat.total_damage / stat.total_kills).toFixed(0) : 0
  };
};

resultSchema.statics.getEventStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { event_id: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        total_participants: { $sum: 1 },
        total_submissions: { 
          $sum: { 
            $cond: [
              { $in: ['$status', ['pending', 'verified', 'auto_verified', 'under_review']] },
              1,
              0
            ]
          } 
        },
        verified_submissions: {
          $sum: {
            $cond: [
              { $in: ['$status', ['verified', 'auto_verified']] },
              1,
              0
            ]
          }
        },
        pending_submissions: {
          $sum: {
            $cond: [
              { $in: ['$status', ['pending', 'under_review']] },
              1,
              0
            ]
          }
        },
        rejected_submissions: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'rejected'] },
              1,
              0
            ]
          }
        },
        disputed_submissions: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'disputed'] },
              1,
              0
            ]
          }
        },
        total_kills: { $sum: '$kills' },
        total_damage: { $sum: '$damage' },
        total_headshots: { $sum: '$headshots' },
        average_kills: { $avg: '$kills' },
        average_damage: { $avg: '$damage' },
        average_rank: { $avg: '$rank' },
        average_score: { $avg: '$total_score' },
        highest_score: { $max: '$total_score' },
        lowest_score: { $min: '$total_score' },
        submission_rate: {
          $avg: {
            $cond: [
              { $in: ['$status', ['pending', 'verified', 'auto_verified', 'under_review']] },
              100,
              0
            ]
          }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total_participants: 0,
      total_submissions: 0,
      verified_submissions: 0,
      pending_submissions: 0,
      rejected_submissions: 0,
      disputed_submissions: 0,
      total_kills: 0,
      total_damage: 0,
      total_headshots: 0,
      average_kills: 0,
      average_damage: 0,
      average_rank: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      submission_rate: 0,
      verification_rate: 0
    };
  }
  
  const stat = stats[0];
  const verificationRate = stat.total_submissions > 0 ? 
    (stat.verified_submissions / stat.total_submissions) * 100 : 0;
  
  return {
    ...stat,
    verification_rate: verificationRate.toFixed(2),
    average_kills_per_participant: stat.total_participants > 0 ? 
      stat.total_kills / stat.total_participants : 0,
    average_damage_per_participant: stat.total_participants > 0 ? 
      stat.total_damage / stat.total_participants : 0
  };
};

resultSchema.statics.getLeaderboard = async function(eventId, limit = 20) {
  return this.find({ 
    event_id: eventId,
    status: { $in: ['verified', 'auto_verified'] }
  })
    .populate('user_id', 'username avatar')
    .sort({ total_score: -1, rank: 1 })
    .limit(limit)
    .lean();
};

resultSchema.statics.getTopPerformers = async function(options = {}) {
  const { 
    limit = 10, 
    days = 30,
    game = null,
    event_type = null 
  } = options;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let match = {
    status: { $in: ['verified', 'auto_verified'] },
    submitted_at: { $gte: startDate }
  };
  
  if (game) {
    // We need to join with Match/Tournament collection
    // This is a simplified version
  }
  
  if (event_type) {
    match.event_type = event_type;
  }
  
  const topPerformers = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$user_id',
        total_score: { $sum: '$total_score' },
        total_kills: { $sum: '$kills' },
        total_damage: { $sum: '$damage' },
        total_wins: { 
          $sum: { 
            $cond: [{ $lte: ['$rank', 3] }, 1, 0] 
          } 
        },
        total_matches: { $sum: 1 },
        average_rank: { $avg: '$rank' },
        average_score: { $avg: '$total_score' },
        average_kills: { $avg: '$kills' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user_id: '$_id',
        username: '$user.username',
        avatar: '$user.avatar',
        total_score: 1,
        total_kills: 1,
        total_damage: 1,
        total_wins: 1,
        total_matches: 1,
        average_rank: { $round: ['$average_rank', 2] },
        average_score: { $round: ['$average_score', 2] },
        average_kills: { $round: ['$average_kills', 2] },
        win_rate: {
          $cond: [
            { $gt: ['$total_matches', 0] },
            { $multiply: [{ $divide: ['$total_wins', '$total_matches'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { total_score: -1 } },
    { $limit: limit }
  ]);
  
  return topPerformers;
};

// 🔹 INSTANCE METHODS
resultSchema.methods.verify = async function(verifiedBy, notes = '', screenshotUrl = null) {
  const oldStatus = this.status;
  
  this.status = 'verified';
  this.verified_by = verifiedBy;
  this.verified_at = new Date();
  this.verification_level = 'verified';
  
  if (notes) {
    this.admin_notes = notes;
  }
  
  // Add to verification history
  this.verification_history.push({
    status: 'verified',
    verified_by: verifiedBy,
    verified_at: new Date(),
    notes: notes,
    screenshot_url: screenshotUrl,
    verification_method: 'manual'
  });
  
  await this.save();
  
  return {
    success: true,
    old_status: oldStatus,
    new_status: this.status,
    verified_at: this.verified_at
  };
};

resultSchema.methods.reject = async function(rejectedBy, reason = '', notes = '') {
  const oldStatus = this.status;
  
  this.status = 'rejected';
  this.rejected_by = rejectedBy;
  this.rejected_at = new Date();
  this.rejection_reason = reason;
  
  if (notes) {
    this.admin_notes = notes;
  }
  
  // Add to verification history
  this.verification_history.push({
    status: 'rejected',
    verified_by: rejectedBy,
    verified_at: new Date(),
    notes: `${reason} - ${notes}`,
    verification_method: 'manual'
  });
  
  await this.save();
  
  return {
    success: true,
    old_status: oldStatus,
    new_status: this.status,
    rejected_at: this.rejected_at,
    reason: reason
  };
};

resultSchema.methods.dispute = async function(disputedBy, reason = '') {
  this.disputed = true;
  this.disputed_by = disputedBy;
  this.dispute_reason = reason;
  this.status = 'disputed';
  
  // Add to verification history
  this.verification_history.push({
    status: 'disputed',
    verified_by: disputedBy,
    verified_at: new Date(),
    notes: `Disputed: ${reason}`,
    verification_method: 'dispute'
  });
  
  await this.save();
  
  return {
    success: true,
    disputed: true,
    disputed_by: disputedBy,
    reason: reason
  };
};

resultSchema.methods.resolveDispute = async function(resolvedBy, resolution = '', notes = '') {
  if (!this.disputed) {
    throw new Error('Result is not disputed');
  }
  
  this.disputed = false;
  this.dispute_resolved = true;
  this.dispute_resolved_by = resolvedBy;
  this.dispute_resolution = resolution;
  this.status = 'under_review';
  
  if (notes) {
    this.admin_notes = notes;
  }
  
  // Add to verification history
  this.verification_history.push({
    status: 'under_review',
    verified_by: resolvedBy,
    verified_at: new Date(),
    notes: `Dispute resolved: ${resolution} - ${notes}`,
    verification_method: 'admin'
  });
  
  await this.save();
  
  return {
    success: true,
    resolved: true,
    resolved_by: resolvedBy,
    resolution: resolution
  };
};

resultSchema.methods.addScreenshot = async function(screenshotData) {
  const screenshot = {
    url: screenshotData.url,
    upload_time: new Date(),
    verified: false,
    thumbnail_url: screenshotData.thumbnail_url,
    file_size: screenshotData.file_size,
    file_type: screenshotData.file_type
  };
  
  this.screenshots.push(screenshot);
  
  // If first screenshot and no status set, mark as pending
  if (this.screenshots.length === 1 && this.status === 'pending') {
    this.status = 'pending';
  }
  
  await this.save();
  
  return {
    success: true,
    screenshot: screenshot,
    total_screenshots: this.screenshots.length
  };
};

resultSchema.methods.calculateScore = function(scoringSettings) {
  if (!scoringSettings) {
    scoringSettings = {
      kill_points: 10,
      rank_points: { 1: 100, 2: 80, 3: 60, 4: 50, 5: 40, 6: 30, 7: 20, 8: 10, 9: 5, 10: 2 },
      damage_multiplier: 0.01,
      survival_bonus: 5,
      headshot_bonus: 2,
      assist_points: 1,
      revive_points: 3
    };
  }
  
  const scoreDetails = {
    kill_points: (this.kills || 0) * (scoringSettings.kill_points || 10),
    rank_points: scoringSettings.rank_points?.[this.rank?.toString()] || 0,
    damage_points: (this.damage || 0) * (scoringSettings.damage_multiplier || 0.01),
    survival_points: this.survival_time ? (scoringSettings.survival_bonus || 5) : 0,
    headshot_points: (this.headshots || 0) * (scoringSettings.headshot_bonus || 2),
    assist_points: (this.assists || 0) * (scoringSettings.assist_points || 1),
    revive_points: (this.revives || 0) * (scoringSettings.revive_points || 3),
    bonus_points: 0,
    penalty_points: 0,
    total_score: 0
  };
  
  scoreDetails.total_score = 
    scoreDetails.kill_points +
    scoreDetails.rank_points +
    scoreDetails.damage_points +
    scoreDetails.survival_points +
    scoreDetails.headshot_points +
    scoreDetails.assist_points +
    scoreDetails.revive_points +
    scoreDetails.bonus_points -
    scoreDetails.penalty_points;
  
  this.score_details = scoreDetails;
  this.total_score = scoreDetails.total_score;
  
  return scoreDetails;
};

resultSchema.methods.toPublicJSON = function() {
  const result = this.toObject();
  
  // Remove sensitive fields
  delete result.ip_address;
  delete result.user_agent;
  delete result.device_info;
  delete result.metadata;
  delete result.admin_notes;
  delete result.verification_history;
  delete result.__v;
  
  // Add formatted fields
  result.formatted_survival_time = this.formatted_survival_time;
  result.kd_ratio = this.kd_ratio;
  result.damage_per_kill = this.damage_per_kill;
  result.headshot_percentage = this.headshot_percentage;
  result.is_verified = this.is_verified;
  result.is_pending = this.is_pending;
  result.is_rejected = this.is_rejected;
  
  return result;
};

// 🔹 PRE-REMOVE MIDDLEWARE
resultSchema.pre('remove', async function(next) {
  try {
    // Remove any related data if needed
    // For example, remove associated prize records
    console.log(`Removing result for user ${this.user_id} from event ${this.event_id}`);
    next();
  } catch (error) {
    next(error);
  }
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
