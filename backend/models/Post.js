// models/Post.js - COMPLETE POST MODEL
const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },

  content: {
    type: String,
    required: [true, 'Post content is required'],
    minlength: [10, 'Content must be at least 10 characters'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },

  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    default: ''
  },

  featured_image: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },

  tags: {
    type: [String],
    default: [],
    index: true
  },

  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'archived', 'rejected'],
    default: 'draft',
    index: true
  },

  is_published: {
    type: Boolean,
    default: false,
    index: true
  },

  is_featured: {
    type: Boolean,
    default: false,
    index: true
  },

  is_pinned: {
    type: Boolean,
    default: false
  },

  featured_until: {
    type: Date
  },

  featured_at: {
    type: Date
  },

  featured_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  allow_comments: {
    type: Boolean,
    default: true
  },

  views: {
    type: Number,
    default: 0
  },

  likes_count: {
    type: Number,
    default: 0
  },

  comments_count: {
    type: Number,
    default: 0
  },

  shares_count: {
    type: Number,
    default: 0
  },

  reading_time: {
    type: Number, // in minutes
    default: 0
  },

  saved_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // SEO fields
  meta_title: {
    type: String,
    maxlength: [70, 'Meta title cannot exceed 70 characters']
  },

  meta_description: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },

  // Reports system
  reports: [{
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'copyright', 'other']
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

  // Moderation
  rejection_reason: {
    type: String
  },

  rejected_at: {
    type: Date
  },

  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // History
  update_history: [{
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    changes: [String],
    old_data: mongoose.Schema.Types.Mixed,
    new_data: mongoose.Schema.Types.Mixed,
    reason: String
  }],

  // Timestamps
  published_at: {
    type: Date
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id'
});

// Virtual populate for likes
postSchema.virtual('likes', {
  ref: 'Like',
  foreignField: 'post',
  localField: '_id'
});

// Indexes
postSchema.index({ title: 'text', content: 'text', excerpt: 'text', tags: 'text' });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, published_at: -1 });
postSchema.index({ is_featured: 1, featured_until: -1 });
postSchema.index({ status: 1, is_published: 1 });
postSchema.index({ views: -1 });
postSchema.index({ likes_count: -1 });
postSchema.index({ createdAt: -1 });

// Middleware
postSchema.pre('save', function(next) {
  // Generate slug from title
  if (this.isModified('title') || !this.slug) {
    const baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true
    });
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  // Set published_at if being published
  if (this.isModified('status') && this.status === 'published' && !this.published_at) {
    this.published_at = new Date();
    this.is_published = true;
  }

  // Calculate reading time (200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.reading_time = Math.ceil(wordCount / 200);
  }

  next();
});

// Static methods
postSchema.statics.getPopularPosts = async function(limit = 10) {
  return this.find({
    status: 'published',
    is_published: true
  })
    .sort({ views: -1, likes_count: -1 })
    .limit(limit)
    .select('title slug excerpt featured_image views likes_count comments_count published_at');
};

postSchema.statics.getRecentPosts = async function(limit = 10) {
  return this.find({
    status: 'published',
    is_published: true
  })
    .sort({ published_at: -1 })
    .limit(limit)
    .select('title slug excerpt featured_image views likes_count published_at');
};

postSchema.statics.getFeaturedPosts = async function(limit = 10) {
  return this.find({
    is_featured: true,
    status: 'published',
    is_published: true,
    featured_until: { $gt: new Date() }
  })
    .sort({ featured_at: -1 })
    .limit(limit)
    .select('title slug excerpt featured_image featured_until');
};

// Instance methods
postSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

postSchema.methods.incrementLikes = async function() {
  this.likes_count += 1;
  return this.save({ validateBeforeSave: false });
};

postSchema.methods.decrementLikes = async function() {
  this.likes_count = Math.max(0, this.likes_count - 1);
  return this.save({ validateBeforeSave: false });
};

postSchema.methods.incrementComments = async function() {
  this.comments_count += 1;
  return this.save({ validateBeforeSave: false });
};

postSchema.methods.decrementComments = async function() {
  this.comments_count = Math.max(0, this.comments_count - 1);
  return this.save({ validateBeforeSave: false });
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
