const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const formattedUser = user.getFormattedUser ? user.getFormattedUser() : user;
    
    res.json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');
    
    const formattedUser = user.getFormattedUser ? user.getFormattedUser() : user;
    
    res.json({
      success: true,
      message: 'Profile updated',
      data: formattedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/stats', auth, async (req, res) => {
  try {
    const Match = require('../models/Match');
    const Tournament = require('../models/Tournament');
    
    const [matches, tournaments] = await Promise.all([
      Match.countDocuments({ participants: req.params.id }),
      Tournament.countDocuments({ 'participants.user': req.params.id })
    ]);
    
    const user = await User.findById(req.params.id).select('stats matches_played matches_won');
    
    let winRate = 0;
    if (user) {
      const matchesPlayed = user.stats?.matches_played || user.matches_played || 0;
      const matchesWon = user.stats?.matches_won || user.matches_won || 0;
      if (matchesPlayed > 0) {
        winRate = (matchesWon / matchesPlayed) * 100;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalMatches: matches,
        totalTournaments: tournaments,
        winRate: winRate.toFixed(2),
        userStats: user?.stats || {
          matches_played: user?.matches_played || 0,
          matches_won: user?.matches_won || 0,
          win_rate: winRate.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
