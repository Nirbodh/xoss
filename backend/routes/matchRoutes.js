const express = require('express');
const Match = require('../models/Match');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ UNIFIED DATA MAPPING FUNCTION
const mapMatchData = (reqBody) => ({
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
  start_time: new Date(reqBody.start_time || reqBody.startTime),
  end_time: new Date(reqBody.end_time || reqBody.endTime),
  schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime),
  
  // Status
  status: reqBody.status || 'pending',
  approval_status: reqBody.approval_status || reqBody.approvalStatus || 'pending',
  created_by: reqBody.created_by
});

// ✅ CREATE match
router.post('/', auth, async (req, res) => {
  try {
    const matchData = mapMatchData(req.body);
    matchData.created_by = req.user?.userId;

    const match = await Match.create(matchData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Match created successfully', 
      data: match 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create match', 
      error: error.message 
    });
  }
});

// ✅ GET all matches
router.get('/', async (req, res) => {
  try {
    let filter = {};
    
    if (!req.user || req.user.role !== 'admin') {
      filter.approval_status = 'approved';
    }

    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
});

// Other routes (getById, update, delete, updateStatus) remain similar with consistent mapping

module.exports = router;
