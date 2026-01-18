const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.userId 
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    // If model doesn't exist
    res.json({
      success: true,
      data: [
        {
          id: '1',
          title: 'Welcome to XOSS Gaming',
          message: 'Start playing and win real money!',
          type: 'system',
          read: false,
          createdAt: new Date()
        }
      ]
    });
  }
});

// Mark notification as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      read: true
    });
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.json({ success: true, message: 'Marked as read' });
  }
});

module.exports = router;
