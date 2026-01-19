// models/Like.js - COMPLETE LIKE MODEL
const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  // User who liked
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Target of the like
  target_type: {
    type: String,
    enum: ['post', 'comment', 'media'],
    required: true,
    index: true
  },

  // Target ID
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Reference fields based on target_type
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    index: true
  },

  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  },

  media: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    index: true
  },

  // Like type (like, love, etc.)
  like_type: {
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    default: 'like'
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active'
  },

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },

  updated_at: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// Compound indexes for uniqueness and fast queries
likeSchema.index({ user: 1, target_type: 1, target_id: 1 }, { unique: true });
likeSchema.index({ target_type: 1, target_id: 1, created_at: -1 });
likeSchema.index({ user: 1, created_at: -1 });

// Middleware to set reference fields
likeSchema.pre('save', function(next) {
  // Set the appropriate reference field based on target_type
  switch (this.target_type) {
    case 'post':
      this.post = this.target_id;
      break;
    case 'comment':
      this.comment = this.target_id;
      break;
    case 'media':
      this.media = this.target_id;
      break;
  }
  
  this.updated_at = new Date();
  next();
});

// Static methods
likeSchema.statics.getPostLikes = async function(postId, limit = 50) {
  return this.find({
    target_type: 'post',
    target_id: postId,
    status: 'active'
  })
    .populate('user', 'username avatar')
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
};

likeSchema.statics.getCommentLikes = async function(commentId, limit = 30) {
  return this.find({
    target_type: 'comment',
    target_id: commentId,
    status: 'active'
  })
    .populate('user', 'username avatar')
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
};

likeSchema.statics.getMediaLikes = async function(mediaId, limit = 30) {
  return this.find({
    target_type: 'media',
    target_id: mediaId,
    status: 'active'
  })
    .populate('user', 'username avatar')
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
};

likeSchema.statics.getUserLikes = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    user: userId,
    status: 'active'
  })
    .populate('post', 'title slug featured_image')
    .populate('comment', 'content')
    .populate('media', 'title thumbnail_url')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

likeSchema.statics.checkUserLike = async function(userId, targetType, targetId) {
  return this.findOne({
    user: userId,
    target_type: targetType,
    target_id: targetId,
    status: 'active'
  }).lean();
};

likeSchema.statics.getLikeCount = async function(targetType, targetId) {
  return this.countDocuments({
    target_type: targetType,
    target_id: targetId,
    status: 'active'
  });
};

likeSchema.statics.getLikeStats = async function(targetType, targetId) {
  const stats = await this.aggregate([
    {
      $match: {
        target_type: targetType,
        target_id: new mongoose.Types.ObjectId(targetId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$like_type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Instance methods
likeSchema.methods.removeLike = async function() {
  this.status = 'removed';
  this.updated_at = new Date();
  return this.save({ validateBeforeSave: false });
};

likeSchema.methods.updateLikeType = async function(newType) {
  this.like_type = newType;
  this.updated_at = new Date();
  return this.save({ validateBeforeSave: false });
};

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
