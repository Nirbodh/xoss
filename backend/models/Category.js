// models/Category.js - CATEGORY MODEL
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },

  icon: {
    type: String,
    default: '📝'
  },

  color: {
    type: String,
    default: '#3B82F6'
  },

  post_count: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },

  featured: {
    type: Boolean,
    default: false
  },

  order: {
    type: Number,
    default: 0
  },

  parent_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },

  seo_title: {
    type: String,
    maxlength: [70, 'SEO title cannot exceed 70 characters']
  },

  seo_description: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },

  seo_keywords: [String],

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for child categories
categorySchema.virtual('child_categories', {
  ref: 'Category',
  foreignField: 'parent_category',
  localField: '_id'
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ featured: 1 });
categorySchema.index({ order: 1 });

// Middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    const slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
    this.slug = slug;
  }
  next();
});

// Static methods
categorySchema.statics.getActiveCategories = async function() {
  return this.find({ status: 'active' })
    .sort({ order: 1, name: 1 })
    .select('name slug description icon color post_count');
};

categorySchema.statics.getFeaturedCategories = async function() {
  return this.find({ 
    status: 'active',
    featured: true 
  })
    .sort({ order: 1 })
    .limit(10)
    .select('name slug description icon color post_count');
};

categorySchema.statics.incrementPostCount = async function(categoryId) {
  return this.findByIdAndUpdate(
    categoryId,
    { $inc: { post_count: 1 } },
    { new: true }
  );
};

categorySchema.statics.decrementPostCount = async function(categoryId) {
  return this.findByIdAndUpdate(
    categoryId,
    { $inc: { post_count: -1 } },
    { new: true }
  );
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
