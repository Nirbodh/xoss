// routes/posts.js - COMPLETE VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');
const postsController = require('../controllers/postsController');
const upload = require('../middleware/upload');

// ==================== PUBLIC ROUTES ====================
// ✅ GET all posts
router.get('/', postsController.getPosts);

// ✅ GET post by ID/slug
router.get('/:id', postsController.getPostById);

// ✅ GET posts by category
router.get('/category/:category', postsController.getPostsByCategory);

// ✅ GET posts by tag
router.get('/tag/:tag', postsController.getPostsByTag);

// ✅ SEARCH posts
router.get('/search/all', postsController.searchPosts);

// ✅ GET featured posts
router.get('/featured/list', postsController.getFeaturedPosts);

// ✅ GET trending posts
router.get('/trending/list', postsController.getTrendingPosts);

// ==================== USER PROTECTED ROUTES ====================
// ✅ CREATE post (auth users)
router.post('/create', auth, upload.single('thumbnail'), postsController.createPost);

// ✅ UPDATE post
router.put('/:id/update', auth, upload.single('thumbnail'), postsController.updatePost);

// ✅ DELETE post
router.delete('/:id/delete', auth, postsController.deletePost);

// ✅ LIKE post
router.post('/:id/like', auth, postsController.likePost);

// ✅ SAVE post
router.post('/:id/save', auth, postsController.savePost);

// ✅ REPORT post
router.post('/:id/report', auth, postsController.reportPost);

// ✅ GET my posts
router.get('/user/my-posts', auth, postsController.getMyPosts);

// ✅ GET saved posts
router.get('/user/saved-posts', auth, postsController.getSavedPosts);

// ==================== ADMIN ROUTES ====================
// ✅ ADMIN: Get all posts (with filters)
router.get('/admin/all', adminAuth, postsController.getAllPostsForAdmin);

// ✅ ADMIN: Update post status
router.put('/admin/:id/status', adminAuth, postsController.adminUpdatePostStatus);

// ✅ ADMIN: Delete post
router.delete('/admin/:id/delete', adminAuth, postsController.adminDeletePost);

// ✅ ADMIN: Feature/unfeature post
router.post('/admin/:id/feature', adminAuth, postsController.toggleFeaturePost);

// ==================== VALIDATION ====================
router.param('id', async (req, res, next, id) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(id).populate('author', 'username avatar');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        code: 'POST_NOT_FOUND',
        message: 'Post not found'
      });
    }
    
    req.post = post;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Invalid post ID'
    });
  }
});

module.exports = router;
