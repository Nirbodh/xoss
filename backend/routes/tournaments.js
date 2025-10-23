const express = require('express');
const Tournament = require('../models/Tournament');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { status, game, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (game) filter.game = new RegExp(game, 'i');
    
    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username avatar')
      .sort({ start_time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Tournament.countDocuments(filter);
    
    res.json({
      success: true,
      tournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get single tournament
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('created_by', 'username avatar')
      .populate('participants.user', 'username avatar level rank');
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        message: 'Tournament not found' 
      });
    }
    
    res.json({
      success: true,
      tournament
    });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Create tournament (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      game,
      game_mode,
      total_prize,
      entry_fee,
      start_time,
      end_time,
      max_participants,
      min_players,
      max_players_per_team,
      rules,
      thumbnail
    } = req.body;

    const tournamentData = {
      title,
      description,
      game,
      game_mode,
      total_prize: total_prize || 0,
      entry_fee: entry_fee || 0,
      start_time,
      end_time,
      max_participants,
      min_players: min_players || 1,
      max_players_per_team: max_players_per_team || 1,
      rules,
      thumbnail,
      created_by: req.user.userId
    };
    
    const tournament = new Tournament(tournamentData);
    await tournament.save();
    
    await tournament.populate('created_by', 'username avatar');
    
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Join tournament
router.post('/:id/join', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        message: 'Tournament not found' 
      });
    }
    
    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ 
        success: false,
        message: 'Tournament is not accepting registrations' 
      });
    }
    
    // Check if already joined
    const alreadyJoined = tournament.participants.some(
      p => p.user.toString() === req.user.userId
    );
    
    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false,
        message: 'Already joined this tournament' 
      });
    }
    
    // Check if tournament is full
    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({ 
        success: false,
        message: 'Tournament is full' 
      });
    }
    
    // Add participant
    tournament.participants.push({
      user: req.user.userId,
      joined_at: new Date()
    });
    
    tournament.current_participants += 1;
    await tournament.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`tournament-${tournament._id}`).emit('participant-joined', {
      tournamentId: tournament._id,
      participant: {
        user: req.user.userId
      },
      current_participants: tournament.current_participants
    });
    
    res.json({
      success: true,
      message: 'Successfully joined tournament',
      current_participants: tournament.current_participants
    });
  } catch (error) {
    console.error('Join tournament error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
