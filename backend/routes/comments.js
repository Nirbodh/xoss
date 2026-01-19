// routes/comments.js - COMPLETE VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const commentsController = require('../controllers/commentsController');

// ==================== PUBLIC ROUTES ====================
// ✅ GET comments for post
router.get('/post/:postId', commentsController.getCommentsForPost);

// ✅ GET comment by ID
router.get('/:id', commentsController.getCommentById);

// ==================== USER PROTECTED ROUTES ====================
// ✅ CREATE comment
router.post('/create', auth, commentsController.createComment);

// ✅ UPDATE comment
router.put('/:id/update', auth, commentsController.updateComment);

// ✅ DELETE comment
router.delete('/:id/delete', auth, commentsController.deleteComment);

// ✅ LIKE comment
router.post('/:id/like', auth, commentsController.likeComment);

// ✅ REPLY to comment
router.post('/:id/reply', auth, commentsController.replyToComment);

// ✅ REPORT comment
router.post('/:id/report', auth, commentsController.reportComment);

// ✅ GET my comments
router.get('/user/my-comments', auth, commentsController.getMyComments);

// ==================== ADMIN ROUTES ====================
// ✅ ADMIN: Get all comments
router.get('/admin/all', adminAuth, commentsController.getAllCommentsForAdmin);

// ✅ ADMIN: Update comment status
router.put('/admin/:id/status', adminAuth, commentsController.adminUpdateCommentStatus);

// ✅ ADMIN: Delete comment
router.delete('/admin/:id/delete', adminAuth, commentsController.adminDeleteComment);

// ==================== VALIDATION ====================
router.param('id', async (req, res, next, id) => {
  try {
    const Comment = require('../models/Comment');
    const comment = await Comment.findById(id).populate('author', 'username avatar');
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        code: 'COMMENT_NOT_FOUND',
        message: 'Comment not found'
      });
    }
    
    req.comment = comment;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Invalid comment ID'
    });
  }
});

router.param('postId', async (req, res, next, id) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(id);
    
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
      code: 'INVALID_POST_ID',
      message: 'Invalid post ID'
    });
  }
});

module.exports = router;
