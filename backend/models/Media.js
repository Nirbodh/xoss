// models/Media.js - COMPLETE MEDIA MODEL
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  // File info
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },

  original_filename: {
    type: String,
    required: true
  },

  file_size: {
    type: Number, // in bytes
    required: true,
    min: [1, 'File size must be at least 1 byte']
  },

  mime_type: {
    type: String,
    required: true
  },

  extension: {
    type: String,
    required: true
  },

  // URLs
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/.*)$/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },

  thumbnail_url: {
    type: String,
    validate: {
      validator: function(v) {
        return v === null || /^(https?:\/\/.*)$/.test(v);
      },
      message: 'Please provide a valid thumbnail URL'
    }
  },

  preview_url: {
    type: String,
    validate: {
      validator: function(v) {
        return v === null || /^(https?:\/\/.*)$/.test(v);
      },
      message: 'Please provide a valid preview URL'
    }
  },

  // Media info
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  alt_text: {
    type: String,
    trim: true,
    maxlength: [200, 'Alt text cannot exceed 200 characters']
  },

  // Media type
  media_type: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'other'],
    required: true,
    index: true
  },

  // Dimensions for images/videos
  width: {
    type: Number
  },

  height: {
    type: Number
  },

  duration: {
    type: Number // in seconds for video/audio
  },

  // Owner
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Visibility
  is_public: {
    type: Boolean,
    default: true,
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'processing', 'failed', 'deleted', 'blocked'],
    default: 'active',
    index: true
  },

  // Categories and tags
  category: {
    type: String,
    default: 'general',
    index: true
  },

  tags: {
    type: [String],
    default: [],
    index: true
  },

  // Usage info
  usage_count: {
    type: Number,
    default: 0
  },

  used_in: [{
    model_type: {
      type: String,
      enum: ['post', 'profile', 'tournament', 'match', 'comment']
    },
    model_id: {
      type: mongoose.Schema.Types.ObjectId
    },
    used_at: {
      type: Date,
      default: Date.now
    }
  }],

  // Likes and views
  likes_count: {
    type: Number,
    default: 0
  },

  views_count: {
    type: Number,
    default: 0
  },

  downloads_count: {
    type: Number,
    default: 0
  },

  // Storage info
  storage_provider: {
    type: String,
    enum: ['cloudinary', 's3', 'local', 'other'],
    default: 'cloudinary'
  },

  storage_path: {
    type: String
  },

  public_id: {
    type: String // Cloudinary public ID
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Processing info
  processing_status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'completed'
  },

  processing_errors: [{
    error: String,
    occurred_at: {
      type: Date,
      default: Date.now
    }
  }],

  // Expiry for temporary files
  expires_at: {
    type: Date
  },

  // Deletion info
  deleted_at: {
    type: Date
  },

  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  deletion_reason: {
    type: String
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted file size
mediaSchema.virtual('formatted_size').get(function() {
  const bytes = this.file_size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for aspect ratio
mediaSchema.virtual('aspect_ratio').get(function() {
  if (this.width && this.height) {
    return (this.width / this.height).toFixed(2);
  }
  return null;
});

// Virtual for formatted duration
mediaSchema.virtual('formatted_duration').get(function() {
  if (!this.duration) return null;
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Indexes
mediaSchema.index({ uploaded_by: 1, created_at: -1 });
mediaSchema.index({ media_type: 1, created_at: -1 });
mediaSchema.index({ category: 1, created_at: -1 });
mediaSchema.index({ tags: 1, created_at: -1 });
mediaSchema.index({ is_public: 1, status: 1 });
mediaSchema.index({ expires_at: 1 });
mediaSchema.index({ title: 'text', description: 'text', alt_text: 'text' });

// Static methods
mediaSchema.statics.getUserMedia = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    uploaded_by: userId,
    status: { $ne: 'deleted' }
  })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

mediaSchema.statics.getPublicMedia = async function(filters = {}, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const query = {
    is_public: true,
    status: 'active',
    ...filters
  };
  
  return this.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

mediaSchema.statics.getByType = async function(mediaType, limit = 50) {
  return this.find({
    media_type: mediaType,
    is_public: true,
    status: 'active'
  })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
};

mediaSchema.statics.getPopularMedia = async function(limit = 20) {
  return this.find({
    is_public: true,
    status: 'active'
  })
    .sort({ views_count: -1, likes_count: -1 })
    .limit(limit)
    .lean();
};

mediaSchema.statics.searchMedia = async function(searchTerm, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    $text: { $search: searchTerm },
    is_public: true,
    status: 'active'
  })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .lean();
};

mediaSchema.statics.getMediaStats = async function(userId = null) {
  const match = {
    status: { $ne: 'deleted' }
  };
  
  if (userId) {
    match.uploaded_by = new mongoose.Types.ObjectId(userId);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$media_type',
        count: { $sum: 1 },
        total_size: { $sum: '$file_size' },
        avg_size: { $avg: '$file_size' }
      }
    }
  ]);
  
  const total = await this.countDocuments(match);
  const totalSize = await this.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$file_size' } } }
  ]);
  
  return {
    total_media: total,
    total_size: totalSize[0]?.total || 0,
    by_type: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        total_size: stat.total_size,
        avg_size: stat.avg_size
      };
      return acc;
    }, {})
  };
};

// Instance methods
mediaSchema.methods.incrementViews = async function() {
  this.views_count += 1;
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.incrementLikes = async function() {
  this.likes_count += 1;
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.decrementLikes = async function() {
  this.likes_count = Math.max(0, this.likes_count - 1);
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.incrementDownloads = async function() {
  this.downloads_count += 1;
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.incrementUsage = async function(modelType, modelId) {
  if (!this.used_in) {
    this.used_in = [];
  }
  
  // Check if already used in this model
  const alreadyUsed = this.used_in.some(usage => 
    usage.model_type === modelType && 
    usage.model_id.toString() === modelId.toString()
  );
  
  if (!alreadyUsed) {
    this.used_in.push({
      model_type: modelType,
      model_id: modelId,
      used_at: new Date()
    });
    
    this.usage_count += 1;
  }
  
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.decrementUsage = async function(modelType, modelId) {
  if (this.used_in && this.used_in.length > 0) {
    const initialLength = this.used_in.length;
    this.used_in = this.used_in.filter(usage => 
      !(usage.model_type === modelType && 
        usage.model_id.toString() === modelId.toString())
    );
    
    if (this.used_in.length < initialLength) {
      this.usage_count = Math.max(0, this.usage_count - 1);
    }
  }
  
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.softDelete = async function(userId, reason = 'User request') {
  this.status = 'deleted';
  this.deleted_at = new Date();
  this.deleted_by = userId;
  this.deletion_reason = reason;
  
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.restore = async function() {
  this.status = 'active';
  this.deleted_at = null;
  this.deleted_by = null;
  this.deletion_reason = null;
  
  return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.updateVisibility = async function(isPublic) {
  this.is_public = isPublic;
  return this.save({ validateBeforeSave: false });
};

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
