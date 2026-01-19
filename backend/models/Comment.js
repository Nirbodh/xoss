// models/Comment.js - COMPLETE COMMENT MODEL
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Content
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment must be at least 1 character'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },

  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Post reference
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },

  // Parent comment for replies
  parent_comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'spam', 'deleted'],
    default: 'approved',
    index: true
  },

  // Likes and engagement
  likes_count: {
    type: Number,
    default: 0
  },

  dislikes_count: {
    type: Number,
    default: 0
  },

  // Replies
  replies_count: {
    type: Number,
    default: 0
  },

  // Reports
  reports: [{
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'hate_speech', 'inappropriate', 'other']
    },
    description: String,
    reported_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    }
  }],

  report_count: {
    type: Number,
    default: 0
  },

  // Edited history
  edited: {
    type: Boolean,
    default: false
  },

  edit_history: [{
    content: String,
    edited_at: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],

  // Pinned status
  is_pinned: {
    type: Boolean,
    default: false
  },

  pinned_at: {
    type: Date
  },

  pinned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Metadata
  metadata: {
    ip_address: String,
    user_agent: String,
    device_type: String
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  foreignField: 'parent_comment',
  localField: '_id',
  options: { sort: { createdAt: 1 } }
});

// Virtual for likes
commentSchema.virtual('likes', {
  ref: 'Like',
  foreignField: 'comment',
  localField: '_id'
});

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parent_comment: 1, createdAt: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ likes_count: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ 'reports.status': 1 });

// Middleware
commentSchema.pre('save', function(next) {
  // Auto-approve comments from admins/moderators
  if (this.isNew) {
    // This will be handled by the controller based on user role
    // The controller will set status based on moderation settings
  }
  next();
});

// Static methods
commentSchema.statics.getPostComments = async function(postId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    post: postId,
    parent_comment: null, // Only top-level comments
    status: 'approved'
  })
    .populate('author', 'username avatar')
    .sort({ is_pinned: -1, likes_count: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

commentSchema.statics.getCommentReplies = async function(commentId, limit = 10) {
  return this.find({
    parent_comment: commentId,
    status: 'approved'
  })
    .populate('author', 'username avatar')
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
};

commentSchema.statics.getUserComments = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    author: userId,
    status: { $ne: 'deleted' }
  })
    .populate('post', 'title slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

commentSchema.statics.getReportedComments = async function() {
  return this.find({
    report_count: { $gt: 0 },
    'reports.status': 'pending'
  })
    .populate('author', 'username')
    .populate('post', 'title')
    .sort({ report_count: -1 })
    .lean();
};

// Instance methods
commentSchema.methods.incrementLikes = async function() {
  this.likes_count += 1;
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.decrementLikes = async function() {
  this.likes_count = Math.max(0, this.likes_count - 1);
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.incrementDislikes = async function() {
  this.dislikes_count += 1;
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.decrementDislikes = async function() {
  this.dislikes_count = Math.max(0, this.dislikes_count - 1);
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.incrementReplies = async function() {
  this.replies_count += 1;
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.decrementReplies = async function() {
  this.replies_count = Math.max(0, this.replies_count - 1);
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.addReport = async function(userId, reason, description) {
  if (!this.reports) {
    this.reports = [];
  }
  
  // Check if already reported by this user
  const alreadyReported = this.reports.some(report => 
    report.reported_by.toString() === userId.toString()
  );
  
  if (!alreadyReported) {
    this.reports.push({
      reported_by: userId,
      reason,
      description,
      reported_at: new Date(),
      status: 'pending'
    });
    
    this.report_count += 1;
    
    // Auto-flag if too many reports
    if (this.report_count >= 3 && this.status === 'approved') {
      this.status = 'pending';
    }
    
    return this.save({ validateBeforeSave: false });
  }
  
  return this;
};

commentSchema.methods.editContent = async function(newContent, reason = 'Edited by user') {
  if (!this.edit_history) {
    this.edit_history = [];
  }
  
  // Save current content to history
  this.edit_history.push({
    content: this.content,
    edited_at: new Date(),
    reason
  });
  
  // Update content
  this.content = newContent;
  this.edited = true;
  
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.pinComment = async function(userId) {
  this.is_pinned = true;
  this.pinned_at = new Date();
  this.pinned_by = userId;
  
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.unpinComment = async function() {
  this.is_pinned = false;
  this.pinned_at = null;
  this.pinned_by = null;
  
  return this.save({ validateBeforeSave: false });
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
