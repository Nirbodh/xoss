// routes/tournaments.js - FIXED TO ACCEPT BOTH FIELD FORMATS
const express = require('express');
const Tournament = require('../models/Tournament');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ UPDATED DATA MAPPING FUNCTION - ACCEPTS BOTH camelCase AND snake_case
const mapTournamentData = (reqBody) => {
  console.log('🔄 Mapping tournament data (BOTH FORMATS):', reqBody);
  
  return {
    // Basic info
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',
    
    // Financial - ✅ ACCEPT BOTH FORMATS
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
    
    // Participants - ✅ ACCEPT BOTH FORMATS
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 50,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
    
    // Game settings
    type: reqBody.type || 'Squad',
    map: reqBody.map || 'Bermuda',
    match_type: reqBody.match_type || reqBody.matchType || 'tournament',
    
    // Room info
    room_id: reqBody.room_id || reqBody.roomId || '',
    room_password: reqBody.room_password || reqBody.password || '',
    
    // Timing - ✅ ACCEPT BOTH FORMATS
    start_time: new Date(reqBody.start_time || reqBody.startTime),
    end_time: new Date(reqBody.end_time || reqBody.endTime),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime), // ✅ BOTH!
    
    // Status
    status: reqBody.status || 'pending',
    approval_status: reqBody.approval_status || reqBody.approvalStatus || 'pending',
    created_by: reqBody.created_by || req.user?.userId
  };
};

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    let filter = {};
    
    if (!req.user || req.user.role !== 'admin') {
      filter.approval_status = 'approved';
    }

    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      tournaments, 
      count: tournaments.length 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ CREATE tournament - ACCEPTS BOTH FIELD FORMATS
router.post('/create', auth, async (req, res) => {
  try {
    console.log('📥 Received tournament creation request:', req.body);
    
    const tournamentData = mapTournamentData(req.body);
    tournamentData.created_by = req.user.userId;

    console.log('🔄 Mapped tournament data:', tournamentData);

    // ✅ CHECK FOR BOTH FIELD FORMATS IN VALIDATION
    const requiredFields = ['title', 'game', 'max_participants'];
    
    // Check for schedule_time OR scheduleTime
    if (!tournamentData.schedule_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: scheduleTime or schedule_time',
        receivedData: req.body
      });
    }

    const missingFields = requiredFields.filter(field => !tournamentData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedData: req.body
      });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('created_by', 'username');
    
    console.log('✅ Tournament created successfully:', tournament._id);
    
    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament created successfully and sent for admin approval'
    });
  } catch (err) {
    console.error('❌ Tournament creation error:', err);
    res.status(400).json({ 
      success: false, 
      message: `Create failed: ${err.message}`,
      errorDetails: err.errors
    });
  }
});

// UPDATE tournament
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = mapTournamentData(req.body);
    
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'username');
    
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

// Admin approval routes
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const tournaments = await Tournament.find({ approval_status: 'pending' })
      .populate('created_by', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      tournaments, 
      count: tournaments.length 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

router.post('/admin/approve/:id', adminAuth, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'approved',
        status: 'upcoming',
        approved_by: req.user.userId,
        approved_at: new Date()
      },
      { new: true }
    ).populate('created_by', 'username email');

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament approved successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

router.post('/admin/reject/:id', adminAuth, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'rejected',
        status: 'cancelled',
        rejection_reason: req.body.rejectionReason || 'No reason provided'
      },
      { new: true }
    ).populate('created_by', 'username email');

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament rejected successfully'
    });
  } catch (err) {
    res.status(500).json({ 
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
