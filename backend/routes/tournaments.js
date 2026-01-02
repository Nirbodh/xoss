// routes/tournaments.js - COMPLETE FILE FOR TOURNAMENTS ONLY
const express = require('express');
const Tournament = require('../models/Tournament');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Data mapping function for tournaments
const mapTournamentData = (reqBody, userId) => {
  console.log('🔄 Mapping tournament data:', reqBody);
  
  return {
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',
    
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
    
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 50,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
    
    type: reqBody.type || 'Squad',
    map: reqBody.map || 'Bermuda',
    match_type: 'tournament',
    
    room_id: reqBody.room_id || reqBody.roomId || '',
    room_password: reqBody.room_password || reqBody.password || '',
    
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    
    status: 'upcoming',
    approval_status: 'approved',
    created_by: userId,
    approved_by: userId,
    approved_at: new Date()
  };
};

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching ALL tournaments...');
    
    const tournaments = await Tournament.find({})
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tournaments.length} tournaments`);
    
    const approvedCount = tournaments.filter(t => t.approval_status === 'approved').length;
    const pendingCount = tournaments.filter(t => t.approval_status === 'pending').length;
    const rejectedCount = tournaments.filter(t => t.approval_status === 'rejected').length;
    
    console.log(`📊 Status breakdown: Approved: ${approvedCount}, Pending: ${pendingCount}, Rejected: ${rejectedCount}`);
    
    res.json({ 
      success: true, 
      tournaments, 
      count: tournaments.length,
      statusCounts: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount
      }
    });
  } catch (err) {
    console.error('❌ GET tournaments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE tournament
router.post('/create', auth, async (req, res) => {
  try {
    console.log('📥 Received tournament creation request:', req.body);
    console.log('👤 User creating tournament:', req.user);
    
    const tournamentData = mapTournamentData(req.body, req.user.userId);

    console.log('🔄 Mapped tournament data:', tournamentData);

    const requiredFields = ['title', 'game', 'max_participants'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!tournamentData[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    if (!tournamentData.schedule_time || isNaN(tournamentData.schedule_time.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid schedule time provided'
      });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('created_by', 'username');
    await tournament.populate('approved_by', 'username');
    
    console.log('✅ Tournament created successfully (Auto-approved):', tournament._id);
    
    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament created successfully and is now live! (Auto-approved)'
    });
  } catch (err) {
    console.error('❌ Tournament creation error:', err);
    res.status(400).json({ 
      success: false, 
      message: `Create failed: ${err.message}`,
      errorDetails: err.errors ? Object.keys(err.errors) : 'Unknown error'
    });
  }
});

// Alternative CREATE endpoint
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 SIMPLE CREATE tournament request:', req.body);
    
    const tournamentData = {
      title: req.body.title,
      game: req.body.game,
      description: req.body.description || '',
      rules: req.body.rules || '',
      entry_fee: Number(req.body.entryFee) || 0,
      total_prize: Number(req.body.prizePool) || 0,
      per_kill: Number(req.body.perKill) || 0,
      max_participants: Number(req.body.maxPlayers) || 50,
      current_participants: 0,
      type: req.body.type || 'Squad',
      map: req.body.map || 'Bermuda',
      match_type: 'tournament',
      room_id: req.body.roomId || '',
      room_password: req.body.password || '',
      start_time: new Date(req.body.startTime || req.body.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
      end_time: new Date(req.body.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
      schedule_time: new Date(req.body.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
      status: 'upcoming',
      approval_status: 'approved',
      approved_by: req.user.userId,
      approved_at: new Date(),
      created_by: req.user.userId
    };

    console.log('🔄 Simple tournament data:', tournamentData);

    if (!tournamentData.title || !tournamentData.game) {
      return res.status(400).json({
        success: false,
        message: 'Title and game are required'
      });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('created_by', 'username');
    await tournament.populate('approved_by', 'username');

    res.json({
      success: true,
      tournament,
      message: 'Tournament created successfully and is now live! (Auto-approved)'
    });
  } catch (err) {
    console.error('❌ Simple create tournament error:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// ADMIN: Get pending tournaments
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const tournaments = await Tournament.find({ 
      approval_status: 'pending'
    })
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`📊 ADMIN: Found ${tournaments.length} pending tournaments`);
    
    res.json({ 
      success: true, 
      tournaments, 
      count: tournaments.length,
      message: tournaments.length === 0 ? 'No pending tournaments (All tournaments are auto-approved)' : 'Found pending tournaments'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// ADMIN: Approve tournament
router.post('/admin/approve/:id', adminAuth, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'approved',
        status: 'upcoming',
        approved_by: req.user.userId,
        approved_at: new Date(),
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    )
      .populate('created_by', 'username email')
      .populate('approved_by', 'username');

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    console.log('✅ ADMIN: Tournament approved:', tournament._id);

    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament approved successfully'
    });
  } catch (err) {
    console.error('❌ ADMIN approve tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// ADMIN: Reject tournament
router.post('/admin/reject/:id', adminAuth, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'rejected',
        status: 'cancelled',
        rejection_reason: req.body.rejectionReason || 'No reason provided',
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    )
      .populate('created_by', 'username email')
      .populate('approved_by', 'username');

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    console.log('✅ ADMIN: Tournament rejected:', tournament._id);

    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament rejected successfully'
    });
  } catch (err) {
    console.error('❌ ADMIN reject tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// UPDATE tournament
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = mapTournamentData(req.body, req.user.userId);
    
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'username')
      .populate('approved_by', 'username');
    
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
    res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// DELETE tournament
router.delete('/:id', auth, async (req, res) => {
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
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

module.exports = router;
