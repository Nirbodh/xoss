// routes/likes.js - COMPLETE VERSION
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const likesController = require('../controllers/likesController');

// ==================== USER PROTECTED ROUTES ====================
// ✅ LIKE/UNLIKE post
router.post('/post/:postId/toggle', auth, likesController.togglePostLike);

// ✅ LIKE/UNLIKE comment
router.post('/comment/:commentId/toggle', auth, likesController.toggleCommentLike);

// ✅ GET likes for post
router.get('/post/:postId', likesController.getPostLikes);

// ✅ GET likes for comment
router.get('/comment/:commentId', likesController.getCommentLikes);

// ✅ GET my liked posts
router.get('/user/liked-posts', auth, likesController.getMyLikedPosts);

// ✅ CHECK if liked
router.get('/check/post/:postId', auth, likesController.checkPostLike);
router.get('/check/comment/:commentId', auth, likesController.checkCommentLike);

module.exports = router;
