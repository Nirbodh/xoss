// routes/tournaments.js - FIXED VERSION
const express = require('express');
const Tournament = require('../models/Tournament');
const router = express.Router();

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      tournaments, 
      count: tournaments.length 
    });
  } catch (err) {
    console.error('GET tournaments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ FIXED: CREATE tournament with proper data handling
router.post('/create', async (req, res) => {
  try {
    console.log('📥 Create tournament request body:', JSON.stringify(req.body, null, 2));
    
    // ✅ VALIDATE REQUIRED FIELDS
    const requiredFields = ['title', 'game', 'start_time', 'end_time', 'scheduleTime', 'max_participants'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ FIXED: Ensure proper data types and handle all field mappings
    const tournamentData = {
      title: req.body.title,
      game: req.body.game,
      status: req.body.status || 'upcoming',
      matchType: req.body.matchType || 'match',
      
      // ✅ Convert to numbers with proper validation
      total_prize: Number(req.body.total_prize) || Number(req.body.prizePool) || 0,
      prizePool: Number(req.body.prizePool) || Number(req.body.total_prize) || 0,
      entry_fee: Number(req.body.entry_fee) || Number(req.body.entryFee) || 0,
      entryFee: Number(req.body.entryFee) || Number(req.body.entry_fee) || 0,
      max_participants: Number(req.body.max_participants) || Number(req.body.maxPlayers) || 50,
      maxPlayers: Number(req.body.maxPlayers) || Number(req.body.max_participants) || 50,
      current_participants: Number(req.body.current_participants) || Number(req.body.currentPlayers) || 0,
      currentPlayers: Number(req.body.currentPlayers) || Number(req.body.current_participants) || 0,
      
      // ✅ Ensure Date objects with validation
      start_time: new Date(req.body.start_time),
      scheduleTime: new Date(req.body.scheduleTime),
      end_time: new Date(req.body.end_time),
      
      description: req.body.description || '',
      rules: req.body.rules || '',
      roomId: req.body.roomId || '',
      password: req.body.password || '',
      map: req.body.map || '',
      type: req.body.type || 'Solo',
      created_by: req.body.created_by || 'admin'
    };

    console.log('✅ Processed tournament data:', JSON.stringify(tournamentData, null, 2));

    // ✅ Validate date objects
    if (isNaN(tournamentData.start_time.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start_time format'
      });
    }
    if (isNaN(tournamentData.end_time.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end_time format'
      });
    }
    if (isNaN(tournamentData.scheduleTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduleTime format'
      });
    }

    // ✅ Validate numbers
    if (isNaN(tournamentData.max_participants) || tournamentData.max_participants <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid max_participants value'
      });
    }

    const tournament = await Tournament.create(tournamentData);
    
    console.log('✅ Tournament created successfully:', tournament._id);
    
    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament created successfully'
    });
  } catch (err) {
    console.error('❌ CREATE tournament error:', err);
    res.status(400).json({ 
      success: false, 
      message: `Create failed: ${err.message}`,
      error: err.message
    });
  }
});

// UPDATE tournament
router.put('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }
    
    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament updated successfully'
    });
  } catch (err) {
    console.error('UPDATE tournament error:', err);
    res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// DELETE tournament
router.delete('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Tournament deleted successfully' 
    });
  } catch (err) {
    console.error('DELETE tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

module.exports = router;
