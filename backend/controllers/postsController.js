// controllers/postsController.js - COMPLETE POSTS MANAGEMENT CONTROLLER
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { formatCurrency, slugify, truncateText, generateExcerpt } = require('../utils/helpers');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const Redis = require('ioredis');

// Redis for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 🔥 CONSTANTS
const POST_CACHE_TTL = 300; // 5 minutes
const POST_LIMITS = {
  MAX_POSTS_PER_DAY: 10,
  MAX_TAGS_PER_POST: 10,
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 10000,
  MAX_EXCERPT_LENGTH: 300
};

// 🔥 HELPER FUNCTIONS
const clearPostsCache = async () => {
  const keys = await redis.keys('posts:*');
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log('🧹 Cleared posts cache');
  }
};

const generateCacheKey = (type, params) => {
  return `posts:${type}:${JSON.stringify(params)}`;
};

const formatPostResponse = (post, userId = null) => {
  const formatted = post.toObject ? post.toObject() : post;
  
  // Check if user liked the post
  let userLiked = false;
  let userSaved = false;
  
  if (userId && formatted.likes) {
    userLiked = formatted.likes.some(like => 
      like.user && like.user.toString() === userId.toString()
    );
  }
  
  if (userId && formatted.saved_by) {
    userSaved = formatted.saved_by.some(savedUserId => 
      savedUserId.toString() === userId.toString()
    );
  }
  
  return {
    id: formatted._id,
    slug: formatted.slug,
    title: formatted.title,
    content: formatted.content,
    excerpt: formatted.excerpt || generateExcerpt(formatted.content, 150),
    featured_image: formatted.featured_image,
    author: formatted.author,
    category: formatted.category,
    tags: formatted.tags || [],
    status: formatted.status,
    is_published: formatted.is_published,
    is_featured: formatted.is_featured,
    is_pinned: formatted.is_pinned,
    allow_comments: formatted.allow_comments,
    views: formatted.views || 0,
    likes_count: formatted.likes_count || 0,
    comments_count: formatted.comments_count || 0,
    shares_count: formatted.shares_count || 0,
    reading_time: formatted.reading_time || calculateReadingTime(formatted.content),
    user_liked: userLiked,
    user_saved: userSaved,
    created_at: formatted.createdAt,
    updated_at: formatted.updatedAt,
    published_at: formatted.published_at,
    meta_title: formatted.meta_title || formatted.title,
    meta_description: formatted.meta_description || formatted.excerpt,
    featured_until: formatted.featured_until
  };
};

const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// ==================== GET ALL POSTS ====================
exports.getPosts = async (req, res) => {
  try {
    console.log('📝 GET posts request');
    
    const cacheKey = generateCacheKey('list', req.query);
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving posts from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    const { 
      page = 1, 
      limit = 20, 
      category,
      tag,
      author,
      status = 'published',
      sort_by = '-published_at',
      search,
      featured,
      pinned
    } = req.query;
    
    // Build filter
    let filter = {};
    
    // Only show published posts for non-admins
    const isAdmin = req.user && ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    if (!isAdmin) {
      filter.status = 'published';
      filter.is_published = true;
    } else if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Additional filters
    if (category) {
      filter.category = category;
    }
    
    if (tag) {
      filter.tags = tag;
    }
    
    if (author) {
      filter.author = new mongoose.Types.ObjectId(author);
    }
    
    if (featured === 'true') {
      filter.is_featured = true;
      filter.featured_until = { $gt: new Date() };
    }
    
    if (pinned === 'true') {
      filter.is_pinned = true;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort
    let sort = {};
    if (sort_by.startsWith('-')) {
      sort[sort_by.substring(1)] = -1;
    } else {
      sort[sort_by] = 1;
    }
    
    // Default sort
    if (!sort_by) {
      sort = { published_at: -1 };
    }
    
    // Execute query
    const posts = await Post.find(filter)
      .populate('author', 'username name avatar bio')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get total count
    const total = await Post.countDocuments(filter);
    
    // Get categories for filter
    const categories = await Category.find({ status: 'active' })
      .select('name slug description post_count')
      .lean();
    
    // Get popular tags
    const popularTags = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log(`✅ Found ${posts.length} posts out of ${total} total`);
    
    // Format posts
    const userId = req.user ? req.user.userId : null;
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    // Prepare response
    const response = {
      success: true,
      code: 'POSTS_FETCHED',
      message: 'Posts fetched successfully',
      data: {
        posts: formattedPosts,
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          next_page: hasNextPage ? pageNum + 1 : null,
          prev_page: hasPrevPage ? pageNum - 1 : null
        },
        filters: {
          category: category || 'all',
          tag: tag || '',
          search: search || '',
          sort_by: sort_by,
          featured: featured || 'all',
          pinned: pinned || 'all'
        },
        categories: categories,
        popular_tags: popularTags.map(tag => ({
          name: tag._id,
          count: tag.count
        })),
        stats: {
          total_posts: total,
          published_posts: await Post.countDocuments({ status: 'published' }),
          featured_posts: await Post.countDocuments({ 
            is_featured: true, 
            featured_until: { $gt: new Date() } 
          }),
          today_posts: await Post.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          })
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: POST_CACHE_TTL
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, POST_CACHE_TTL, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'POSTS_FETCH_ERROR',
      message: 'Failed to fetch posts',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET POST BY ID ====================
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const cacheKey = `posts:${postId}:details`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving post details from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    // Check if ID is a slug
    let post;
    if (mongoose.Types.ObjectId.isValid(postId)) {
      post = await Post.findById(postId)
        .populate('author', 'username name avatar bio social_links')
        .populate('category', 'name slug description')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username avatar'
          },
          options: { sort: { createdAt: -1 }, limit: 10 }
        });
    } else {
      // Search by slug
      post = await Post.findOne({ slug: postId })
        .populate('author', 'username name avatar bio social_links')
        .populate('category', 'name slug description')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username avatar'
          },
          options: { sort: { createdAt: -1 }, limit: 10 }
        });
    }
    
    if (!post) {
      return res.status(404).json({
        success: false,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user can view post
    const isAdmin = req.user && ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    const isAuthor = req.user && post.author._id.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isAuthor) {
      if (post.status !== 'published' || !post.is_published) {
        return res.status(403).json({
          success: false,
          code: 'POST_NOT_PUBLISHED',
          message: 'This post is not published yet',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Increment view count
    post.views = (post.views || 0) + 1;
    await post.save();
    
    // Get related posts
    const relatedPosts = await Post.find({
      _id: { $ne: post._id },
      status: 'published',
      is_published: true,
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } },
        { author: post.author._id }
      ]
    })
      .select('title slug excerpt featured_image views likes_count comments_count published_at')
      .sort({ views: -1 })
      .limit(4)
      .lean();
    
    // Get author's other posts
    const authorPosts = await Post.find({
      author: post.author._id,
      _id: { $ne: post._id },
      status: 'published',
      is_published: true
    })
      .select('title slug featured_image published_at')
      .sort({ published_at: -1 })
      .limit(3)
      .lean();
    
    // Format response
    const userId = req.user ? req.user.userId : null;
    const formattedPost = formatPostResponse(post, userId);
    
    // Check if user liked the post
    if (userId) {
      const like = await Like.findOne({
        post: post._id,
        user: userId,
        type: 'post'
      });
      formattedPost.user_liked = !!like;
    }
    
    const response = {
      success: true,
      code: 'POST_FETCHED',
      message: 'Post fetched successfully',
      data: {
        post: formattedPost,
        author_info: {
          ...post.author.toObject(),
          post_count: await Post.countDocuments({ 
            author: post.author._id,
            status: 'published'
          })
        },
        category_info: post.category,
        related_posts: relatedPosts,
        author_posts: authorPosts,
        navigation: {
          previous_post: await Post.findOne({
            published_at: { $lt: post.published_at },
            status: 'published',
            is_published: true
          })
          .select('title slug')
          .sort({ published_at: -1 })
          .lean(),
          
          next_post: await Post.findOne({
            published_at: { $gt: post.published_at },
            status: 'published',
            is_published: true
          })
          .select('title slug')
          .sort({ published_at: 1 })
          .lean()
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: POST_CACHE_TTL
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, POST_CACHE_TTL, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET POST BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'POST_FETCH_ERROR',
      message: 'Failed to fetch post details',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== CREATE POST ====================
exports.createPost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('📝 CREATE POST REQUEST:', {
      user: req.user.username,
      title: req.body.title,
      category: req.body.category
    });
    
    // Check daily post limit for non-admins
    if (userRole === 'user') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPosts = await Post.countDocuments({
        author: userId,
        createdAt: { $gte: today }
      }).session(session);
      
      if (todayPosts >= POST_LIMITS.MAX_POSTS_PER_DAY) {
        await session.abortTransaction();
        session.endSession();
        return res.status(429).json({
          success: false,
          code: 'DAILY_LIMIT_EXCEEDED',
          message: `Maximum ${POST_LIMITS.MAX_POSTS_PER_DAY} posts allowed per day`,
          limit: POST_LIMITS.MAX_POSTS_PER_DAY,
          posted_today: todayPosts,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const {
      title,
      content,
      excerpt,
      category,
      tags = [],
      is_published = true,
      allow_comments = true,
      meta_title,
      meta_description,
      featured_image
    } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Title and content are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate title length
    if (title.length > POST_LIMITS.MAX_TITLE_LENGTH) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TITLE_TOO_LONG',
        message: `Title cannot exceed ${POST_LIMITS.MAX_TITLE_LENGTH} characters`,
        max_length: POST_LIMITS.MAX_TITLE_LENGTH,
        current_length: title.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate content length
    if (content.length > POST_LIMITS.MAX_CONTENT_LENGTH) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'CONTENT_TOO_LONG',
        message: `Content cannot exceed ${POST_LIMITS.MAX_CONTENT_LENGTH} characters`,
        max_length: POST_LIMITS.MAX_CONTENT_LENGTH,
        current_length: content.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate tags
    if (tags.length > POST_LIMITS.MAX_TAGS_PER_POST) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOO_MANY_TAGS',
        message: `Maximum ${POST_LIMITS.MAX_TAGS_PER_POST} tags allowed per post`,
        max_tags: POST_LIMITS.MAX_TAGS_PER_POST,
        current_tags: tags.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate slug
    const slug = slugify(title) + '-' + Date.now().toString(36);
    
    // Handle featured image upload
    let featuredImageUrl = featured_image;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'posts',
          resource_type: 'image'
        });
        featuredImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        // Continue without image
      }
    }
    
    // Determine status based on user role
    let status = 'draft';
    if (is_published) {
      if (['admin', 'moderator', 'super_admin'].includes(userRole)) {
        status = 'published';
      } else {
        status = 'pending_review';
      }
    }
    
    // Create post
    const postData = {
      title,
      slug,
      content,
      excerpt: excerpt || generateExcerpt(content, 150),
      author: userId,
      category,
      tags: tags.map(tag => tag.trim().toLowerCase()),
      status,
      is_published: status === 'published',
      is_featured: false,
      is_pinned: false,
      allow_comments,
      featured_image: featuredImageUrl,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || generateExcerpt(content, 160),
      reading_time: calculateReadingTime(content),
      published_at: status === 'published' ? new Date() : null
    };
    
    const [post] = await Post.create([postData], { session });
    
    // Populate author info
    await post.populate('author', 'username name avatar').execPopulate();
    
    // Update category post count
    if (category) {
      await Category.findByIdAndUpdate(
        category,
        { $inc: { post_count: 1 } },
        { session }
      );
    }
    
    // Create notification for admin if pending review
    if (status === 'pending_review') {
      const admins = await User.find({ 
        role: { $in: ['admin', 'moderator'] } 
      }).session(session);
      
      for (const admin of admins) {
        await Notification.create([{
          user_id: admin._id,
          type: 'post_pending_review',
          title: 'New Post Pending Review',
          message: `New post "${title}" created by ${req.user.username} needs review`,
          data: {
            post_id: post._id,
            post_title: title,
            author_id: userId,
            author_name: req.user.username,
            created_at: new Date()
          },
          priority: 'medium'
        }], { session });
      }
      
      console.log(`📢 Notifications sent to ${admins.length} admins`);
    }
    
    // Clear posts cache
    await clearPostsCache();
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ POST CREATED: ${post._id} by ${req.user.username}`);
    
    // Prepare response
    const response = {
      success: true,
      code: status === 'published' ? 'POST_PUBLISHED' : 'POST_CREATED',
      message: status === 'published' 
        ? 'Post published successfully!' 
        : 'Post created successfully! Waiting for admin approval.',
      data: {
        post: formatPostResponse(post, userId),
        author: {
          id: req.user.userId,
          username: req.user.username,
          name: req.user.name,
          avatar: req.user.avatar
        },
        status_info: {
          current_status: status,
          message: status === 'published' 
            ? 'Your post is now live and visible to everyone'
            : 'Your post is pending admin review. It will be published after approval.',
          review_time: 'Within 24 hours',
          can_edit: true
        },
        next_steps: status === 'pending_review' ? [
          'Wait for admin review (24 hours)',
          'You can edit the post while waiting',
          'Share with friends once published'
        ] : [
          'Share your post with friends',
          'Engage with comments',
          'Check analytics for performance'
        ]
      },
      timestamp: new Date().toISOString(),
      reference_id: post._id.toString()
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ CREATE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'POST_CREATION_FAILED',
      message: 'Failed to create post',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== UPDATE POST ====================
exports.updatePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('📝 UPDATE POST REQUEST:', {
      post_id: post._id,
      user: req.user.username,
      updates: Object.keys(req.body)
    });
    
    // Check authorization
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(userRole);
    const isAuthor = post.author._id.toString() === userId.toString();
    
    if (!isAdmin && !isAuthor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to update this post',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if post can be updated
    if (post.status === 'archived') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'POST_ARCHIVED',
        message: 'Cannot update archived posts',
        timestamp: new Date().toISOString()
      });
    }
    
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      is_published,
      allow_comments,
      meta_title,
      meta_description,
      featured_image
    } = req.body;
    
    // Track changes
    const changes = [];
    const oldCategory = post.category;
    
    // Update fields if provided
    if (title !== undefined && title !== post.title) {
      post.title = title;
      post.slug = slugify(title) + '-' + Date.now().toString(36);
      changes.push('title');
    }
    
    if (content !== undefined && content !== post.content) {
      post.content = content;
      post.reading_time = calculateReadingTime(content);
      changes.push('content');
    }
    
    if (excerpt !== undefined) {
      post.excerpt = excerpt;
      changes.push('excerpt');
    }
    
    if (category !== undefined && category !== post.category?.toString()) {
      post.category = category;
      changes.push('category');
    }
    
    if (tags !== undefined) {
      post.tags = tags.map(tag => tag.trim().toLowerCase());
      changes.push('tags');
    }
    
    if (is_published !== undefined) {
      // Only admins can change published status
      if (isAdmin) {
        post.is_published = is_published;
        post.status = is_published ? 'published' : 'draft';
        if (is_published && !post.published_at) {
          post.published_at = new Date();
        }
        changes.push('status');
      }
    }
    
    if (allow_comments !== undefined) {
      post.allow_comments = allow_comments;
      changes.push('allow_comments');
    }
    
    if (meta_title !== undefined) {
      post.meta_title = meta_title;
      changes.push('meta_title');
    }
    
    if (meta_description !== undefined) {
      post.meta_description = meta_description;
      changes.push('meta_description');
    }
    
    // Handle featured image upload
    if (req.file) {
      try {
        // Delete old image if exists
        if (post.featured_image) {
          await deleteFromCloudinary(post.featured_image);
        }
        
        // Upload new image
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'posts',
          resource_type: 'image'
        });
        
        post.featured_image = uploadResult.secure_url;
        changes.push('featured_image');
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
      }
    } else if (featured_image !== undefined) {
      post.featured_image = featured_image;
      changes.push('featured_image');
    }
    
    // Update timestamps
    post.updated_at = new Date();
    
    // Add to update history
    if (!post.update_history) {
      post.update_history = [];
    }
    
    post.update_history.push({
      updated_by: userId,
      updated_at: new Date(),
      changes: changes,
      reason: req.body.update_reason || 'Post updated'
    });
    
    await post.save({ session });
    
    // Update category counts if category changed
    if (category && oldCategory && oldCategory.toString() !== category.toString()) {
      await Category.findByIdAndUpdate(
        oldCategory,
        { $inc: { post_count: -1 } },
        { session }
      );
      
      await Category.findByIdAndUpdate(
        category,
        { $inc: { post_count: 1 } },
        { session }
      );
    }
    
    // Clear cache
    await clearPostsCache();
    await redis.del(`posts:${post._id}:details`);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ POST UPDATED: ${post._id} by ${req.user.username}`);
    
    res.json({
      success: true,
      code: 'POST_UPDATED',
      message: 'Post updated successfully',
      data: {
        post: formatPostResponse(post, userId),
        updated_fields: changes,
        updated_at: new Date().toISOString(),
        updated_by: req.user.username
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ UPDATE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'POST_UPDATE_FAILED',
      message: 'Failed to update post',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== DELETE POST ====================
exports.deletePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('🗑️ DELETE POST REQUEST:', {
      post_id: post._id,
      user: req.user.username
    });
    
    // Check authorization
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(userRole);
    const isAuthor = post.author._id.toString() === userId.toString();
    
    if (!isAdmin && !isAuthor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to delete this post',
        timestamp: new Date().toISOString()
      });
    }
    
    // Delete featured image from cloudinary
    if (post.featured_image) {
      try {
        await deleteFromCloudinary(post.featured_image);
      } catch (deleteError) {
        console.error('❌ Image deletion error:', deleteError);
        // Continue with post deletion
      }
    }
    
    // Delete associated likes
    await Like.deleteMany({ post: post._id }).session(session);
    
    // Delete associated comments
    await Comment.deleteMany({ post: post._id }).session(session);
    
    // Update category count
    if (post.category) {
      await Category.findByIdAndUpdate(
        post.category,
        { $inc: { post_count: -1 } },
        { session }
      );
    }
    
    // Delete post
    await Post.findByIdAndDelete(post._id).session(session);
    
    // Clear cache
    await clearPostsCache();
    await redis.del(`posts:${post._id}:details`);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ POST DELETED: ${post._id} by ${req.user.username}`);
    
    res.json({
      success: true,
      code: 'POST_DELETED',
      message: 'Post deleted successfully',
      data: {
        post_id: post._id,
        title: post.title,
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.username,
        associated_data: {
          likes_deleted: true,
          comments_deleted: true,
          image_deleted: !!post.featured_image
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ DELETE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'POST_DELETION_FAILED',
      message: 'Failed to delete post',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== LIKE POST ====================
exports.likePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const userId = req.user.userId;
    
    console.log('❤️ LIKE POST REQUEST:', {
      post_id: post._id,
      user: req.user.username
    });
    
    // Check if post allows interactions
    if (!post.allow_comments && post.status !== 'published') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'POST_NOT_INTERACTABLE',
        message: 'This post does not allow interactions',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      post: post._id,
      user: userId,
      type: 'post'
    }).session(session);
    
    let action = '';
    let message = '';
    
    if (existingLike) {
      // Unlike post
      await Like.findByIdAndDelete(existingLike._id).session(session);
      post.likes_count = Math.max(0, (post.likes_count || 0) - 1);
      action = 'unliked';
      message = 'Post unliked successfully';
    } else {
      // Like post
      await Like.create([{
        post: post._id,
        user: userId,
        type: 'post'
      }], { session });
      
      post.likes_count = (post.likes_count || 0) + 1;
      action = 'liked';
      message = 'Post liked successfully';
      
      // Create notification for post author (if not liking own post)
      if (post.author._id.toString() !== userId.toString()) {
        await Notification.create([{
          user_id: post.author._id,
          type: 'post_liked',
          title: 'Your Post Got a Like!',
          message: `${req.user.username} liked your post "${post.title}"`,
          data: {
            post_id: post._id,
            post_title: post.title,
            liked_by: userId,
            liked_by_name: req.user.username,
            like_count: post.likes_count
          },
          priority: 'low'
        }], { session });
      }
    }
    
    await post.save({ session });
    
    // Clear cache
    await redis.del(`posts:${post._id}:details`);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ POST ${action.toUpperCase()}: ${post._id} by ${req.user.username}`);
    
    res.json({
      success: true,
      code: action === 'liked' ? 'POST_LIKED' : 'POST_UNLIKED',
      message,
      data: {
        post_id: post._id,
        action,
        likes_count: post.likes_count,
        user_liked: action === 'liked'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ LIKE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'LIKE_FAILED',
      message: 'Failed to process like',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== SAVE POST ====================
exports.savePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const userId = req.user.userId;
    
    console.log('💾 SAVE POST REQUEST:', {
      post_id: post._id,
      user: req.user.username
    });
    
    // Check if already saved
    const isSaved = post.saved_by?.some(savedUserId => 
      savedUserId.toString() === userId.toString()
    );
    
    let action = '';
    let message = '';
    
    if (isSaved) {
      // Remove from saved
      post.saved_by = post.saved_by.filter(
        savedUserId => savedUserId.toString() !== userId.toString()
      );
      action = 'unsaved';
      message = 'Post removed from saved list';
    } else {
      // Add to saved
      if (!post.saved_by) {
        post.saved_by = [];
      }
      post.saved_by.push(userId);
      action = 'saved';
      message = 'Post saved successfully';
    }
    
    await post.save({ session });
    
    // Clear cache
    await redis.del(`posts:${post._id}:details`);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ POST ${action.toUpperCase()}: ${post._id} by ${req.user.username}`);
    
    res.json({
      success: true,
      code: action === 'saved' ? 'POST_SAVED' : 'POST_UNSAVED',
      message,
      data: {
        post_id: post._id,
        action,
        saved_count: post.saved_by?.length || 0,
        user_saved: action === 'saved'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ SAVE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SAVE_FAILED',
      message: 'Failed to process save',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== REPORT POST ====================
exports.reportPost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const userId = req.user.userId;
    const { reason, description } = req.body;
    
    console.log('🚨 REPORT POST REQUEST:', {
      post_id: post._id,
      user: req.user.username,
      reason
    });
    
    // Check if already reported by this user
    if (post.reports?.some(report => 
      report.reported_by.toString() === userId.toString()
    )) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_REPORTED',
        message: 'You have already reported this post',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add report
    if (!post.reports) {
      post.reports = [];
    }
    
    post.reports.push({
      reported_by: userId,
      reason,
      description,
      reported_at: new Date(),
      status: 'pending'
    });
    
    post.report_count = (post.report_count || 0) + 1;
    
    // Auto-hide post if too many reports
    const REPORT_THRESHOLD = 5;
    if (post.report_count >= REPORT_THRESHOLD && post.status === 'published') {
      post.status = 'under_review';
      post.is_published = false;
    }
    
    await post.save({ session });
    
    // Create notification for admins
    const admins = await User.find({ 
      role: { $in: ['admin', 'moderator'] } 
    }).session(session);
    
    for (const admin of admins) {
      await Notification.create([{
        user_id: admin._id,
        type: 'post_reported',
        title: 'Post Reported',
        message: `Post "${post.title}" has been reported by ${req.user.username}`,
        data: {
          post_id: post._id,
          post_title: post.title,
          author_id: post.author._id,
          author_name: post.author.username,
          reported_by: userId,
          reported_by_name: req.user.username,
          reason,
          description,
          report_count: post.report_count,
          current_status: post.status
        },
        priority: 'high'
      }], { session });
    }
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ POST REPORTED: ${post._id} by ${req.user.username}`);
    
    res.json({
      success: true,
      code: 'POST_REPORTED',
      message: 'Post reported successfully. Our team will review it.',
      data: {
        post_id: post._id,
        report_id: post.reports[post.reports.length - 1]._id,
        reason,
        report_count: post.report_count,
        current_status: post.status,
        review_time: 'Within 24 hours'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ REPORT POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REPORT_FAILED',
      message: 'Failed to report post',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET MY POSTS ====================
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 20 } = req.query;
    
    console.log('📝 GET MY POSTS:', { user: req.user.username, status });
    
    // Build filter
    const filter = { author: userId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get posts
    const posts = await Post.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments(filter);
    
    // Get stats
    const stats = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_views: { $sum: '$views' },
          total_likes: { $sum: '$likes_count' },
          total_comments: { $sum: '$comments_count' }
        }
      }
    ]);
    
    const statsObj = {
      draft: { count: 0, views: 0, likes: 0, comments: 0 },
      pending_review: { count: 0, views: 0, likes: 0, comments: 0 },
      published: { count: 0, views: 0, likes: 0, comments: 0 },
      archived: { count: 0, views: 0, likes: 0, comments: 0 },
      total: { count: 0, views: 0, likes: 0, comments: 0 }
    };
    
    stats.forEach(stat => {
      if (statsObj[stat._id]) {
        statsObj[stat._id].count = stat.count;
        statsObj[stat._id].views = stat.total_views;
        statsObj[stat._id].likes = stat.total_likes;
        statsObj[stat._id].comments = stat.total_comments;
      }
      
      statsObj.total.count += stat.count;
      statsObj.total.views += stat.total_views;
      statsObj.total.likes += stat.total_likes;
      statsObj.total.comments += stat.total_comments;
    });
    
    console.log(`✅ FOUND ${posts.length} posts for user ${userId}`);
    
    // Format posts
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.json({
      success: true,
      code: 'MY_POSTS_FETCHED',
      message: `Found ${posts.length} posts`,
      data: {
        posts: formattedPosts,
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        statistics: statsObj,
        user_info: {
          id: userId,
          username: req.user.username,
          post_count: total,
          daily_limit: POST_LIMITS.MAX_POSTS_PER_DAY
        },
        filters: {
          status: status || 'all'
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET MY POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MY_POSTS_ERROR',
      message: 'Failed to fetch your posts',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET SAVED POSTS ====================
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('💾 GET SAVED POSTS:', { user: req.user.username });
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get saved posts
    const posts = await Post.find({
      saved_by: userId,
      status: 'published',
      is_published: true
    })
      .populate('author', 'username name avatar')
      .populate('category', 'name slug')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments({
      saved_by: userId,
      status: 'published',
      is_published: true
    });
    
    console.log(`✅ FOUND ${posts.length} saved posts for user ${userId}`);
    
    // Format posts
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.json({
      success: true,
      code: 'SAVED_POSTS_FETCHED',
      message: `Found ${posts.length} saved posts`,
      data: {
        posts: formattedPosts,
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        user_info: {
          id: userId,
          username: req.user.username,
          saved_count: total
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET SAVED POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SAVED_POSTS_ERROR',
      message: 'Failed to fetch saved posts',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: GET ALL POSTS ====================
exports.getAllPostsForAdmin = async (req, res) => {
  try {
    const { 
      status, 
      author, 
      category, 
      search,
      start_date, 
      end_date,
      page = 1, 
      limit = 50 
    } = req.query;
    
    console.log('👑 ADMIN: Get all posts');
    
    // Build filter
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (author && author !== 'all') {
      filter.author = new mongoose.Types.ObjectId(author);
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { 'author.username': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get posts
    const posts = await Post.find(filter)
      .populate('author', 'username email avatar role')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments(filter);
    
    // Get statistics
    const stats = await Post.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_posts: { $sum: 1 },
          total_views: { $sum: '$views' },
          total_likes: { $sum: '$likes_count' },
          total_comments: { $sum: '$comments_count' },
          published_posts: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          pending_posts: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
          draft_posts: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
        }
      }
    ]);
    
    // Get authors list for filter
    const authors = await User.find({ 
      _id: { $in: posts.map(p => p.author?._id).filter(id => id) }
    }).select('username email avatar').lean();
    
    console.log(`👑 ADMIN: Found ${posts.length} posts out of ${total} total`);
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.json({
      success: true,
      code: 'ADMIN_POSTS_FETCHED',
      message: 'Posts fetched successfully for admin',
      data: {
        posts: posts.map(post => formatPostResponse(post)),
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        statistics: stats[0] || {
          total_posts: 0,
          total_views: 0,
          total_likes: 0,
          total_comments: 0,
          published_posts: 0,
          pending_posts: 0,
          draft_posts: 0
        },
        filters: {
          status: status || 'all',
          author: author || 'all',
          category: category || 'all',
          search: search || '',
          start_date: start_date || '',
          end_date: end_date || ''
        },
        authors: authors,
        categories: await Category.find({}).select('name slug').lean()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ADMIN GET POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_POSTS_ERROR',
      message: 'Failed to fetch posts for admin',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: UPDATE POST STATUS ====================
exports.adminUpdatePostStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const { status, notes } = req.body;
    const adminId = req.user.userId;
    
    console.log('👑 ADMIN: Update post status', {
      post_id: post._id,
      from: post.status,
      to: status,
      admin: req.user.username
    });
    
    // Validate status
    const validStatuses = ['draft', 'pending_review', 'published', 'archived', 'rejected'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Invalid status. Valid: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if status changed
    if (post.status === status) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'STATUS_UNCHANGED',
        message: 'Post already has this status',
        timestamp: new Date().toISOString()
      });
    }
    
    const oldStatus = post.status;
    post.status = status;
    
    // Update published status and date
    if (status === 'published') {
      post.is_published = true;
      if (!post.published_at) {
        post.published_at = new Date();
      }
    } else if (status === 'rejected') {
      post.is_published = false;
      post.rejection_reason = notes;
      post.rejected_at = new Date();
      post.rejected_by = adminId;
    } else {
      post.is_published = false;
    }
    
    post.updated_at = new Date();
    
    // Add to history
    if (!post.update_history) {
      post.update_history = [];
    }
    
    post.update_history.push({
      updated_by: adminId,
      updated_at: new Date(),
      old_status: oldStatus,
      new_status: status,
      notes: notes || 'Status updated by admin'
    });
    
    await post.save({ session });
    
    // Clear cache
    await clearPostsCache();
    await redis.del(`posts:${post._id}:details`);
    
    // Create notification for author
    await Notification.create([{
      user_id: post.author._id,
      type: 'post_status_updated',
      title: 'Post Status Updated',
      message: `Your post "${post.title}" status changed from ${oldStatus} to ${status}`,
      data: {
        post_id: post._id,
        post_title: post.title,
        old_status: oldStatus,
        new_status: status,
        updated_by: req.user.username,
        notes: notes || '',
        rejection_reason: status === 'rejected' ? notes : null
      },
      priority: status === 'published' ? 'high' : 'medium'
    }], { session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ ADMIN: Post status updated ${post._id} ${oldStatus} → ${status}`);
    
    res.json({
      success: true,
      code: 'POST_STATUS_UPDATED',
      message: 'Post status updated successfully',
      data: {
        post_id: post._id,
        post_title: post.title,
        status_change: {
          from: oldStatus,
          to: status,
          updated_by: req.user.username,
          updated_at: new Date().toISOString(),
          notes: notes
        },
        author: {
          id: post.author._id,
          username: post.author.username
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ ADMIN UPDATE POST STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_FAILED',
      message: 'Failed to update post status',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: DELETE POST ====================
exports.adminDeletePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const adminId = req.user.userId;
    const { reason } = req.body;
    
    console.log('👑 ADMIN: Delete post', {
      post_id: post._id,
      admin: req.user.username,
      reason
    });
    
    // Delete featured image from cloudinary
    if (post.featured_image) {
      try {
        await deleteFromCloudinary(post.featured_image);
      } catch (deleteError) {
        console.error('❌ Image deletion error:', deleteError);
      }
    }
    
    // Delete associated data
    await Like.deleteMany({ post: post._id }).session(session);
    await Comment.deleteMany({ post: post._id }).session(session);
    
    // Update category count
    if (post.category) {
      await Category.findByIdAndUpdate(
        post.category,
        { $inc: { post_count: -1 } },
        { session }
      );
    }
    
    // Store post info before deletion
    const postInfo = {
      id: post._id,
      title: post.title,
      author: post.author._id,
      author_name: post.author.username
    };
    
    // Delete post
    await Post.findByIdAndDelete(post._id).session(session);
    
    // Clear cache
    await clearPostsCache();
    
    // Create notification for author
    await Notification.create([{
      user_id: post.author._id,
      type: 'post_deleted_by_admin',
      title: 'Post Deleted by Admin',
      message: `Your post "${post.title}" has been deleted by admin`,
      data: {
        post_id: post._id,
        post_title: post.title,
        deleted_by: req.user.username,
        deleted_at: new Date(),
        reason: reason || 'Violation of community guidelines'
      },
      priority: 'high'
    }], { session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ ADMIN: Post deleted ${post._id} by ${req.user.username}`);
    
    res.json({
      success: true,
      code: 'POST_DELETED_ADMIN',
      message: 'Post deleted successfully',
      data: {
        post_info: postInfo,
        deleted_by: req.user.username,
        deleted_at: new Date().toISOString(),
        reason: reason || 'Administrative decision',
        associated_data_deleted: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ ADMIN DELETE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_DELETION_FAILED',
      message: 'Failed to delete post',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== TOGGLE FEATURE POST ====================
exports.toggleFeaturePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const post = req.post;
    const { featured_until, notes } = req.body;
    
    console.log('👑 ADMIN: Toggle feature post', {
      post_id: post._id,
      currently_featured: post.is_featured,
      admin: req.user.username
    });
    
    // Toggle featured status
    post.is_featured = !post.is_featured;
    post.updated_at = new Date();
    
    if (post.is_featured) {
      // Set featured until date (default 7 days)
      post.featured_until = featured_until 
        ? new Date(featured_until)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      post.featured_at = new Date();
      post.featured_by = req.user.userId;
      
      // Add to history
      if (!post.update_history) {
        post.update_history = [];
      }
      
      post.update_history.push({
        updated_by: req.user.userId,
        updated_at: new Date(),
        action: 'featured',
        featured_until: post.featured_until,
        notes: notes || 'Featured by admin'
      });
      
      // Create notification for author
      await Notification.create([{
        user_id: post.author._id,
        type: 'post_featured',
        title: 'Your Post is Featured!',
        message: `Congratulations! Your post "${post.title}" has been featured on XOSS Gaming`,
        data: {
          post_id: post._id,
          post_title: post.title,
          featured_by: req.user.username,
          featured_until: post.featured_until,
          notes: notes
        },
        priority: 'high'
      }], { session });
      
      message = 'Post featured successfully';
      code = 'POST_FEATURED';
    } else {
      post.featured_until = null;
      post.featured_at = null;
      post.featured_by = null;
      
      message = 'Post unfeatured successfully';
      code = 'POST_UNFEATURED';
    }
    
    await post.save({ session });
    
    // Clear cache
    await clearPostsCache();
    await redis.del(`posts:${post._id}:details`);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ ADMIN: Post ${post.is_featured ? 'featured' : 'unfeatured'} ${post._id}`);
    
    res.json({
      success: true,
      code,
      message,
      data: {
        post_id: post._id,
        post_title: post.title,
        is_featured: post.is_featured,
        featured_until: post.featured_until,
        updated_at: post.updated_at,
        updated_by: req.user.username
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ TOGGLE FEATURE POST ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FEATURE_TOGGLE_FAILED',
      message: 'Failed to toggle feature status',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET POSTS BY CATEGORY ====================
exports.getPostsByCategory = async (req, res) => {
  try {
    const categorySlug = req.params.category;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('📝 GET posts by category:', categorySlug);
    
    // Find category
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({
        success: false,
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get posts
    const posts = await Post.find({
      category: category._id,
      status: 'published',
      is_published: true
    })
      .populate('author', 'username name avatar')
      .populate('category', 'name slug')
      .sort({ published_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments({
      category: category._id,
      status: 'published',
      is_published: true
    });
    
    console.log(`✅ Found ${posts.length} posts in category "${category.name}"`);
    
    // Format posts
    const userId = req.user ? req.user.userId : null;
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.json({
      success: true,
      code: 'CATEGORY_POSTS_FETCHED',
      message: `Posts in category "${category.name}" fetched`,
      data: {
        posts: formattedPosts,
        category: {
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          post_count: category.post_count || total
        },
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET POSTS BY CATEGORY ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'CATEGORY_POSTS_ERROR',
      message: 'Failed to fetch posts by category',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET POSTS BY TAG ====================
exports.getPostsByTag = async (req, res) => {
  try {
    const tag = req.params.tag;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('📝 GET posts by tag:', tag);
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get posts
    const posts = await Post.find({
      tags: { $regex: new RegExp(`^${tag}$`, 'i') },
      status: 'published',
      is_published: true
    })
      .populate('author', 'username name avatar')
      .populate('category', 'name slug')
      .sort({ published_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments({
      tags: { $regex: new RegExp(`^${tag}$`, 'i') },
      status: 'published',
      is_published: true
    });
    
    // Get related tags
    const relatedTags = await Post.aggregate([
      { $unwind: '$tags' },
      { $match: { tags: { $ne: tag.toLowerCase() } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log(`✅ Found ${posts.length} posts with tag "${tag}"`);
    
    // Format posts
    const userId = req.user ? req.user.userId : null;
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.json({
      success: true,
      code: 'TAG_POSTS_FETCHED',
      message: `Posts with tag "${tag}" fetched`,
      data: {
        posts: formattedPosts,
        tag_info: {
          name: tag,
          post_count: total,
          formatted_name: tag.charAt(0).toUpperCase() + tag.slice(1)
        },
        related_tags: relatedTags.map(t => ({
          name: t._id,
          count: t.count,
          formatted_name: t._id.charAt(0).toUpperCase() + t._id.slice(1)
        })),
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET POSTS BY TAG ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TAG_POSTS_ERROR',
      message: 'Failed to fetch posts by tag',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== SEARCH POSTS ====================
exports.searchPosts = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      author, 
      tags,
      date_from, 
      date_to,
      sort = 'relevance',
      page = 1, 
      limit = 20 
    } = req.query;
    
    console.log('🔍 SEARCH POSTS:', { query, category, author });
    
    // Build search query
    let searchQuery = {
      status: 'published',
      is_published: true
    };
    
    // Text search
    if (query && query.trim().length > 0) {
      searchQuery.$text = { $search: query.trim() };
    }
    
    // Filter by category
    if (category && category !== 'all') {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        searchQuery.category = categoryDoc._id;
      }
    }
    
    // Filter by author
    if (author && author !== 'all') {
      const authorDoc = await User.findOne({ username: author });
      if (authorDoc) {
        searchQuery.author = authorDoc._id;
      }
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      searchQuery.tags = { $in: tagArray };
    }
    
    // Filter by date range
    if (date_from || date_to) {
      searchQuery.published_at = {};
      if (date_from) searchQuery.published_at.$gte = new Date(date_from);
      if (date_to) searchQuery.published_at.$lte = new Date(date_to);
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'date':
        sortOptions = { published_at: 1 };
        break;
      case 'date_desc':
        sortOptions = { published_at: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      case 'likes':
        sortOptions = { likes_count: -1 };
        break;
      case 'relevance':
        // For text search relevance
        if (query) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { published_at: -1 };
        }
        break;
      default:
        sortOptions = { published_at: -1 };
    }
    
    // Build find options
    const findOptions = {
      ...sortOptions,
      skip,
      limit: limitNum
    };
    
    // If text search, include score
    if (query && query.trim().length > 0) {
      findOptions.score = { $meta: 'textScore' };
    }
    
    // Execute search
    const posts = await Post.find(searchQuery, null, findOptions)
      .populate('author', 'username name avatar')
      .populate('category', 'name slug')
      .lean();
    
    const total = await Post.countDocuments(searchQuery);
    
    console.log(`✅ Search found ${posts.length} posts`);
    
    // Format posts
    const userId = req.user ? req.user.userId : null;
    const formattedPosts = posts.map(post => ({
      ...formatPostResponse(post, userId),
      search_score: post.score || 0
    }));
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.json({
      success: true,
      code: 'SEARCH_COMPLETED',
      message: 'Post search completed successfully',
      data: {
        posts: formattedPosts,
        search_info: {
          query: query || '',
          filters: {
            category: category || 'all',
            author: author || 'all',
            tags: tags || '',
            date_from: date_from || '',
            date_to: date_to || '',
            sort: sort
          },
          total_results: total,
          showing_results: posts.length
        },
        pagination: {
          current_page: pageNum,
          page_size: limitNum,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ SEARCH POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SEARCH_ERROR',
      message: 'Failed to search posts',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET FEATURED POSTS ====================
exports.getFeaturedPosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const cacheKey = `posts:featured:${limit}`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving featured posts from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    console.log('🌟 GET featured posts');
    
    const posts = await Post.find({
      is_featured: true,
      status: 'published',
      is_published: true,
      featured_until: { $gt: new Date() }
    })
      .populate('author', 'username name avatar')
      .populate('category', 'name slug')
      .sort({ featured_at: -1 })
      .limit(parseInt(limit))
      .lean();
    
    console.log(`✅ Found ${posts.length} featured posts`);
    
    // Format posts
    const userId = req.user ? req.user.userId : null;
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    const response = {
      success: true,
      code: 'FEATURED_POSTS_FETCHED',
      message: 'Featured posts fetched successfully',
      data: {
        posts: formattedPosts,
        count: posts.length,
        featured_until: posts.length > 0 ? posts[0].featured_until : null
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 300 // 5 minutes cache
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, 300, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET FEATURED POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FEATURED_POSTS_ERROR',
      message: 'Failed to fetch featured posts',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET TRENDING POSTS ====================
exports.getTrendingPosts = async (req, res) => {
  try {
    const { period = 'week', limit = 10 } = req.query;
    const cacheKey = `posts:trending:${period}:${limit}`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving trending posts from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    console.log('📈 GET trending posts for period:', period);
    
    // Calculate date based on period
    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const posts = await Post.find({
      status: 'published',
      is_published: true,
      published_at: { $gte: startDate }
    })
      .populate('author', 'username name avatar')
      .populate('category', 'name slug')
      .sort({ views: -1, likes_count: -1 })
      .limit(parseInt(limit))
      .lean();
    
    console.log(`✅ Found ${posts.length} trending posts for ${period}`);
    
    // Format posts
    const userId = req.user ? req.user.userId : null;
    const formattedPosts = posts.map(post => formatPostResponse(post, userId));
    
    const response = {
      success: true,
      code: 'TRENDING_POSTS_FETCHED',
      message: 'Trending posts fetched successfully',
      data: {
        posts: formattedPosts,
        count: posts.length,
        period: period,
        start_date: startDate,
        end_date: new Date()
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 600 // 10 minutes cache for trending posts
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, 600, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET TRENDING POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'TRENDING_POSTS_ERROR',
      message: 'Failed to fetch trending posts',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET KNOWLEDGE BASE ====================
exports.getKnowledgeBase = async (req, res) => {
  try {
    console.log('📚 GET knowledge base');
    
    const knowledgeBase = [
      {
        id: 'getting-started',
        title: 'Getting Started',
        articles: [
          {
            id: 'how-to-register',
            title: 'How to Register on XOSS Gaming',
            content: 'Step-by-step guide to create your account...',
            category: 'account'
          },
          {
            id: 'verification-process',
            title: 'Account Verification Process',
            content: 'Learn how to verify your account for full access...',
            category: 'account'
          }
        ]
      },
      {
        id: 'tournaments',
        title: 'Tournaments',
        articles: [
          {
            id: 'create-tournament',
            title: 'How to Create a Tournament',
            content: 'Complete guide to creating your own tournament...',
            category: 'tournament'
          },
          {
            id: 'join-tournament',
            title: 'How to Join a Tournament',
            content: 'Step-by-step guide to joining tournaments...',
            category: 'tournament'
          },
          {
            id: 'prize-distribution',
            title: 'Prize Distribution System',
            content: 'Understanding how prizes are calculated and distributed...',
            category: 'tournament'
          }
        ]
      },
      {
        id: 'financial',
        title: 'Financial',
        articles: [
          {
            id: 'deposit-guide',
            title: 'How to Deposit Money',
            content: 'Complete guide to adding funds to your wallet...',
            category: 'financial'
          },
          {
            id: 'withdrawal-guide',
            title: 'How to Withdraw Money',
            content: 'Step-by-step guide to withdrawing your earnings...',
            category: 'financial'
          },
          {
            id: 'transaction-fees',
            title: 'Understanding Transaction Fees',
            content: 'Learn about different fees and charges...',
            category: 'financial'
          }
        ]
      },
      {
        id: 'gaming',
        title: 'Gaming',
        articles: [
          {
            id: 'game-requirements',
            title: 'Game System Requirements',
            content: 'Check if your device meets the requirements...',
            category: 'gaming'
          },
          {
            id: 'room-joining',
            title: 'How to Join Game Rooms',
            content: 'Guide to joining tournament/match rooms...',
            category: 'gaming'
          },
          {
            id: 'results-submission',
            title: 'How to Submit Match Results',
            content: 'Step-by-step guide to submitting your results...',
            category: 'gaming'
          }
        ]
      }
    ];
    
    res.json({
      success: true,
      code: 'KNOWLEDGE_BASE_FETCHED',
      message: 'Knowledge base fetched successfully',
      data: {
        knowledge_base: knowledgeBase,
        search_tips: [
          'Use specific keywords for better results',
          'Check the FAQ section first',
          'Contact support if you can\'t find an answer'
        ]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET KNOWLEDGE BASE ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'KNOWLEDGE_BASE_ERROR',
      message: 'Failed to fetch knowledge base',
      timestamp: new Date().toISOString()
    });
  }
};
