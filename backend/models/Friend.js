// models/Friend.js - XOSS Gaming Friendship Management
const mongoose = require('mongoose');

const friendshipActivitySchema = new mongoose.Schema({
  activity_type: {
    type: String,
    enum: [
      'friend_request_sent',
      'friend_request_accepted',
      'friend_request_rejected',
      'friend_request_cancelled',
      'friend_removed',
      'match_played_together',
      'tournament_joined_together',
      'chat_message_exchanged',
      'gift_sent',
      'achievement_shared'
    ],
    required: true
  },
  
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'activity_metadata.event_model'
  },
  
  activity_metadata: {
    event_model: {
      type: String,
      enum: ['Match', 'Tournament', 'Chat', 'Gift', 'Achievement']
    },
    details: {
      type: String,
      default: ''
    },
    score_change: {
      type: Number,
      default: 0
    },
    result: {
      type: String,
      enum: ['win', 'loss', 'draw', 'completed', 'cancelled'],
      default: 'completed'
    }
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { _id: true });

const friendshipStatsSchema = new mongoose.Schema({
  total_matches_together: {
    type: Number,
    default: 0,
    min: 0
  },
  
  matches_won_together: {
    type: Number,
    default: 0,
    min: 0
  },
  
  matches_lost_together: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_tournaments_together: {
    type: Number,
    default: 0,
    min: 0
  },
  
  tournaments_won_together: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total_chat_messages: {
    type: Number,
    default: 0,
    min: 0
  },
  
  last_chat_timestamp: Date,
  
  total_gifts_exchanged: {
    type: Number,
    default: 0,
    min: 0
  },
  
  friendship_score: {
    type: Number,
    default: 100,
    min: 0,
    max: 1000
  },
  
  friendship_level: {
    type: String,
    enum: ['new', 'acquaintance', 'regular', 'close', 'best_friend', 'legendary'],
    default: 'new'
  },
  
  favorite_game_together: {
    type: String,
    default: ''
  },
  
  win_rate_together: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { _id: false });

const friendshipSettingsSchema = new mongoose.Schema({
  notifications_enabled: {
    type: Boolean,
    default: true
  },
  
  show_online_status: {
    type: Boolean,
    default: true
  },
  
  allow_match_invites: {
    type: Boolean,
    default: true
  },
  
  allow_tournament_invites: {
    type: Boolean,
    default: true
  },
  
  allow_team_invites: {
    type: Boolean,
    default: true
  },
  
  share_stats: {
    type: Boolean,
    default: true
  },
  
  favorite_friend: {
    type: Boolean,
    default: false
  },
  
  notification_sound: {
    type: String,
    default: 'default'
  },
  
  mute_chat: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const friendshipSchema = new mongoose.Schema({
  // 🔹 RELATIONSHIP INFORMATION
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  friend_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 🔹 FRIENDSHIP STATUS
  status: {
    type: String,
    enum: [
      'pending',      // Friend request sent
      'active',       // Friends
      'blocked',      // Blocked by user
      'blocked_by',   // Blocked by friend
      'removed',      // Friend removed
      'inactive',     // Inactive friendship
      'restricted'    // Restricted access
    ],
    default: 'pending',
    index: true
  },
  
  initiated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 🔹 TIMESTAMPS
  request_sent_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  accepted_at: Date,
  
  rejected_at: Date,
  
  blocked_at: Date,
  
  removed_at: Date,
  
  last_interaction: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // 🔹 FRIENDSHIP METRICS
  friendship_duration_days: {
    type: Number,
    default: 0,
    min: 0
  },
  
  interactions_count: {
    type: Number,
    default: 0,
    min: 0
  },
  
  streak_days: {
    type: Number,
    default: 0,
    min: 0
  },
  
  last_streak_date: Date,
  
  // 🔹 STATISTICS
  stats: {
    type: friendshipStatsSchema,
    default: () => ({})
  },
  
  // 🔹 SETTINGS
  settings: {
    type: friendshipSettingsSchema,
    default: () => ({})
  },
  
  // 🔹 ACTIVITY HISTORY
  activities: [friendshipActivitySchema],
  
  // 🔹 TAGS & CATEGORIES
  tags: [{
    type: String,
    enum: [
      'gaming_buddy',
      'tournament_partner',
      'chat_friend',
      'gift_exchanger',
      'competitive',
      'casual',
      'team_player',
      'strategist',
      'communicator'
    ]
  }],
  
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  
  nickname: {
    type: String,
    default: '',
    maxlength: 50
  },
  
  // 🔹 PRIVACY & VISIBILITY
  visible_in_friend_list: {
    type: Boolean,
    default: true
  },
  
  show_in_mutual_friends: {
    type: Boolean,
    default: true
  },
  
  // 🔹 METADATA
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 COMPOUND INDEX
friendshipSchema.index({ user_id: 1, friend_id: 1 }, { unique: true });
friendshipSchema.index({ status: 1, last_interaction: -1 });
friendshipSchema.index({ 'stats.friendship_score': -1 });
friendshipSchema.index({ user_id: 1, 'settings.favorite_friend': -1 });

// 🔹 VIRTUAL FIELDS
friendshipSchema.virtual('is_active').get(function() {
  return this.status === 'active';
});

friendshipSchema.virtual('is_pending').get(function() {
  return this.status === 'pending';
});

friendshipSchema.virtual('is_blocked').get(function() {
  return this.status === 'blocked' || this.status === 'blocked_by';
});

friendshipSchema.virtual('can_interact').get(function() {
  return this.status === 'active' && !this.settings.mute_chat;
});

friendshipSchema.virtual('friendship_age').get(function() {
  if (!this.accepted_at) return 0;
  const diffTime = Math.abs(new Date() - new Date(this.accepted_at));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

friendshipSchema.virtual('interaction_frequency').get(function() {
  if (this.friendship_age === 0 || this.interactions_count === 0) return 0;
  return this.interactions_count / this.friendship_age;
});

friendshipSchema.virtual('match_win_percentage').get(function() {
  if (this.stats.total_matches_together === 0) return 0;
  return (this.stats.matches_won_together / this.stats.total_matches_together) * 100;
});

friendshipSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

friendshipSchema.virtual('friend', {
  ref: 'User',
  localField: 'friend_id',
  foreignField: '_id',
  justOne: true
});

// 🔹 MIDDLEWARE
friendshipSchema.pre('save', function(next) {
  // Update friendship duration
  if (this.accepted_at) {
    const diffTime = Math.abs(new Date() - new Date(this.accepted_at));
    this.friendship_duration_days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Update win rate
  if (this.stats.total_matches_together > 0) {
    this.stats.win_rate_together = (this.stats.matches_won_together / this.stats.total_matches_together) * 100;
  }
  
  // Update friendship level based on score
  const score = this.stats.friendship_score || 100;
  if (score >= 800) {
    this.stats.friendship_level = 'legendary';
  } else if (score >= 600) {
    this.stats.friendship_level = 'best_friend';
  } else if (score >= 400) {
    this.stats.friendship_level = 'close';
  } else if (score >= 200) {
    this.stats.friendship_level = 'regular';
  } else if (score >= 100) {
    this.stats.friendship_level = 'acquaintance';
  } else {
    this.stats.friendship_level = 'new';
  }
  
  // Update last interaction if there are new activities
  if (this.activities && this.activities.length > 0) {
    const latestActivity = this.activities[this.activities.length - 1];
    this.last_interaction = latestActivity.timestamp;
    this.interactions_count = this.activities.length;
  }
  
  next();
});

// 🔹 STATIC METHODS
friendshipSchema.statics.findFriendship = async function(userId, friendId) {
  return await this.findOne({
    $or: [
      { user_id: userId, friend_id: friendId },
      { user_id: friendId, friend_id: userId }
    ]
  })
    .populate('user_id', 'username avatar')
    .populate('friend_id', 'username avatar');
};

friendshipSchema.statics.findActiveFriendships = async function(userId, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    sort = { 'stats.friendship_score': -1 },
    includeUserDetails = true 
  } = options;
  
  let query = this.find({
    user_id: userId,
    status: 'active'
  });
  
  if (includeUserDetails) {
    query = query.populate('friend_id', 'username avatar stats.level gaming.favorite_game metadata.last_active');
  }
  
  return await query
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

friendshipSchema.statics.findPendingRequests = async function(userId, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    direction = 'received' // 'received' or 'sent'
  } = options;
  
  const query = direction === 'received' ? 
    { friend_id: userId, status: 'pending' } :
    { user_id: userId, status: 'pending' };
  
  const populateField = direction === 'received' ? 'user_id' : 'friend_id';
  
  return await this.find(query)
    .populate(populateField, 'username avatar stats.level created_at')
    .sort({ request_sent_at: -1 })
    .skip(skip)
    .limit(limit);
};

friendshipSchema.statics.getMutualFriends = async function(userId1, userId2) {
  // Get friends of user1
  const user1Friendships = await this.find({
    user_id: userId1,
    status: 'active'
  }).select('friend_id');
  
  const user1FriendIds = user1Friendships.map(f => f.friend_id);
  
  // Get friends of user2
  const user2Friendships = await this.find({
    user_id: userId2,
    status: 'active'
  }).select('friend_id');
  
  const user2FriendIds = user2Friendships.map(f => f.friend_id);
  
  // Find intersection
  const mutualFriendIds = user1FriendIds.filter(id => 
    user2FriendIds.some(friendId => friendId.equals(id))
  );
  
  // Get mutual friends details
  if (mutualFriendIds.length > 0) {
    const User = require('./User');
    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds }
    })
      .select('username avatar stats.level')
      .lean();
    
    return mutualFriends;
  }
  
  return [];
};

friendshipSchema.statics.getFriendshipStatistics = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { user_id: mongoose.Types.ObjectId(userId) },
          { friend_id: mongoose.Types.ObjectId(userId) }
        ],
        status: 'active'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_details'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'friend_id',
        foreignField: '_id',
        as: 'friend_details'
      }
    },
    {
      $addFields: {
        friend_info: {
          $cond: [
            { $eq: ['$user_id', mongoose.Types.ObjectId(userId)] },
            { $arrayElemAt: ['$friend_details', 0] },
            { $arrayElemAt: ['$user_details', 0] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        total_friends: { $sum: 1 },
        average_friendship_score: { $avg: '$stats.friendship_score' },
        total_matches_together: { $sum: '$stats.total_matches_together' },
        total_tournaments_together: { $sum: '$stats.total_tournaments_together' },
        online_friends: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$friend_info.metadata.last_active', null] },
                  {
                    $gt: [
                      '$friend_info.metadata.last_active',
                      new Date(Date.now() - 5 * 60 * 1000)
                    ]
                  }
                ]
              },
              1,
              0
            ]
          }
        },
        friends_by_level: {
          $push: {
            level: '$friend_info.stats.level.current',
            username: '$friend_info.username'
          }
        },
        favorite_games: {
          $push: '$friend_info.gaming.favorite_game'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total_friends: 0,
      average_friendship_score: 100,
      total_matches_together: 0,
      total_tournaments_together: 0,
      online_friends: 0,
      friends_by_level: {},
      favorite_games: {}
    };
  }
  
  const stat = stats[0];
  
  // Calculate level distribution
  const levelDistribution = {};
  stat.friends_by_level.forEach(friend => {
    const levelRange = Math.floor(friend.level / 10) * 10;
    levelDistribution[levelRange] = (levelDistribution[levelRange] || 0) + 1;
  });
  
  // Calculate game distribution
  const gameDistribution = {};
  stat.favorite_games.forEach(game => {
    if (game) {
      gameDistribution[game] = (gameDistribution[game] || 0) + 1;
    }
  });
  
  return {
    total_friends: stat.total_friends,
    average_friendship_score: stat.average_friendship_score.toFixed(2),
    total_matches_together: stat.total_matches_together,
    total_tournaments_together: stat.total_tournaments_together,
    online_friends: stat.online_friends,
    online_percentage: stat.total_friends > 0 ? 
      (stat.online_friends / stat.total_friends) * 100 : 0,
    level_distribution: levelDistribution,
    game_distribution: gameDistribution,
    most_common_game: Object.entries(gameDistribution)
      .sort((a, b) => b[1] - a[1])[0] || ['None', 0]
  };
};

friendshipSchema.statics.calculateFriendshipScore = function(activities) {
  let score = 100; // Base score
  
  if (!activities || activities.length === 0) {
    return score;
  }
  
  activities.forEach(activity => {
    switch (activity.activity_type) {
      case 'friend_request_accepted':
        score += 50;
        break;
      case 'match_played_together':
        score += activity.activity_metadata.result === 'win' ? 20 : 10;
        break;
      case 'tournament_joined_together':
        score += activity.activity_metadata.result === 'win' ? 30 : 15;
        break;
      case 'chat_message_exchanged':
        score += 5;
        break;
      case 'gift_sent':
        score += 25;
        break;
      case 'friend_removed':
        score = Math.max(0, score - 100);
        break;
      case 'friend_request_rejected':
        score = Math.max(0, score - 50);
        break;
    }
    
    // Add any score change from metadata
    if (activity.activity_metadata.score_change) {
      score += activity.activity_metadata.score_change;
    }
  });
  
  // Cap score between 0 and 1000
  return Math.max(0, Math.min(1000, score));
};

// 🔹 INSTANCE METHODS
friendshipSchema.methods.addActivity = function(activityData) {
  const activity = {
    activity_type: activityData.activity_type,
    event_id: activityData.event_id,
    activity_metadata: activityData.activity_metadata || {},
    timestamp: activityData.timestamp || new Date()
  };
  
  this.activities.push(activity);
  
  // Update stats based on activity
  this.updateStatsFromActivity(activity);
  
  // Update friendship score
  this.stats.friendship_score = this.constructor.calculateFriendshipScore(this.activities);
  
  return activity;
};

friendshipSchema.methods.updateStatsFromActivity = function(activity) {
  switch (activity.activity_type) {
    case 'match_played_together':
      this.stats.total_matches_together += 1;
      if (activity.activity_metadata.result === 'win') {
        this.stats.matches_won_together += 1;
      } else if (activity.activity_metadata.result === 'loss') {
        this.stats.matches_lost_together += 1;
      }
      
      // Update favorite game
      if (activity.activity_metadata.details && activity.activity_metadata.details.includes('Free Fire')) {
        this.stats.favorite_game_together = 'Free Fire';
      } else if (activity.activity_metadata.details && activity.activity_metadata.details.includes('PUBG')) {
        this.stats.favorite_game_together = 'PUBG Mobile';
      }
      break;
      
    case 'tournament_joined_together':
      this.stats.total_tournaments_together += 1;
      if (activity.activity_metadata.result === 'win') {
        this.stats.tournaments_won_together += 1;
      }
      break;
      
    case 'chat_message_exchanged':
      this.stats.total_chat_messages += 1;
      this.stats.last_chat_timestamp = activity.timestamp;
      break;
      
    case 'gift_sent':
      this.stats.total_gifts_exchanged += 1;
      break;
  }
};

friendshipSchema.methods.acceptRequest = async function(acceptedBy) {
  if (this.status !== 'pending') {
    throw new Error('Cannot accept non-pending friendship request');
  }
  
  this.status = 'active';
  this.accepted_at = new Date();
  
  // Add acceptance activity
  this.addActivity({
    activity_type: 'friend_request_accepted',
    activity_metadata: {
      accepted_by: acceptedBy
    }
  });
  
  await this.save();
  
  return {
    success: true,
    friendship: this,
    accepted_at: this.accepted_at
  };
};

friendshipSchema.methods.rejectRequest = async function(rejectedBy, reason = '') {
  if (this.status !== 'pending') {
    throw new Error('Cannot reject non-pending friendship request');
  }
  
  this.status = 'removed';
  this.rejected_at = new Date();
  
  // Add rejection activity
  this.addActivity({
    activity_type: 'friend_request_rejected',
    activity_metadata: {
      rejected_by: rejectedBy,
      reason: reason
    }
  });
  
  await this.save();
  
  return {
    success: true,
    friendship: this,
    rejected_at: this.rejected_at
  };
};

friendshipSchema.methods.removeFriend = async function(removedBy, reason = '') {
  if (this.status !== 'active') {
    throw new Error('Cannot remove non-active friend');
  }
  
  const oldStatus = this.status;
  this.status = 'removed';
  this.removed_at = new Date();
  
  // Add removal activity
  this.addActivity({
    activity_type: 'friend_removed',
    activity_metadata: {
      removed_by: removedBy,
      reason: reason
    }
  });
  
  await this.save();
  
  return {
    success: true,
    old_status: oldStatus,
    new_status: this.status,
    removed_at: this.removed_at,
    friendship_duration: this.friendship_duration_days
  };
};

friendshipSchema.methods.blockFriend = async function(blockedBy, reason = '') {
  const oldStatus = this.status;
  this.status = 'blocked';
  this.blocked_at = new Date();
  
  // Add block activity
  this.addActivity({
    activity_type: 'friend_removed', // Using removed for block
    activity_metadata: {
      blocked_by: blockedBy,
      reason: reason,
      action: 'block'
    }
  });
  
  await this.save();
  
  return {
    success: true,
    old_status: oldStatus,
    new_status: this.status,
    blocked_at: this.blocked_at
  };
};

friendshipSchema.methods.updateSettings = async function(settings) {
  const oldSettings = { ...this.settings };
  
  this.settings = {
    ...this.settings,
    ...settings
  };
  
  await this.save();
  
  return {
    success: true,
    old_settings: oldSettings,
    new_settings: this.settings
  };
};

friendshipSchema.methods.updateTags = async function(tags) {
  this.tags = [...new Set(tags)]; // Remove duplicates
  
  await this.save();
  
  return {
    success: true,
    tags: this.tags
  };
};

friendshipSchema.methods.getFriendshipSummary = function() {
  return {
    friendship_id: this._id,
    user_id: this.user_id,
    friend_id: this.friend_id,
    status: this.status,
    friendship_duration_days: this.friendship_duration_days,
    friendship_level: this.stats.friendship_level,
    friendship_score: this.stats.friendship_score,
    stats: {
      matches_together: this.stats.total_matches_together,
      matches_won_together: this.stats.matches_won_together,
      win_rate_together: this.stats.win_rate_together,
      tournaments_together: this.stats.total_tournaments_together,
      chat_messages: this.stats.total_chat_messages,
      gifts_exchanged: this.stats.total_gifts_exchanged
    },
    settings: this.settings,
    tags: this.tags,
    last_interaction: this.last_interaction,
    is_active: this.is_active,
    can_interact: this.can_interact
  };
};

friendshipSchema.methods.toPublicJSON = function() {
  const friendship = this.toObject();
  
  // Remove sensitive/internal fields
  delete friendship.activities;
  delete friendship.metadata;
  delete friendship.__v;
  delete friendship.updatedAt;
  
  // Add calculated fields
  friendship.is_active = this.is_active;
  friendship.can_interact = this.can_interact;
  friendship.friendship_age = this.friendship_age;
  friendship.match_win_percentage = this.match_win_percentage;
  
  return friendship;
};

// 🔹 PRE-REMOVE MIDDLEWARE
friendshipSchema.pre('remove', async function(next) {
  try {
    console.log(`Removing friendship between ${this.user_id} and ${this.friend_id}`);
    
    // In production, you might want to:
    // 1. Archive the friendship instead of deleting
    // 2. Notify the other user
    // 3. Update user friend counts
    
    next();
  } catch (error) {
    next(error);
  }
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
