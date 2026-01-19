// controllers/matchController.js - COMPLETE ERROR-FREE PRODUCTION VERSION
const Match = require('../models/Match');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ✅ HELPER: Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
};

// ✅ HELPER: Validate match data
const validateMatchData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!data.game || data.game.trim().length === 0) {
    errors.push('Game is required');
  }
  
  const entryFee = parseFloat(data.entry_fee || data.entryFee || 0);
  if (isNaN(entryFee) || entryFee < 0) {
    errors.push('Entry fee must be a positive number');
  }
  
  const maxParticipants = parseInt(data.max_participants || data.maxParticipants || 25);
  if (isNaN(maxParticipants) || maxParticipants < 2 || maxParticipants > 100) {
    errors.push('Max participants must be between 2 and 100');
  }
  
  const scheduleTime = new Date(data.schedule_time || data.scheduleTime || data.start_time || data.startTime);
  if (isNaN(scheduleTime.getTime())) {
    errors.push('Invalid schedule time');
  } else if (scheduleTime < new Date()) {
    errors.push('Schedule time cannot be in the past');
  }
  
  return errors;
};

// ✅ HELPER: Map request data to match model
const mapMatchData = (reqBody, userId, userRole) => {
  console.log('🔄 Mapping match data for user:', userId);
  
  const isAdmin = ['admin', 'moderator', 'super_admin'].includes(userRole);
  
  // Parse dates safely
  let scheduleTime;
  try {
    scheduleTime = new Date(reqBody.schedule_time || reqBody.scheduleTime || reqBody.start_time || reqBody.startTime);
    if (isNaN(scheduleTime.getTime())) {
      scheduleTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    }
  } catch (error) {
    scheduleTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }
  
  let startTime;
  try {
    startTime = new Date(reqBody.start_time || reqBody.startTime || scheduleTime);
    if (isNaN(startTime.getTime())) {
      startTime = new Date(scheduleTime.getTime() + 30 * 60 * 1000); // 30 minutes after schedule
    }
  } catch (error) {
    startTime = new Date(scheduleTime.getTime() + 30 * 60 * 1000);
  }
  
  let endTime;
  try {
    endTime = new Date(reqBody.end_time || reqBody.endTime);
    if (isNaN(endTime.getTime()) || endTime <= startTime) {
      endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
    }
  } catch (error) {
    endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  }
  
  const matchData = {
    // Basic info
    title: (reqBody.title || '').trim(),
    game: (reqBody.game || '').trim(),
    description: (reqBody.description || '').trim(),
    rules: (reqBody.rules || '').trim(),
    
    // Financial
    entry_fee: parseFloat(reqBody.entry_fee || reqBody.entryFee || 0),
    total_prize: parseFloat(reqBody.total_prize || reqBody.prizePool || reqBody.totalPrize || 0),
    per_kill: parseFloat(reqBody.per_kill || reqBody.perKill || 0),
    
    // Participants
    max_participants: parseInt(reqBody.max_participants || reqBody.maxParticipants || reqBody.maxPlayers || 25),
    current_participants: 0,
    
    // Game settings
    type: reqBody.type || 'Solo',
    map: reqBody.map || 'Bermuda',
    match_type: 'match',
    
    // Room info
    room_id: (reqBody.room_id || reqBody.roomId || '').trim(),
    room_password: (reqBody.room_password || reqBody.password || reqBody.roomPassword || '').trim(),
    
    // Timing
    schedule_time: scheduleTime,
    start_time: startTime,
    end_time: endTime,
    
    // Status
    status: isAdmin ? 'upcoming' : 'pending',
    approval_status: isAdmin ? 'approved' : 'pending',
    created_by: userId,
    
    // Additional fields
    platform: reqBody.platform || 'Mobile',
    version: reqBody.version || '1.0',
    streaming_link: reqBody.streaming_link || reqBody.streamingLink || '',
    thumbnail: reqBody.thumbnail || reqBody.image || '',
    tags: Array.isArray(reqBody.tags) ? reqBody.tags : [],
    is_featured: reqBody.is_featured || false,
    is_private: reqBody.is_private || false,
    requires_verification: reqBody.requires_verification || false
  };
  
  // Set auto-approval for admin
  if (isAdmin) {
    matchData.approved_by = userId;
    matchData.approved_at = new Date();
    matchData.admin_notes = reqBody.admin_notes || 'Auto-approved by admin';
  }
  
  return matchData;
};

// ✅ CREATE MATCH
exports.createMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('📥 CREATE match request received');
    console.log('👤 User:', req.user);
    console.log('📦 Request body:', req.body);
    
    // Validate user
    if (!req.user || !req.user.userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role || 'user';
    
    // Validate match data
    const validationErrors = validateMatchData(req.body);
    if (validationErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Match data validation failed',
        errors: validationErrors,
        timestamp: new Date().toISOString()
      });
    }
    
    // Map request data to match model
    const matchData = mapMatchData(req.body, userId, userRole);
    
    // Create match
    const match = await Match.create([matchData], { session });
    const createdMatch = match[0];
    
    // Populate creator info
    await createdMatch.populate('created_by', 'username name email');
    if (createdMatch.approved_by) {
      await createdMatch.populate('approved_by', 'username name');
    }
    
    // Create notification for admin (if not auto-approved)
    if (userRole === 'user') {
      try {
        const adminUsers = await User.find({ role: { $in: ['admin', 'moderator'] } }).session(session);
        
        for (const admin of adminUsers) {
          await Notification.create([{
            user_id: admin._id,
            type: 'match_pending',
            title: 'New Match Pending Approval',
            message: `New match "${createdMatch.title}" created by ${req.user.username || 'User'}`,
            data: {
              match_id: createdMatch._id,
              match_title: createdMatch.title,
              created_by: userId,
              created_by_name: req.user.username || 'User'
            },
            priority: 'high'
          }], { session });
        }
        console.log(`📢 Notifications sent to ${adminUsers.length} admins`);
      } catch (notifyError) {
        console.error('❌ Notification creation error:', notifyError);
        // Don't fail the transaction because of notification error
      }
    }
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log('✅ Match created successfully:', createdMatch._id);
    
    // Prepare response
    const response = {
      success: true,
      code: 'MATCH_CREATED',
      message: userRole === 'user' 
        ? 'Match created successfully! Waiting for admin approval.' 
        : 'Match created and auto-approved successfully!',
      data: {
        match: createdMatch,
        creator: {
          id: req.user.userId,
          username: req.user.username,
          name: req.user.name
        },
        approval_info: {
          status: createdMatch.approval_status,
          message: createdMatch.approval_status === 'approved' 
            ? 'Match is live and visible to users' 
            : 'Waiting for admin review'
        },
        next_steps: [
          'Share match with friends',
          'Wait for participants to join',
          'Set up room details before start time'
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    // Abort transaction on error
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (sessionError) {
      console.error('❌ Session abort error:', sessionError);
    }
    
    console.error('❌ CREATE match error:', error);
    
    res.status(500).json({
      success: false,
      code: 'MATCH_CREATION_FAILED',
      message: 'Failed to create match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET ALL MATCHES
exports.getMatches = async (req, res) => {
  try {
    console.log('🔍 GET matches request');
    console.log('👤 User role:', req.user?.role || 'guest');
    
    const { 
      limit = 20, 
      page = 1, 
      status,
      game,
      search,
      type,
      min_prize,
      max_prize,
      sort_by = '-createdAt',
      include_pending = 'false'
    } = req.query;
    
    // Build filter
    let filter = {};
    
    // User role-based filtering
    const isAdmin = req.user && ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    const includePending = include_pending === 'true' && isAdmin;
    
    if (!isAdmin || !includePending) {
      // For regular users or when not including pending
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live', 'completed'] };
    }
    
    // Additional filters
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (game && game !== 'all') {
      filter.game = game;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'created_by.username': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (min_prize) {
      filter.total_prize = { ...filter.total_prize, $gte: parseFloat(min_prize) };
    }
    
    if (max_prize) {
      filter.total_prize = { ...filter.total_prize, $lte: parseFloat(max_prize) };
    }
    
    console.log('📊 Filters applied:', filter);
    
    // Pagination
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Build sort
    let sort = {};
    if (sort_by.startsWith('-')) {
      sort[sort_by.substring(1)] = -1;
    } else {
      sort[sort_by] = 1;
    }
    
    // Default sort by schedule_time if not specified
    if (!sort_by || sort_by === 'schedule_time') {
      sort = { schedule_time: 1 };
    }
    
    // Execute query
    const matches = await Match.find(filter)
      .populate('created_by', 'username name avatar')
      .populate('approved_by', 'username name')
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean();
    
    // Get total count
    const totalMatches = await Match.countDocuments(filter);
    
    // Check if user has joined each match
    if (req.user && req.user.userId) {
      const userId = req.user.userId;
      for (const match of matches) {
        match.has_joined = match.participants?.some(p => 
          p.user && p.user.toString() === userId.toString()
        ) || false;
      }
    }
    
    console.log(`✅ Found ${matches.length} matches out of ${totalMatches} total`);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalMatches / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    // Get stats
    const stats = await Match.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_prize_pool: { $sum: '$total_prize' },
          total_participants: { $sum: '$current_participants' },
          upcoming_count: { 
            $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] }
          },
          live_count: { 
            $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] }
          },
          completed_count: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      code: 'MATCHES_FETCHED',
      message: 'Matches fetched successfully',
      data: {
        matches: matches,
        pagination: {
          current_page: pageNumber,
          page_size: pageSize,
          total_items: totalMatches,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          next_page: hasNextPage ? pageNumber + 1 : null,
          prev_page: hasPrevPage ? pageNumber - 1 : null
        },
        filters: {
          status: status || 'all',
          game: game || 'all',
          search: search || '',
          sort_by: sort_by
        },
        stats: stats[0] || {
          total_prize_pool: 0,
          total_participants: 0,
          upcoming_count: 0,
          live_count: 0,
          completed_count: 0
        },
        user_context: {
          is_authenticated: !!req.user,
          is_admin: isAdmin,
          user_id: req.user?.userId
        }
     
