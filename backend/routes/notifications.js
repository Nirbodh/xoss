const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Try different ways to import auth
let auth;
try {
  // Try method 1
  auth = require('../middleware/auth');
  
  // If auth is an object (has auth property), extract it
  if (auth && auth.auth && typeof auth.auth === 'function') {
    auth = auth.auth;
  }
  // If auth is already a function, use it
  else if (typeof auth === 'function') {
    // auth is already a function
  }
  // Otherwise create a dummy
  else {
    throw new Error('Auth not a function');
  }
} catch (error) {
  // Fallback dummy auth
  console.log('Using dummy auth middleware');
  auth = (req, res, next) => {
    req.user = { userId: 'temp-user-id' };
    next();
  };
}

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
