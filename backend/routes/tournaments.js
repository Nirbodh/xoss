// routes/tournaments.js - COMPLETELY FIXED - TOURNAMENT AUTO-APPROVED
const express = require('express');
const Tournament = require('../models/Tournament');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ FIXED DATA MAPPING FUNCTION - TOURNAMENT AUTO-APPROVED
const mapTournamentData = (reqBody, userId) => {
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
    
    // Timing - ✅ FIXED: Handle missing dates properly
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    
    // ✅ CRITICAL FIX: Tournament AUTO-APPROVED by default
    status: 'upcoming', // সরাসরি upcoming হবে
    approval_status: 'approved', // Auto-approved
    created_by: userId,
    
    // ✅ Auto-set approval fields
    approved_by: userId, // যিনি ক্রিয়েট করছেন তিনিই approve করছেন
    approved_at: new Date()
  };
};

// ✅ FIXED: GET all tournaments - SHOW ALL (approved + pending)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching ALL tournaments (all statuses)...');
    
    // ✅ Get ALL tournaments (both approved and pending)
    const tournaments = await Tournament.find({})
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tournaments.length} tournaments (all statuses)`);
    
    // Count by status for debugging
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

// ✅ CREATE tournament - TOURNAMENT AUTO-APPROVED (HARDCODED)
router.post('/create', auth, async (req, res) => {
  try {
    console.log('📥 Received tournament creation request:', req.body);
    console.log('👤 User creating tournament:', req.user);
    
    // ✅ FIXED: Pass userId to mapTournamentData
    const tournamentData = mapTournamentData(req.body, req.user.userId);

    console.log('🔄 Mapped tournament data:', tournamentData);
    console.log('✅ Tournament will be created with AUTO-APPROVED status:', {
      status: tournamentData.status,
      approval_status: tournamentData.approval_status,
      approved_by: tournamentData.approved_by,
      approved_at: tournamentData.approved_at
    });

    // ✅ FIXED: Better validation with specific messages
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

    // ✅ FIXED: Validate schedule_time
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
    console.log('📊 Tournament details:', {
      status: tournament.status,
      approval_status: tournament.approval_status,
      approved_by: tournament.approved_by,
      approved_at: tournament.approved_at
    });
    
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

// ✅ SIMPLIFIED CREATE endpoint (alternative) - TOURNAMENT AUTO-APPROVED
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 SIMPLE CREATE tournament request:', req.body);
    
    // ✅ SIMPLE DATA MAPPING - AUTO-APPROVED (HARDCODED)
    const tournamentData = {
      title: req.body.title,
      game: req.body.game,
      description: req.body.description || '',
      rules: req.body.rules || '',
      entry_fee: Number(req.body.entryFee) || 0,
      total_prize: Number(req.body.prizePool) || 0,
      per_kill: Number(reqBody.perKill) || 0,
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
      
      // ✅ FIXED: Tournament auto-approved (HARDCODED - NO REQBODY)
      status: 'upcoming',
      approval_status: 'approved',
      approved_by: req.user.userId,
      approved_at: new Date(),
      
      created_by: req.user.userId
    };

    console.log('🔄 Simple tournament data:', tournamentData);
    console.log('✅ Tournament will be created with status:', {
      status: tournamentData.status,
      approval_status: tournamentData.approval_status
    });

    // Basic validation
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

// ✅ ADMIN: Get pending tournaments (if any exist)
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

// ✅ ADMIN: Approve tournament (for manual approval if needed)
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

// ✅ ADMIN: Reject tournament
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

// ✅ UPDATE tournament
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

// ✅ DELETE tournament
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
