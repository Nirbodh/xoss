const express = require('express');
const Match = require('../models/Match');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { tournamentId, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (tournamentId) filter.tournament_id = tournamentId;
    if (status) filter.status = status;
    
    const matches = await Match.find(filter)
      .populate('tournament_id', 'title game')
      .populate('created_by', 'username')
      .populate('participants.user', 'username avatar')
      .sort({ start_time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Match.countDocuments(filter);
    
    res.json({
      success: true,
      matches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get single match
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament_id', 'title game')
      .populate('created_by', 'username')
      .populate('participants.user', 'username avatar level rank')
      .populate('results.user', 'username avatar');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create match (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const matchData = {
      ...req.body,
      created_by: req.user.userId
    };
    
    const match = new Match(matchData);
    await match.save();
    
    await match.populate('created_by', 'username');
    
    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Join match
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if already joined
    const alreadyJoined = match.participants.some(
      p => p.user.toString() === req.user.userId
    );
    
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this match'
      });
    }
    
    // Check if match is full
    if (match.spots_filled >= match.spots_total) {
      return res.status(400).json({
        success: false,
        message: 'Match is full'
      });
    }
    
    // Add participant
    match.participants.push({
      user: req.user.userId,
      joined_at: new Date()
    });
    
    match.spots_filled += 1;
    await match.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('participant-joined', {
      matchId: match._id,
      participant: {
        user: req.user.userId,
        username: req.user.username
      },
      spots_filled: match.spots_filled,
      spots_left: match.spots_total - match.spots_filled
    });
    
    res.json({
      success: true,
      message: 'Successfully joined match',
      spots_left: match.spots_total - match.spots_filled
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Quick join feature
router.post('/:id/quick-join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Quick join logic - auto join if spots available
    const alreadyJoined = match.participants.some(
      p => p.user.toString() === req.user.userId
    );
    
    if (!alreadyJoined && match.spots_filled < match.spots_total) {
      match.participants.push({
        user: req.user.userId,
        joined_at: new Date()
      });
      
      match.spots_filled += 1;
      await match.save();
      
      // Emit socket event
      const io = req.app.get('io');
      io.to(`match-${match._id}`).emit('quick-join-success', {
        matchId: match._id,
        userId: req.user.userId,
        spots_filled: match.spots_filled
      });
    }
    
    res.json({
      success: true,
      message: 'Quick join successful',
      joined: !alreadyJoined,
      match: {
        id: match._id,
        title: match.title,
        room_code: match.room_code,
        spots_left: match.spots_total - match.spots_filled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
