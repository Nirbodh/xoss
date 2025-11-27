const express = require('express');
const Match = require('../models/Match');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ UNIFIED DATA MAPPING FUNCTION
const mapMatchData = (reqBody) => {
  console.log('🔄 Mapping match data:', reqBody);
  
  return {
    // Basic info
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',
    
    // Financial - ✅ CONSISTENT BACKEND FIELDS
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
    
    // Participants - ✅ CONSISTENT BACKEND FIELDS
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 25,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
    
    // Game settings
    type: reqBody.type || 'Solo',
    map: reqBody.map || 'Bermuda',
    match_type: reqBody.match_type || reqBody.matchType || 'match',
    
    // Room info
    room_id: reqBody.room_id || reqBody.roomId || reqBody.room_code || '',
    room_password: reqBody.room_password || reqBody.password || reqBody.room_password || '',
    
    // Timing
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime),
    
    // Status & Approval
    status: reqBody.status || 'pending',
    approval_status: reqBody.approval_status || reqBody.approvalStatus || 'pending',
    created_by: reqBody.created_by
  };
};

// ✅ GET all matches
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching matches...');
    
    let filter = {};
    
    if (!req.user || req.user.role !== 'admin') {
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live'] };
    }

    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .sort({ schedule_time: 1 });
    
    console.log(`✅ Found ${matches.length} matches`);

    res.json({
      success: true,
      data: matches,
      count: matches.length
    });
  } catch (error) {
    console.error('❌ GET matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
});

// ✅ CREATE match - FIXED REQUIRED FIELDS
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 CREATE match request:', req.body);
    
    const requiredFields = ['title', 'game', 'max_participants', 'schedule_time'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field] || req.body[field.replace('_', '')];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const matchData = mapMatchData(req.body);
    matchData.created_by = req.user.userId;

    console.log('✅ Processed match data:', matchData);

    if (isNaN(matchData.max_participants) || matchData.max_participants <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid max_participants value'
      });
    }

    if (isNaN(matchData.schedule_time.getTime()) || 
        isNaN(matchData.start_time.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const match = await Match.create(matchData);
    await match.populate('created_by', 'username');
    
    console.log('✅ Match created successfully:', match._id);
    
    res.status(201).json({
      success: true,
      message: 'Match created successfully',
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
    const updateData = mapMatchData(req.body);
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'username');

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
    );

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

// ✅ ADMIN: Get pending matches for approval
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const matches = await Match.find({ 
      approval_status: 'pending' 
    })
    .populate('created_by', 'username email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await Match.countDocuments({ 
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
    ).populate('created_by', 'username email');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

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
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'rejected',
        status: 'cancelled',
        rejection_reason: req.body.rejectionReason || 'No reason provided',
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    ).populate('created_by', 'username email');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

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

module.exports = router;
