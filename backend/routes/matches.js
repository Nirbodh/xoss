// routes/matches.js - FINAL COMPLETE VERSION
const express = require('express');
const Match = require('../models/Match');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ FIXED: DATA MAPPING FOR MATCHES (Auto-approved for admin)
const mapMatchData = (reqBody, user) => {
  console.log('🔄 Mapping match data (ADMIN/User):', reqBody);
  
  const isAdmin = user?.role === 'admin';
  const isTournament = reqBody.match_type === 'tournament' || reqBody.matchType === 'tournament';
  
  // Don't create tournaments here - redirect to tournaments.js
  if (isTournament) {
    console.log('❌ Warning: Tournament creation attempted in matches.js');
    return null;
  }
  
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
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 25,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,

    // Game settings
    type: reqBody.type || 'Solo',
    map: reqBody.map || 'Bermuda',
    match_type: 'match', // Always 'match' for this route

    // Room info
    room_id: reqBody.room_id || reqBody.roomId || '',
    room_password: reqBody.room_password || reqBody.password || '',

    // Timing
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime),

    // ✅ FIXED: Admin auto-approved, User pending
    status: isAdmin ? 'upcoming' : 'pending',
    approval_status: isAdmin ? 'approved' : 'pending',
    created_by: user.userId,
    
    // Admin approval fields
    approved_by: isAdmin ? user.userId : null,
    approved_at: isAdmin ? new Date() : null
  };
};

// ✅ GET all matches (ADMIN sees ALL, users see only approved)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /matches - User role:', req.user?.role);
    
    const { 
      limit = 100, 
      page = 1, 
      status,
      game,
      search,
      approval_status,
      match_type = 'match' // Only matches
    } = req.query;

    let filter = { match_type: 'match' };
    
    // Check if user is admin
    const isAdmin = req.user?.role === 'admin';
    
    if (!isAdmin) {
      // For non-admin users, show only approved and upcoming/live
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live'] };
    }

    // Apply additional filters if provided
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

    // Fetch matches
    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalMatches = await Match.countDocuments(filter);

    console.log(`✅ Found ${matches.length} matches out of ${totalMatches} total`);

    res.json({
      success: true,
      count: matches.length,
      total: totalMatches,
      page: pageNumber,
      pages: Math.ceil(totalMatches / pageSize),
      data: matches
    });

  } catch (err) {
    console.error('❌ GET matches error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ✅ CREATE match
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 CREATE match request from:', req.user.role);
    console.log('📦 Request body:', req.body);
    
    // Check if trying to create tournament
    if (req.body.match_type === 'tournament' || req.body.matchType === 'tournament') {
      return res.status(400).json({
        success: false,
        message: 'Use /tournaments endpoint for tournaments'
      });
    }

    const matchData = mapMatchData(req.body, req.user);
    
    if (!matchData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match data'
      });
    }

    console.log('✅ Match data:', {
      title: matchData.title,
      match_type: matchData.match_type,
      status: matchData.status,
      approval_status: matchData.approval_status
    });

    // Validation
    if (!matchData.title || !matchData.game) {
      return res.status(400).json({
        success: false,
        message: 'Title and game are required'
      });
    }

    const match = await Match.create(matchData);
    await match.populate('created_by', 'username');
    await match.populate('approved_by', 'username');

    console.log(`✅ Match created: ${match._id}, Status: ${match.approval_status}`);

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Match created successfully and is live!' 
        : 'Match created successfully! Waiting for admin approval.',
      data: match
    });
  } catch (error) {
    console.error('❌ CREATE match error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create match',
      error: error.message
    });
  }
});

// ✅ GET match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .populate('participants.user', 'username email');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('❌ GET match by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match',
      error: error.message
    });
  }
});

// ✅ UPDATE match
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = mapMatchData(req.body, req.user);

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'username')
      .populate('approved_by', 'username');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      message: 'Match updated successfully',
      data: match
    });
  } catch (error) {
    console.error('❌ UPDATE match error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update match',
      error: error.message
    });
  }
});

// ✅ DELETE match
router.delete('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('❌ DELETE match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete match',
      error: error.message
    });
  }
});

// ✅ UPDATE match status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'upcoming', 'live', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('created_by', 'username');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      message: 'Match status updated successfully',
      data: match
    });
  } catch (error) {
    console.error('❌ UPDATE match status error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update match status',
      error: error.message
    });
  }
});

// ✅ JOIN match
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    if (match.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Match is not joinable'
      });
    }

    const alreadyJoined = match.participants.some(
      participant => participant.user.toString() === req.user.userId
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this match'
      });
    }

    if (match.current_participants >= match.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'No spots left in this match'
      });
    }

    match.participants.push({
      user: req.user.userId,
      status: 'joined'
    });

    match.current_participants += 1;
    await match.save();

    await match.populate('participants.user', 'username');

    res.json({
      success: true,
      message: 'Successfully joined match',
      data: match
    });
  } catch (error) {
    console.error('❌ JOIN match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join match',
      error: error.message
    });
  }
});

// ==============================================
// ✅ ADMIN ENDPOINTS
// ==============================================

// ✅ ADMIN: Get all matches without filter
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching ALL matches...');
    
    const allMatches = await Match.find({ match_type: 'match' })
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });

    console.log(`✅ ADMIN: Found ${allMatches.length} matches`);

    res.json({
      success: true,
      total: allMatches.length,
      data: allMatches,
      message: 'All matches fetched for admin'
    });
  } catch (error) {
    console.error('❌ ADMIN all matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all matches',
      error: error.message
    });
  }
});

// ✅ ADMIN: Get pending matches
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      match_type: 'match',
      approval_status: 'pending'
    })
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Match.countDocuments({
      match_type: 'match',
      approval_status: 'pending'
    });

    res.json({
      success: true,
      data: matches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ ADMIN pending matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending matches',
      error: error.message
    });
  }
});

// ✅ ADMIN: Approve match
router.post('/admin/approve/:id', adminAuth, async (req, res) => {
  try {
    console.log('✅ ADMIN: Approving match:', req.params.id);
    
    const match = await Match.findByIdAndUpdate(
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

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log('✅ Match approved successfully:', match._id);

    res.json({
      success: true,
      message: 'Match approved successfully',
      data: match
    });
  } catch (error) {
    console.error('❌ ADMIN approve match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve match',
      error: error.message
    });
  }
});

// ✅ ADMIN: Reject match
router.post('/admin/reject/:id', adminAuth, async (req, res) => {
  try {
    console.log('❌ ADMIN: Rejecting match:', req.params.id);
    
    const match = await Match.findByIdAndUpdate(
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

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log('✅ Match rejected successfully:', match._id);

    res.json({
      success: true,
      message: 'Match rejected successfully',
      data: match
    });
  } catch (error) {
    console.error('❌ ADMIN reject match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject match',
      error: error.message
    });
  }
});

// ✅ DEBUG endpoint
router.get('/debug/all', adminAuth, async (req, res) => {
  try {
    const allMatches = await Match.find({ match_type: 'match' }).sort({ createdAt: -1 });
    const approvedMatches = await Match.find({ match_type: 'match', approval_status: 'approved' });
    const pendingMatches = await Match.find({ match_type: 'match', approval_status: 'pending' });
    const upcomingMatches = await Match.find({ match_type: 'match', status: 'upcoming' });
    const completedMatches = await Match.find({ match_type: 'match', status: 'completed' });

    res.json({
      success: true,
      counts: {
        total: allMatches.length,
        approved: approvedMatches.length,
        pending: pendingMatches.length,
        upcoming: upcomingMatches.length,
        completed: completedMatches.length
      },
      allMatches: allMatches.map(m => ({
        id: m._id,
        title: m.title,
        status: m.status,
        approval_status: m.approval_status,
        game: m.game
      }))
    });
  } catch (error) {
    console.error('❌ DEBUG error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

module.exports = router;
