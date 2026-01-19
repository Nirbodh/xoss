const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Match = require('../models/Match');

// Get room info for a match
router.get('/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId)
      .select('room_id room_password streaming_link custom_room_settings title game schedule_time')
      .populate('created_by', 'username avatar');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user is a participant
    const isParticipant = match.participants.some(p => 
      p.user && p.user.toString() === req.user.userId.toString()
    );
    
    const isCreator = match.created_by._id.toString() === req.user.userId.toString();
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    
    // Prepare room info based on user role
    const roomInfo = {
      match_id: match._id,
      title: match.title,
      game: match.game,
      schedule_time: match.schedule_time,
      created_by: match.created_by,
      streaming_link: match.streaming_link,
      custom_room_settings: match.custom_room_settings,
      room_id: match.room_id,
      room_password: null, // Hide password by default
      access_level: 'none'
    };
    
    // Show password to participants, creator, and admins
    if (isParticipant || isCreator || isAdmin) {
      roomInfo.room_password = match.room_password;
      roomInfo.access_level = isCreator || isAdmin ? 'full' : 'participant';
    }
    
    // Add room status
    const now = new Date();
    const startTime = new Date(match.schedule_time);
    const timeUntilStart = startTime - now;
    
    roomInfo.room_status = {
      is_active: timeUntilStart <= 0,
      time_until_start: timeUntilStart > 0 ? timeUntilStart : 0,
      human_readable: timeUntilStart > 0 ? 
        `${Math.floor(timeUntilStart / (1000 * 60 * 60))}h ${Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60))}m` : 
        'Started'
    };
    
    res.json({
      success: true,
      code: 'ROOM_INFO_FETCHED',
      message: 'Room information fetched successfully',
      data: roomInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET ROOM INFO ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ROOM_ERROR',
      message: 'Failed to fetch room information',
      timestamp: new Date().toISOString()
    });
  }
});

// Update room info (match creator or admin only)
router.put('/match/:matchId/update', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { room_id, room_password, streaming_link, custom_room_settings } = req.body;
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check authorization
    const isCreator = match.created_by.toString() === req.user.userId.toString();
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Only match creator or admin can update room info',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if match has started
    const now = new Date();
    const startTime = new Date(match.schedule_time);
    
    if (now >= startTime && !isAdmin) {
      return res.status(400).json({
        success: false,
        code: 'MATCH_STARTED',
        message: 'Cannot update room info after match has started',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update room info
    if (room_id !== undefined) match.room_id = room_id;
    if (room_password !== undefined) match.room_password = room_password;
    if (streaming_link !== undefined) match.streaming_link = streaming_link;
    if (custom_room_settings !== undefined) {
      match.custom_room_settings = {
        ...match.custom_room_settings,
        ...custom_room_settings
      };
    }
    
    await match.save();
    
    res.json({
      success: true,
      code: 'ROOM_UPDATED',
      message: 'Room information updated successfully',
      data: {
        match_id: match._id,
        room_id: match.room_id,
        streaming_link: match.streaming_link,
        custom_room_settings: match.custom_room_settings,
        updated_at: match.updatedAt
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ UPDATE ROOM ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update room information',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate random room ID
router.post('/generate-id', auth, async (req, res) => {
  try {
    const { prefix = 'ROOM', length = 8 } = req.body;
    
    // Generate random alphanumeric ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = prefix;
    
    for (let i = 0; i < length; i++) {
      roomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Generate random password
    const password = Math.random().toString(36).slice(-6).toUpperCase();
    
    res.json({
      success: true,
      code: 'ROOM_GENERATED',
      message: 'Room ID generated successfully',
      data: {
        room_id: roomId,
        room_password: password,
        suggestions: [
          `${prefix}${Math.random().toString(36).slice(-length).toUpperCase()}`,
          `${prefix}${Date.now().toString(36).toUpperCase()}`,
          `${prefix}${Math.floor(Math.random() * 1000000).toString().padStart(length, '0')}`
        ]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GENERATE ROOM ID ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'GENERATION_ERROR',
      message: 'Failed to generate room ID',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all rooms for a user (created or joined)
router.get('/user/my-rooms', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'all', limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    
    if (type === 'created') {
      query.created_by = userId;
    } else if (type === 'joined') {
      query['participants.user'] = userId;
    } else {
      // all - both created and joined
      query.$or = [
        { created_by: userId },
        { 'participants.user': userId }
      ];
    }
    
    // Only get matches with room info
    query.$or = [
      { room_id: { $ne: '', $exists: true } },
      { room_password: { $ne: '', $exists: true } },
      { streaming_link: { $ne: '', $exists: true } }
    ];
    
    const matches = await Match.find(query)
      .select('room_id room_password streaming_link title game schedule_time status current_participants max_participants created_by')
      .populate('created_by', 'username avatar')
      .sort({ schedule_time: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Match.countDocuments(query);
    
    // Format response
    const rooms = matches.map(match => ({
      match_id: match._id,
      title: match.title,
      game: match.game,
      schedule_time: match.schedule_time,
      status: match.status,
      participants: {
        current: match.current_participants,
        max: match.max_participants
      },
      room_info: {
        room_id: match.room_id,
        has_password: !!match.room_password,
        streaming_link: match.streaming_link,
        created_by: match.created_by
      },
      access_level: match.created_by._id.toString() === userId.toString() ? 'creator' : 'participant'
    }));
    
    res.json({
      success: true,
      code: 'USER_ROOMS_FETCHED',
      message: 'User rooms fetched successfully',
      data: rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET USER ROOMS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch user rooms',
      timestamp: new Date().toISOString()
    });
  }
});

// Get active rooms (rooms with upcoming matches)
router.get('/active/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const matches = await Match.find({
      status: { $in: ['upcoming', 'registration_open'] },
      schedule_time: { $gte: now, $lte: next24Hours },
      room_id: { $ne: '', $exists: true }
    })
      .select('room_id title game schedule_time streaming_link current_participants max_participants')
      .populate('created_by', 'username avatar')
      .sort({ schedule_time: 1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      code: 'ACTIVE_ROOMS_FETCHED',
      message: 'Active rooms fetched successfully',
      data: matches.map(match => ({
        match_id: match._id,
        title: match.title,
        game: match.game,
        schedule_time: match.schedule_time,
        room_id: match.room_id,
        streaming_link: match.streaming_link,
        participants: {
          current: match.current_participants,
          max: match.max_participants,
          spots_left: match.max_participants - match.current_participants
        },
        created_by: match.created_by,
        time_until_start: new Date(match.schedule_time) - now
      })),
      count: matches.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET ACTIVE ROOMS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch active rooms',
      timestamp: new Date().toISOString()
    });
  }
});

// Verify room access
router.post('/verify-access', auth, async (req, res) => {
  try {
    const { match_id, room_password } = req.body;
    
    if (!match_id || !room_password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Match ID and room password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const match = await Match.findById(match_id)
      .select('room_password title game schedule_time');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user is a participant
    const isParticipant = match.participants.some(p => 
      p.user && p.user.toString() === req.user.userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You are not a participant in this match',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify password
    const isPasswordCorrect = match.room_password === room_password;
    
    res.json({
      success: true,
      code: isPasswordCorrect ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      message: isPasswordCorrect ? 
        'Room access verified successfully' : 
        'Incorrect room password',
      data: {
        match_id: match._id,
        title: match.title,
        game: match.game,
        access_granted: isPasswordCorrect,
        verified_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ VERIFY ROOM ACCESS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'VERIFICATION_ERROR',
      message: 'Failed to verify room access',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
