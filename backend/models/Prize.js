// models/Prize.js - XOSS Gaming Prize Management System
const mongoose = require('mongoose');

const prizeDistributionSchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: true,
    min: 1,
    index: true
  },
  
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  
  fixed_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  calculated_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  description: {
    type: String,
    default: ''
  }
}, { _id: true });

const prizeWinnerSchema = new mongoose.Schema({
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
  
  avatar: {
    type: String,
    default: ''
  },
  
  rank: {
    type: Number,
    required: true,
    min: 1,
    index: true
  },
  
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
  
  score: {
    type: Number,
    default: 0
  },
  
  prize_amount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  kill_prize: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_prize: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  payment_status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  
  payment_method: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank', 'wallet', 'manual', 'system'],
    default: 'wallet'
  },
  
  transaction_id: {
    type: String,
    default: '',
    index: true
  },
  
  paid_at: {
    type: Date
  },
  
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  payment_details: {
    phone_number: String,
    bank_name: String,
    account_number: String,
    branch: String,
    transaction_ref: String,
    gateway_response: Object
  },
  
  notes: {
    type: String,
    default: ''
  },
  
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true,
  _id: true 
});

const prizeLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'created',
      'calculated',
      'distributed',
      'payment_initiated',
      'payment_completed',
      'payment_failed',
      'updated',
      'refunded',
      'cancelled',
      'disputed'
    ],
    required: true
  },
  
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  details: {
    type: String,
    default: ''
  },
  
  old_value: mongoose.Schema.Types.Mixed,
  
  new_value: mongoose.Schema.Types.Mixed,
  
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  _id: true
});

const prizeSchema = new mongoose.Schema({
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
  
  event_title: {
    type: String,
    required: true,
    trim: true
  },
  
  game: {
    type: String,
    required: true,
    enum: ['Free Fire', 'PUBG Mobile', 'COD Mobile', 'BGMI', 'Other'],
    index: true
  },
  
  // 🔹 PRIZE POOL INFORMATION
  total_prize_pool: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  entry_fee_collected: {
    type: Number,
    default: 0,
    min: 0
  },
  
  platform_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  platform_fee_percentage: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  
  net_prize_pool: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 🔹 PRIZE DISTRIBUTION SETTINGS
  prize_distribution: [prizeDistributionSchema],
  
  kill_prize_enabled: {
    type: Boolean,
    default: true
  },
  
  per_kill_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  max_kill_prize_per_player: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 🔹 WINNERS
  winners: [prizeWinnerSchema],
  
  total_winners: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_prize_distributed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_kill_prize_distributed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 🔹 STATUS & PROCESSING
  status: {
    type: String,
    enum: [
      'pending',           // Prize calculation pending
      'calculated',        // Winners calculated
      'ready',            // Ready for distribution
      'distributing',     // Distribution in progress
      'distributed',      // Fully distributed
      'partially_distributed', // Some winners paid
      'failed',           // Distribution failed
      'cancelled',        // Prize cancelled
      'refunded',         // Prize refunded to participants
      'disputed'          // Prize disputed
    ],
    default: 'pending',
    index: true
  },
  
  calculation_method: {
    type: String,
    enum: ['auto', 'manual', 'hybrid'],
    default: 'auto'
  },
  
  calculated_at: Date,
  
  distribution_started_at: Date,
  
  distribution_completed_at: Date,
  
  // 🔹 REFUND INFORMATION
  refund_required: {
    type: Boolean,
    default: false
  },
  
  refund_reason: {
    type: String,
    default: ''
  },
  
  refund_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  refunded_at: Date,
  
  refunded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 🔹 ADMIN & SYSTEM FIELDS
  calculated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  distributed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verified_at: Date,
  
  admin_notes: {
    type: String,
    default: ''
  },
  
  // 🔹 STATISTICS
  statistics: {
    average_prize_per_winner: {
      type: Number,
      default: 0
    },
    highest_prize: {
      type: Number,
      default: 0
    },
    lowest_prize: {
      type: Number,
      default: 0
    },
    total_participants: {
      type: Number,
      default: 0
    },
    prize_distribution_rate: {
      type: Number,
      default: 0
    },
    payment_success_rate: {
      type: Number,
      default: 0
    }
  },
  
  // 🔹 AUDIT LOG
  logs: [prizeLogSchema],
  
  metadata: {
    type: Object,
    default: {}
  },
  
  // 🔹 TIMESTAMPS
  event_date: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 VIRTUAL FIELDS
prizeSchema.virtual('formatted_total_prize_pool').get(function() {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(this.total_prize_pool);
});

prizeSchema.virtual('formatted_total_prize_distributed').get(function() {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(this.total_prize_distributed);
});

prizeSchema.virtual('remaining_prize').get(function() {
  return this.total_prize_pool - this.total_prize_distributed;
});

prizeSchema.virtual('formatted_remaining_prize').get(function() {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(this.remaining_prize);
});

prizeSchema.virtual('distribution_percentage').get(function() {
  if (this.total_prize_pool === 0) return 0;
  return ((this.total_prize_distributed / this.total_prize_pool) * 100).toFixed(2);
});

prizeSchema.virtual('paid_winners_count').get(function() {
  return this.winners.filter(w => w.payment_status === 'paid').length;
});

prizeSchema.virtual('pending_winners_count').get(function() {
  return this.winners.filter(w => w.payment_status === 'pending').length;
});

prizeSchema.virtual('is_fully_distributed').get(function() {
  return this.status === 'distributed' && this.pending_winners_count === 0;
});

prizeSchema.virtual('is_distribution_in_progress').get(function() {
  return this.status === 'distributing' || this.status === 'partially_distributed';
});

prizeSchema.virtual('can_distribute').get(function() {
  return this.status === 'ready' || this.status === 'partially_distributed';
});

prizeSchema.virtual('event', {
  ref: function() {
    return this.event_type === 'match' ? 'Match' : 'Tournament';
  },
  localField: 'event_id',
  foreignField: '_id',
  justOne: true
});

// 🔹 INDEXES
prizeSchema.index({ event_id: 1, event_type: 1 }, { unique: true });
prizeSchema.index({ status: 1, event_date: -1 });
prizeSchema.index({ game: 1, event_date: -1 });
prizeSchema.index({ 'winners.user_id': 1 });
prizeSchema.index({ 'winners.payment_status': 1 });
prizeSchema.index({ total_prize_pool: -1 });
prizeSchema.index({ calculated_at: -1 });
prizeSchema.index({ event_date: 1 });

// 🔹 MIDDLEWARE
prizeSchema.pre('save', function(next) {
  // Calculate net prize pool
  if (this.total_prize_pool > 0) {
    this.platform_fee = (this.total_prize_pool * this.platform_fee_percentage) / 100;
    this.net_prize_pool = this.total_prize_pool - this.platform_fee;
  }
  
  // Update total winners count
  this.total_winners = this.winners.length;
  
  // Calculate total prize distributed
  this.total_prize_distributed = this.winners.reduce((sum, winner) => {
    return sum + (winner.total_prize || winner.prize_amount || 0);
  }, 0);
  
  // Calculate total kill prize
  this.total_kill_prize_distributed = this.winners.reduce((sum, winner) => {
    return sum + (winner.kill_prize || 0);
  }, 0);
  
  // Update statistics
  if (this.total_winners > 0) {
    this.statistics.average_prize_per_winner = this.total_prize_distributed / this.total_winners;
    this.statistics.highest_prize = Math.max(...this.winners.map(w => w.total_prize || w.prize_amount || 0));
    this.statistics.lowest_prize = Math.min(...this.winners.map(w => w.total_prize || w.prize_amount || 0));
    this.statistics.prize_distribution_rate = (this.paid_winners_count / this.total_winners) * 100;
  }
  
  // Auto-update status based on payment status
  if (this.total_winners > 0) {
    const paidCount = this.paid_winners_count;
    const pendingCount = this.pending_winners_count;
    
    if (paidCount === this.total_winners) {
      this.status = 'distributed';
      this.distribution_completed_at = this.distribution_completed_at || new Date();
    } else if (paidCount > 0 && pendingCount > 0) {
      this.status = 'partially_distributed';
    } else if (paidCount === 0 && this.status === 'ready') {
      this.status = 'ready';
    }
  }
  
  next();
});

// 🔹 STATIC METHODS
prizeSchema.statics.findByEvent = async function(eventId, eventType) {
  return await this.findOne({ 
    event_id: eventId, 
    event_type: eventType 
  }).populate('winners.user_id', 'username avatar email phone');
};

prizeSchema.statics.findByUser = async function(userId, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    status = null,
    payment_status = null,
    start_date = null,
    end_date = null 
  } = options;
  
  let query = { 'winners.user_id': userId };
  
  if (status) {
    query.status = status;
  }
  
  if (payment_status) {
    query['winners.payment_status'] = payment_status;
  }
  
  if (start_date || end_date) {
    query.event_date = {};
    if (start_date) query.event_date.$gte = new Date(start_date);
    if (end_date) query.event_date.$lte = new Date(end_date);
  }
  
  const prizes = await this.find(query)
    .sort({ event_date: -1 })
    .skip(skip)
    .limit(limit);
  
  // Extract user's specific wins from each prize
  const userWins = [];
  
  prizes.forEach(prize => {
    const userWin = prize.winners.find(w => w.user_id.toString() === userId.toString());
    if (userWin) {
      userWins.push({
        prize_id: prize._id,
        event_id: prize.event_id,
        event_type: prize.event_type,
        event_title: prize.event_title,
        game: prize.game,
        event_date: prize.event_date,
        rank: userWin.rank,
        kills: userWin.kills,
        damage: userWin.damage,
        prize_amount: userWin.prize_amount,
        kill_prize: userWin.kill_prize,
        total_prize: userWin.total_prize,
        payment_status: userWin.payment_status,
        payment_method: userWin.payment_method,
        paid_at: userWin.paid_at,
        transaction_id: userWin.transaction_id
      });
    }
  });
  
  return userWins;
};

prizeSchema.statics.getUserStats = async function(userId) {
  const prizes = await this.find({ 'winners.user_id': userId });
  
  const stats = {
    total_wins: 0,
    total_prize_won: 0,
    total_prize_paid: 0,
    total_prize_pending: 0,
    average_prize_per_win: 0,
    highest_prize: 0,
    wins_by_rank: {},
    wins_by_game: {},
    wins_by_month: {}
  };
  
  prizes.forEach(prize => {
    const userWin = prize.winners.find(w => w.user_id.toString() === userId.toString());
    if (userWin) {
      stats.total_wins++;
      stats.total_prize_won += userWin.total_prize || userWin.prize_amount || 0;
      
      if (userWin.payment_status === 'paid') {
        stats.total_prize_paid += userWin.total_prize || userWin.prize_amount || 0;
      } else {
        stats.total_prize_pending += userWin.total_prize || userWin.prize_amount || 0;
      }
      
      // Update highest prize
      const prizeAmount = userWin.total_prize || userWin.prize_amount || 0;
      if (prizeAmount > stats.highest_prize) {
        stats.highest_prize = prizeAmount;
      }
      
      // Wins by rank
      const rank = userWin.rank || 1;
      stats.wins_by_rank[rank] = (stats.wins_by_rank[rank] || 0) + 1;
      
      // Wins by game
      const game = prize.game;
      stats.wins_by_game[game] = (stats.wins_by_game[game] || 0) + 1;
      
      // Wins by month
      const monthYear = prize.event_date ? 
        `${prize.event_date.getFullYear()}-${(prize.event_date.getMonth() + 1).toString().padStart(2, '0')}` : 
        'unknown';
      stats.wins_by_month[monthYear] = (stats.wins_by_month[monthYear] || 0) + 1;
    }
  });
  
  // Calculate averages
  if (stats.total_wins > 0) {
    stats.average_prize_per_win = stats.total_prize_won / stats.total_wins;
  }
  
  // Calculate payment percentage
  stats.payment_completion_rate = stats.total_prize_won > 0 ? 
    (stats.total_prize_paid / stats.total_prize_won) * 100 : 0;
  
  return stats;
};

prizeSchema.statics.getSystemStats = async function(options = {}) {
  const { start_date = null, end_date = null, game = null } = options;
  
  let match = {};
  
  if (start_date || end_date) {
    match.event_date = {};
    if (start_date) match.event_date.$gte = new Date(start_date);
    if (end_date) match.event_date.$lte = new Date(end_date);
  }
  
  if (game) {
    match.game = game;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total_prizes: { $sum: 1 },
        total_prize_pool: { $sum: '$total_prize_pool' },
        total_prize_distributed: { $sum: '$total_prize_distributed' },
        total_winners: { $sum: '$total_winners' },
        total_paid_winners: {
          $sum: {
            $size: {
              $filter: {
                input: '$winners',
                as: 'winner',
                cond: { $eq: ['$$winner.payment_status', 'paid'] }
              }
            }
          }
        },
        total_pending_winners: {
          $sum: {
            $size: {
              $filter: {
                input: '$winners',
                as: 'winner',
                cond: { $eq: ['$$winner.payment_status', 'pending'] }
              }
            }
          }
        },
        average_prize_per_event: { $avg: '$total_prize_pool' },
        highest_prize_pool: { $max: '$total_prize_pool' }
      }
    },
    {
      $lookup: {
        from: 'matches',
        localField: 'event_id',
        foreignField: '_id',
        as: 'match_details'
      }
    },
    {
      $lookup: {
        from: 'tournaments',
        localField: 'event_id',
        foreignField: '_id',
        as: 'tournament_details'
      }
    }
  ]);
  
  const result = stats[0] || {
    total_prizes: 0,
    total_prize_pool: 0,
    total_prize_distributed: 0,
    total_winners: 0,
    total_paid_winners: 0,
    total_pending_winners: 0,
    average_prize_per_event: 0,
    highest_prize_pool: 0
  };
  
  // Calculate percentages
  result.distribution_rate = result.total_prize_pool > 0 ? 
    (result.total_prize_distributed / result.total_prize_pool) * 100 : 0;
  
  result.payment_rate = result.total_winners > 0 ? 
    (result.total_paid_winners / result.total_winners) * 100 : 0;
  
  result.average_prize_per_winner = result.total_winners > 0 ? 
    result.total_prize_distributed / result.total_winners : 0;
  
  return result;
};

prizeSchema.statics.calculatePrizeDistribution = function(totalPrizePool, distributionRules, killPrizeEnabled = false, perKillAmount = 0) {
  const distribution = [];
  let remainingPercentage = 100;
  let remainingAmount = totalPrizePool;
  
  // Sort rules by rank
  const sortedRules = [...distributionRules].sort((a, b) => a.rank - b.rank);
  
  // Calculate prize for each rank
  sortedRules.forEach((rule, index) => {
    let prizeAmount = 0;
    
    if (rule.fixed_amount > 0) {
      prizeAmount = rule.fixed_amount;
    } else if (rule.percentage > 0) {
      prizeAmount = (totalPrizePool * rule.percentage) / 100;
    }
    
    // Ensure we don't exceed remaining amount
    if (prizeAmount > remainingAmount && index === sortedRules.length - 1) {
      prizeAmount = remainingAmount;
    } else if (prizeAmount > remainingAmount) {
      prizeAmount = remainingAmount * 0.8; // Adjust for last prize
    }
    
    remainingAmount -= prizeAmount;
    remainingPercentage -= rule.percentage || 0;
    
    distribution.push({
      rank: rule.rank,
      percentage: rule.percentage || 0,
      fixed_amount: rule.fixed_amount || 0,
      calculated_amount: prizeAmount,
      description: rule.description || `Rank ${rule.rank} Prize`
    });
  });
  
  // Distribute any remaining amount to top ranks
  if (remainingAmount > 0 && distribution.length > 0) {
    const topPrize = distribution[0];
    topPrize.calculated_amount += remainingAmount;
    remainingAmount = 0;
  }
  
  return {
    distribution,
    total_prize_pool: totalPrizePool,
    total_distributed: totalPrizePool - remainingAmount,
    remaining_amount: remainingAmount,
    kill_prize_enabled: killPrizeEnabled,
    per_kill_amount: perKillAmount
  };
};

// 🔹 INSTANCE METHODS
prizeSchema.methods.addWinner = function(winnerData) {
  const winner = {
    user_id: winnerData.user_id,
    username: winnerData.username,
    avatar: winnerData.avatar || '',
    rank: winnerData.rank,
    kills: winnerData.kills || 0,
    damage: winnerData.damage || 0,
    score: winnerData.score || 0,
    prize_amount: winnerData.prize_amount || 0,
    kill_prize: winnerData.kill_prize || 0,
    total_prize: (winnerData.prize_amount || 0) + (winnerData.kill_prize || 0),
    payment_status: 'pending',
    payment_method: 'wallet',
    metadata: winnerData.metadata || {}
  };
  
  this.winners.push(winner);
  
  // Add log
  this.logs.push({
    action: 'created',
    details: `Added winner: ${winnerData.username} (Rank ${winnerData.rank})`,
    metadata: { winner_id: winnerData.user_id, rank: winnerData.rank }
  });
  
  return winner;
};

prizeSchema.methods.updateWinnerPayment = async function(winnerId, paymentData) {
  const winnerIndex = this.winners.findIndex(w => 
    w.user_id.toString() === winnerId.toString()
  );
  
  if (winnerIndex === -1) {
    throw new Error('Winner not found');
  }
  
  const winner = this.winners[winnerIndex];
  const oldStatus = winner.payment_status;
  
  // Update payment details
  winner.payment_status = paymentData.status || 'paid';
  winner.payment_method = paymentData.payment_method || winner.payment_method;
  winner.transaction_id = paymentData.transaction_id || winner.transaction_id;
  winner.paid_at = paymentData.paid_at || new Date();
  winner.paid_by = paymentData.paid_by;
  winner.notes = paymentData.notes || winner.notes;
  
  if (paymentData.payment_details) {
    winner.payment_details = {
      ...winner.payment_details,
      ...paymentData.payment_details
    };
  }
  
  // Add log
  this.logs.push({
    action: paymentData.status === 'paid' ? 'payment_completed' : 'payment_failed',
    performed_by: paymentData.paid_by,
    details: `Payment ${paymentData.status} for ${winner.username}: ${winner.total_prize}`,
    old_value: oldStatus,
    new_value: winner.payment_status,
    metadata: {
      winner_id: winnerId,
      transaction_id: paymentData.transaction_id,
      amount: winner.total_prize
    }
  });
  
  // If all winners are paid, update status
  const allPaid = this.winners.every(w => w.payment_status === 'paid');
  if (allPaid) {
    this.status = 'distributed';
    this.distribution_completed_at = new Date();
    this.distributed_by = paymentData.paid_by;
    
    this.logs.push({
      action: 'distributed',
      performed_by: paymentData.paid_by,
      details: 'All prizes distributed successfully',
      metadata: { total_winners: this.winners.length, total_amount: this.total_prize_distributed }
    });
  } else if (this.status === 'ready' && winner.payment_status === 'paid') {
    this.status = 'partially_distributed';
    this.distribution_started_at = this.distribution_started_at || new Date();
  }
  
  await this.save();
  
  return {
    success: true,
    winner: winner,
    old_status: oldStatus,
    new_status: winner.payment_status
  };
};

prizeSchema.methods.calculateKillPrize = function() {
  if (!this.kill_prize_enabled || this.per_kill_amount <= 0) {
    return {
      success: true,
      total_kill_prize: 0,
      updated_winners: 0
    };
  }
  
  let totalKillPrize = 0;
  let updatedCount = 0;
  
  this.winners.forEach(winner => {
    const kills = winner.kills || 0;
    let killPrize = kills * this.per_kill_amount;
    
    // Apply max limit if set
    if (this.max_kill_prize_per_player > 0 && killPrize > this.max_kill_prize_per_player) {
      killPrize = this.max_kill_prize_per_player;
    }
    
    winner.kill_prize = killPrize;
    winner.total_prize = (winner.prize_amount || 0) + killPrize;
    totalKillPrize += killPrize;
    updatedCount++;
  });
  
  // Add log
  this.logs.push({
    action: 'updated',
    details: `Calculated kill prize: ${totalKillPrize} for ${updatedCount} winners`,
    metadata: {
      per_kill_amount: this.per_kill_amount,
      max_per_player: this.max_kill_prize_per_player,
      total_kill_prize: totalKillPrize
    }
  });
  
  return {
    success: true,
    total_kill_prize: totalKillPrize,
    updated_winners: updatedCount
  };
};

prizeSchema.methods.initiateRefund = async function(refundData) {
  if (this.status === 'distributed') {
    throw new Error('Cannot refund distributed prizes');
  }
  
  this.refund_required = true;
  this.refund_reason = refundData.reason || '';
  this.refund_amount = refundData.amount || this.entry_fee_collected;
  this.status = 'refunded';
  this.refunded_at = new Date();
  this.refunded_by = refundData.refunded_by;
  
  // Add log
  this.logs.push({
    action: 'refunded',
    performed_by: refundData.refunded_by,
    details: `Prize refunded: ${refundData.reason}`,
    old_value: this.status,
    new_value: 'refunded',
    metadata: {
      refund_amount: this.refund_amount,
      refund_reason: refundData.reason
    }
  });
  
  await this.save();
  
  return {
    success: true,
    refund_amount: this.refund_amount,
    refund_reason: this.refund_reason,
    refunded_at: this.refunded_at
  };
};

prizeSchema.methods.getDistributionReport = function() {
  const report = {
    prize_id: this._id,
    event_id: this.event_id,
    event_type: this.event_type,
    event_title: this.event_title,
    game: this.game,
    event_date: this.event_date,
    status: this.status,
    total_prize_pool: this.total_prize_pool,
    total_prize_distributed: this.total_prize_distributed,
    total_winners: this.total_winners,
    distribution_summary: {
      paid_winners: this.paid_winners_count,
      pending_winners: this.pending_winners_count,
      failed_winners: this.winners.filter(w => w.payment_status === 'failed').length,
      distribution_rate: this.distribution_percentage,
      payment_rate: this.total_winners > 0 ? 
        (this.paid_winners_count / this.total_winners) * 100 : 0
    },
    winners_by_rank: {},
    prize_by_rank: {},
    timeline: this.logs.map(log => ({
      action: log.action,
      timestamp: log.createdAt,
      performed_by: log.performed_by,
      details: log.details
    }))
  };
  
  // Group winners by rank
  this.winners.forEach(winner => {
    const rank = winner.rank;
    
    if (!report.winners_by_rank[rank]) {
      report.winners_by_rank[rank] = {
        count: 0,
        total_prize: 0,
        average_prize: 0,
        winners: []
      };
    }
    
    report.winners_by_rank[rank].count++;
    report.winners_by_rank[rank].total_prize += winner.total_prize;
    report.winners_by_rank[rank].winners.push({
      user_id: winner.user_id,
      username: winner.username,
      prize_amount: winner.prize_amount,
      kill_prize: winner.kill_prize,
      total_prize: winner.total_prize,
      payment_status: winner.payment_status
    });
    
    // Calculate averages
    report.winners_by_rank[rank].average_prize = 
      report.winners_by_rank[rank].total_prize / report.winners_by_rank[rank].count;
    
    // Prize by rank
    report.prize_by_rank[rank] = winner.total_prize;
  });
  
  return report;
};

prizeSchema.methods.toPublicJSON = function() {
  const prize = this.toObject();
  
  // Remove sensitive/admin fields
  delete prize.logs;
  delete prize.admin_notes;
  delete prize.metadata;
  delete prize.__v;
  delete prize.updatedAt;
  
  // Add formatted values
  prize.formatted_total_prize_pool = this.formatted_total_prize_pool;
  prize.formatted_total_prize_distributed = this.formatted_total_prize_distributed;
  prize.distribution_percentage = this.distribution_percentage;
  prize.is_fully_distributed = this.is_fully_distributed;
  prize.paid_winners_count = this.paid_winners_count;
  prize.pending_winners_count = this.pending_winners_count;
  
  // Anonymize winners if needed
  if (prize.winners) {
    prize.winners = prize.winners.map(winner => ({
      rank: winner.rank,
      username: winner.username,
      avatar: winner.avatar,
      kills: winner.kills,
      damage: winner.damage,
      prize_amount: winner.prize_amount,
      total_prize: winner.total_prize,
      payment_status: winner.payment_status
      // Remove sensitive payment details
    }));
  }
  
  return prize;
};

// 🔹 PRE-REMOVE MIDDLEWARE
prizeSchema.pre('remove', async function(next) {
  try {
    // Log the deletion
    console.log(`Removing prize for event ${this.event_id} (${this.event_type})`);
    
    // In production, you might want to archive instead of delete
    // Or notify admins about the deletion
    
    next();
  } catch (error) {
    next(error);
  }
});

const Prize = mongoose.model('Prize', prizeSchema);

module.exports = Prize;
