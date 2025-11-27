// routes/combined.js - COMPLETELY FIXED VERSION
const express = require('express');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const { auth } = require('../middleware/auth');
const router = express.Router();

// ✅ GET combined events (matches + tournaments) - FIXED ADMIN FILTER
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching combined events...');
    
    let filter = {};
    
    // ✅ FIXED: For non-admin users only, show approved and upcoming/live
    if (!req.user || req.user.role !== 'admin') {
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live'] }; // Only for non-admin
    }
    // Admin users will see ALL events (no status filter)

    console.log('📊 Filter criteria:', filter);

    const [tournaments, matches] = await Promise.all([
      Tournament.find(filter)
        .populate('created_by', 'username')
        .sort({ schedule_time: 1 }),
      Match.find(filter)
        .populate('created_by', 'username') 
        .sort({ schedule_time: 1 })
    ]);

    console.log(`📈 Found ${tournaments.length} tournaments, ${matches.length} matches`);

    // ✅ CONSISTENT DATA MAPPING FOR FRONTEND
    const combinedEvents = [
      ...tournaments.map(tournament => ({
        // Basic info
        id: tournament._id,
        _id: tournament._id,
        title: tournament.title,
        game: tournament.game,
        description: tournament.description,
        rules: tournament.rules,
        
        // Financial - FRONTEND FIELD NAMES
        prizePool: tournament.total_prize,
        entryFee: tournament.entry_fee,
        perKill: tournament.per_kill,
        
        // Participants - FRONTEND FIELD NAMES
        maxPlayers: tournament.max_participants,
        currentPlayers: tournament.current_participants,
        maxParticipants: tournament.max_participants,
        currentParticipants: tournament.current_participants,
        spotsLeft: tournament.max_participants - tournament.current_participants,
        
        // Game settings
        type: tournament.type,
        map: tournament.map,
        matchType: 'tournament',
        
        // Room info
        roomId: tournament.room_id,
        password: tournament.room_password,
        
        // Timing
        scheduleTime: tournament.schedule_time,
        startTime: tournament.start_time,
        endTime: tournament.end_time,
        
        // Status
        status: tournament.status,
        approvalStatus: tournament.approval_status,
        registered: tournament.registered || false,
        
        // Creator
        created_by: tournament.created_by,
        
        // Virtual fields
        prizePool: tournament.prizePool,
        entryFee: tournament.entryFee,
        perKill: tournament.perKill
      })),
      ...matches.map(match => ({
        // Basic info
        id: match._id,
        _id: match._id,
        title: match.title,
        game: match.game,
        description: match.description,
        rules: match.rules,
        
        // Financial - FRONTEND FIELD NAMES
        prizePool: match.total_prize,
        entryFee: match.entry_fee,
        perKill: match.per_kill,
        
        // Participants - FRONTEND FIELD NAMES
        maxPlayers: match.max_participants,
        currentPlayers: match.current_participants,
        maxParticipants: match.max_participants,
        currentParticipants: match.current_participants,
        spotsLeft: match.max_participants - match.current_participants,
        
        // Game settings
        type: match.type,
        map: match.map,
        matchType: 'match',
        
        // Room info
        roomId: match.room_id,
        password: match.room_password,
        
        // Timing
        scheduleTime: match.schedule_time,
        startTime: match.start_time,
        endTime: match.end_time,
        
        // Status
        status: match.status,
        approvalStatus: match.approval_status,
        registered: match.registered || false,
        
        // Creator
        created_by: match.created_by,
        
        // Virtual fields
        prizePool: match.prizePool,
        entryFee: match.entryFee,
        perKill: match.perKill
      }))
    ];

    // Sort by schedule time (soonest first)
    combinedEvents.sort((a, b) => new Date(a.scheduleTime) - new Date(b.scheduleTime));

    console.log(`✅ Combined ${combinedEvents.length} events successfully`);

    res.json({
      success: true,
      data: combinedEvents,
      count: combinedEvents.length,
      message: 'Events fetched successfully'
    });

  } catch (error) {
    console.error('❌ Combined events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// ✅ HEALTH CHECK ENDPOINT
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Combined events API is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
