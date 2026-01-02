// routes/tournaments.js - FINAL COMPLETE VERSION
const express = require('express');
const Tournament = require('../models/Tournament');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ FIXED: DATA MAPPING FOR TOURNAMENTS (Auto-approved for admin, Pending for users)
const mapTournamentData = (reqBody, user) => {
  console.log('🔄 Mapping tournament data (ADMIN/User):', reqBody);
  
  const isAdmin = user?.role === 'admin';
  
  return {
    // Basic info
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',
    
    // Financial
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
    
    // Participants
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 50,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
    
    // Game settings
    type: reqBody.type || 'Squad',
    map: reqBody.map || 'Bermuda',
    match_type: 'tournament', // Always 'tournament'
    
    // Room info
    room_id: reqBody.room_id || reqBody.roomId || '',
    room_password: reqBody.room_password || reqBody.password || '',
    
    // Timing
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime),
    
    // ✅ CRITICAL: Admin auto-approved, User pending
    status: isAdmin ? 'upcoming' : 'pending',
    approval_status: isAdmin ? 'approved' : 'pending',
    created_by: user.userId,
    
    // Admin approval fields
    approved_by: isAdmin ? user.userId : null,
    approved_at: isAdmin ? new Date() : null
  };
};

// ✅ GET all tournaments
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /tournaments - User role:', req.user?.role);
    
    const { 
      status,
      game,
      search,
      approval_status,
      page = 1,
      limit = 100
    } = req.query;

    const filter = { match_type: 'tournament' };
    
    // Check if user is admin
    const isAdmin = req.user?.role === 'admin';
    
    if (!isAdmin) {
      // For non-admin users, show only approved and upcoming/live
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live'] };
    }
    
    // Additional filters
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (game && game !== 'all') {
      filter.game = game;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (approval_status && approval_status !== 'all' && isAdmin) {
      filter.approval_status = approval_status;
    }

    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Tournament.countDocuments(filter);

    res.json({
      success: true,
      data: tournaments,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('❌ GET tournaments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ CREATE tournament (Main endpoint)
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 CREATE tournament request from:', req.user.role);
    console.log('📦 Request body:', req.body);
    
    const tournamentData = mapTournamentData(req.body, req.user);

    console.log('✅ Tournament data:', {
      title: tournamentData.title,
      match_type: tournamentData.match_type,
      status: tournamentData.status,
      approval_status: tournamentData.approval_status
    });

    // Validation
    if (!tournamentData.title || !tournamentData.game) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and game are required'
      });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('created_by', 'username');
    await tournament.populate('approved_by', 'username');
    
    console.log(`✅ Tournament created: ${tournament._id}, Status: ${tournament.approval_status}`);
    
    res.json({ 
      success: true, 
      message: req.user.role === 'admin' 
        ? 'Tournament created successfully and is now live!' 
        : 'Tournament created successfully! Waiting for admin approval.',
      data: tournament
    });
  } catch (err) {
    console.error('❌ Tournament creation error:', err);
    res.status(400).json({ 
      success: false, 
      message: `Create failed: ${err.message}`
    });
  }
});

// ✅ CREATE tournament (Alternative endpoint - same logic)
router.post('/create', auth, async (req, res) => {
  try {
    console.log('📥 CREATE /create tournament request from:', req.user.role);
    
    const tournamentData = mapTournamentData(req.body, req.user);

    // Validation
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
      message: req.user.role === 'admin' 
        ? 'Tournament created successfully and is now live!' 
        : 'Tournament created successfully! Waiting for admin approval.',
      data: tournament
    });
  } catch (err) {
    console.error('❌ Tournament creation error:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// ✅ UPDATE tournament
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = mapTournamentData(req.body, req.user);
    
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
      message: 'Tournament updated successfully',
      data: tournament
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

// ==============================================
// ✅ ADMIN ENDPOINTS
// ==============================================

// ✅ ADMIN: Get all tournaments
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching ALL tournaments...');
    
    const allTournaments = await Tournament.find({ match_type: 'tournament' })
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });

    console.log(`✅ ADMIN: Found ${allTournaments.length} tournaments`);

    res.json({ 
      success: true, 
      data: allTournaments,
      total: allTournaments.length,
      message: 'All tournaments fetched for admin'
    });
  } catch (err) {
    console.error('❌ ADMIN all tournaments error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// ✅ ADMIN: Get pending tournaments
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const tournaments = await Tournament.find({ 
      match_type: 'tournament',
      approval_status: 'pending'
    })
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Tournament.countDocuments({
      match_type: 'tournament',
      approval_status: 'pending'
    });

    console.log(`📊 ADMIN: Found ${tournaments.length} pending tournaments`);
    
    res.json({ 
      success: true, 
      data: tournaments,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('❌ ADMIN pending tournaments error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// ✅ ADMIN: Approve tournament
router.post('/admin/approve/:id', adminAuth, async (req, res) => {
  try {
    console.log('✅ ADMIN: Approving tournament:', req.params.id);
    
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

    console.log('✅ Tournament approved successfully:', tournament._id);

    res.json({ 
      success: true, 
      message: 'Tournament approved successfully',
      data: tournament
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
    console.log('❌ ADMIN: Rejecting tournament:', req.params.id);
    
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

    console.log('✅ Tournament rejected successfully:', tournament._id);

    res.json({ 
      success: true, 
      message: 'Tournament rejected successfully',
      data: tournament
    });
  } catch (err) {
    console.error('❌ ADMIN reject tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

module.exports = router;
