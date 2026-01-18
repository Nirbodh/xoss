const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { type = 'global', limit = 50 } = req.query;
    
    let users = [];
    
    if (type === 'global') {
      users = await User.find()
        .sort({ walletBalance: -1 })
        .limit(limit)
        .select('username email walletBalance profilePicture');
    }
    
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      points: user.walletBalance || 0,
      profilePicture: user.profilePicture,
      userId: user._id
    }));
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
