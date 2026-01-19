// routes/media.js - COMPLETE VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const mediaController = require('../controllers/mediaController');
const upload = require('../middleware/upload');

// ==================== PUBLIC ROUTES ====================
// ✅ GET media by ID
router.get('/:id', mediaController.getMediaById);

// ==================== USER PROTECTED ROUTES ====================
// ✅ UPLOAD media
router.post('/upload', auth, upload.array('files', 10), mediaController.uploadMedia);

// ✅ DELETE my media
router.delete('/:id/delete', auth, mediaController.deleteMedia);

// ✅ GET my media
router.get('/user/my-media', auth, mediaController.getMyMedia);

// ✅ UPDATE media info
router.put('/:id/update', auth, mediaController.updateMedia);

// ==================== ADMIN ROUTES ====================
// ✅ ADMIN: Get all media
router.get('/admin/all', adminAuth, mediaController.getAllMedia);

// ✅ ADMIN: Delete media
router.delete('/admin/:id/delete', adminAuth, mediaController.adminDeleteMedia);

// ✅ ADMIN: Update media status
router.put('/admin/:id/status', adminAuth, mediaController.adminUpdateMediaStatus);

// ==================== VALIDATION ====================
router.param('id', async (req, res, next, id) => {
  try {
    const Media = require('../models/Media');
    const media = await Media.findById(id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        code: 'MEDIA_NOT_FOUND',
        message: 'Media not found'
      });
    }
    
    req.media = media;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Invalid media ID'
    });
  }
});

module.exports = router;
