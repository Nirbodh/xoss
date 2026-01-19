// controllers/matchController.js - PRODUCTION PRO VERSION
const Match = require('../models/Match');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Redis = require('ioredis');

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Constants
const MATCH_CACHE_TTL = 60; // 1 minute
const LEADERBOARD_CACHE_TTL = 300; // 5 minutes

// ==================== MATCH CREATION ====================
exports.createMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('🎮 CREATE MATCH REQUEST:', {
      user: req.user.username,
      body: req.body,
      ip: req.ip
    });

    // Validate request
    const validation = validateMatchCreation(req.body, req.user);
    if (!validation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(validation.response);
    }

    // Prepare match data
    const matchData = await prepareMatchData(req.body, req.user, session);
    
    // Check user limits
    const limitCheck = await checkUserMatchLimits(req.user.userId, session);
    if (!limitCheck.allowed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(429).json(limitCheck.response);
    }

    // Create match
    const match = await Match.create([matchData], { session });
    const createdMatch = match[0];
    
    // Populate creator info
    await createdMatch.populate('created_by', 'username name rating');
    
    // Auto-approve if admin
    if (req.user.role === 'admin') {
      createdMatch.approval_status = 'approved';
      createdMatch.status = 'upcoming';
      createdMatch.approved_by = req.user.userId;
      createdMatch.approved_at = new Date();
      await createdMatch.save({ session });
    }

    // Clear matches cache
    await clearMatchesCache();
    
    // Create notifications
    await createMatchNotifications(createdMatch, req.user, session);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Log success
    logMatchCreation(createdMatch, req.user);

    // Prepare response
    const response = {
      success: true,
      code: createdMatch.approval_status === 'approved' ? 'MATCH_CREATED_APPROVED' : 'MATCH_CREATED_PENDING',
      message: createdMatch.approval_status === 'approved' 
        ? 'Match created and approved successfully! 🎉' 
        : 'Match created! Waiting for admin approval ⏳',
      data: {
        match: formatMatchResponse(createdMatch),
        creator: {
          id: req.user.userId,
          username: req.user.username,
          rating: req.user.rating || 1000
        },
        approval: {
          status: createdMatch.approval_status,
          message: getApprovalMessage(createdMatch.approval_status),
          next_steps: getNextSteps(createdMatch)
        },
        economic_impact: {
          entry_fee: createdMatch.entry_fee,
          prize_pool: createdMatch.total_prize,
          platform_fee: calculatePlatformFee(createdMatch.entry_fee, createdMatch.max_participants),
          estimated_revenue: calculateEstimatedRevenue(createdMatch)
        },
        share: {
          url: `${process.env.BASE_URL}/matches/${createdMatch._id}`,
          invite_code: generateInviteCode(createdMatch._id),
          social_share_text: `Join my match: ${createdMatch.title} - Prize Pool: ৳${createdMatch.total_prize}`
        }
      },
      timestamp: new Date().toISOString(),
      transaction_id: `MATCH_${createdMatch._id}_${Date.now()}`
    };

    res.status(201).json(response);

  } catch (error) {
    // Handle transaction rollback
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (sessionError) {
      console.error('Session abort error:', sessionError);
    }

    console.error('❌ MATCH CREATION ERROR:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
      endpoint: req.originalUrl
    });

    handleMatchError(res, error);
  }
};

// ==================== GET MATCHES WITH CACHING ====================
exports.getMatches = async (req, res) => {
  try {
    const cacheKey = generateMatchesCacheKey(req.query, req.user);
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving matches from cache');
      return res.json(JSON.parse(cachedData));
    }

    // Build query
    const query = buildMatchesQuery(req.query, req.user);
    
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Execute query
    const [matches, total, stats] = await Promise.all([
      Match.find(query)
        .populate('created_by', 'username name avatar rating')
        .populate('participants.user', 'username avatar')
        .sort(getSortOrder(req.query.sort))
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Match.countDocuments(query),
      
      getMatchesStats(query)
    ]);

    // Enhance matches with user-specific data
    const enhancedMatches = await enhanceMatchesWithUserData(matches, req.user);

    // Prepare response
    const response = {
      success: true,
      code: 'MATCHES_FETCHED',
      message: `Found ${matches.length} matches`,
      data: {
        matches: enhancedMatches,
        meta: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_matches: total,
          matches_per_page: limit,
          has_more: page * limit < total
        },
        filters: {
          applied: req.query,
          available: getAvailableFilters()
        },
        statistics: stats,
        user_context: {
          can_create: canUserCreateMatch(req.user),
          daily_limit: getUserDailyLimit(req.user),
          created_today: await getMatchesCreatedToday(req.user.userId)
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: MATCH_CACHE_TTL
      }
    };

    // Cache the response
    await redis.setex(cacheKey, MATCH_CACHE_TTL, JSON.stringify(response));
    
    res.json(response);

  } catch (error) {
    console.error('❌ GET MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MATCHES_FETCH_ERROR',
      message: 'Failed to fetch matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== JOIN MATCH WITH PAYMENT ====================
exports.joinMatchWithPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const userId = req.user.userId;
    
    console.log('🎮 JOIN MATCH REQUEST:', {
      matchId,
      userId: req.user.username,
      body: req.body
    });

    // Get match with lock
    const match = await Match.findById(matchId).session(session).select('+participants');
    
    if (!match) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found or has been removed',
        timestamp: new Date().toISOString()
      });
    }

    // Validate match status
    const matchValidation = validateMatchForJoining(match);
    if (!matchValidation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(matchValidation.response);
    }

    // Check if user already joined
    if (isUserAlreadyJoined(match.participants, userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_JOINED',
        message: 'You have already joined this match',
        timestamp: new Date().toISOString()
      });
    }

    // Check match capacity
    if (match.current_participants >= match.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MATCH_FULL',
        message: 'Match is full. No spots available.',
        waiting_list_available: match.has_waiting_list || false,
        timestamp: new Date().toISOString()
      });
    }

    // Process payment
    const paymentResult = await processMatchPayment(match, userId, session);
    if (!paymentResult.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(paymentResult.response);
    }

    // Add participant
    const participant = {
      user: userId,
      status: 'joined',
      joined_at: new Date(),
      payment_status: paymentResult.paid ? 'paid' : 'free',
      amount_paid: match.entry_fee,
      game_data: {
        uid: req.body.game_uid,
        name: req.body.game_name,
        region: req.body.region || 'BD',
        device: req.body.device || 'mobile'
      },
      metadata: {
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        join_method: 'direct'
      }
    };

    match.participants.push(participant);
    match.current_participants += 1;
    
    // Update match stats
    updateMatchStats(match, participant);
    
    await match.save({ session });

    // Create join notification
    await createJoinNotification(match, req.user, session);

    // Clear relevant caches
    await clearMatchRelatedCaches(matchId, userId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Log successful join
    logMatchJoin(match, req.user, paymentResult);

    // Prepare success response
    const response = {
      success: true,
      code: paymentResult.paid ? 'MATCH_JOINED_PAID' : 'MATCH_JOINED_FREE',
      message: paymentResult.paid 
        ? `Successfully joined match! ৳${match.entry_fee} deducted from your wallet. 🎉` 
        : 'Successfully joined match! Good luck! 🍀',
      data: {
        match: {
          id: match._id,
          title: match.title,
          game: match.game,
          match_id: match.match_id || match._id.toString()
        },
        room: {
          id: match.room_id || generateRoomId(match._id),
          password: match.room_password || generateRoomPassword(),
          join_link: generateRoomJoinLink(match),
          instructions: getRoomInstructions(match.game)
        },
        participant: {
          position: match.current_participants,
          total_spots: match.max_participants,
          spots_left: match.max_participants - match.current_participants,
          join_time: new Date().toISOString()
        },
        payment: paymentResult.details,
        next_steps: [
          'Wait for match to start',
          'Join the room 5 minutes before start time',
          'Check match updates regularly'
        ],
        important: {
          start_time: match.start_time,
          check_in_time: new Date(match.start_time.getTime() - 5 * 60 * 1000),
          rules: match.rules || 'Standard rules apply'
        }
      },
      timestamp: new Date().toISOString(),
      transaction_id: paymentResult.transaction_id || `JOIN_${matchId}_${Date.now()}`
    };

    res.json(response);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ JOIN MATCH ERROR:', {
      error: error.message,
      matchId: req.params.id,
      userId: req.user.username
    });

    handleJoinError(res, error);
  }
};

// ==================== ADMIN MATCH APPROVAL ====================
exports.approveMatchForAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const adminId = req.user.userId;
    
    // Get match
    const match = await Match.findById(matchId).session(session);
    
    if (!match) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already approved
    if (match.approval_status === 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_APPROVED',
        message: 'Match is already approved',
        timestamp: new Date().toISOString()
      });
    }

    // Update match
    match.approval_status = 'approved';
    match.status = 'upcoming';
    match.approved_by = adminId;
    match.approved_at = new Date();
    match.admin_notes = req.body.admin_notes || 'Approved by admin';
    match.approval_reason = req.body.reason || 'Meeting requirements';
    
    await match.save({ session });

    // Create notification for creator
    await createApprovalNotification(match, req.user, session);

    // Clear caches
    await clearMatchesCache();

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Log approval
    console.log(`✅ MATCH APPROVED | Match: ${match.title} | Admin: ${req.user.username}`);

    res.json({
      success: true,
      code: 'MATCH_APPROVED',
      message: 'Match approved successfully',
      data: {
        match: formatMatchResponse(match),
        approval_details: {
          approved_by: req.user.username,
          approved_at: new Date().toISOString(),
          notes: match.admin_notes,
          reason: match.approval_reason
        },
        impact: {
          participants_notified: match.participants.length,
          now_visible_to: 'All users',
          status_changed_to: 'Upcoming'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ MATCH APPROVAL ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'APPROVAL_FAILED',
      message: 'Failed to approve match',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== HELPER FUNCTIONS ====================
const validateMatchCreation = (body, user) => {
  const errors = [];
  
  if (!body.title || body.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!body.game) {
    errors.push('Game is required');
  }
  
  const entryFee = parseFloat(body.entry_fee || 0);
  if (entryFee < 0 || entryFee > 10000) {
    errors.push('Entry fee must be between 0 and 10,000');
  }
  
  const maxParticipants = parseInt(body.max_participants || 25);
  if (maxParticipants < 2 || maxParticipants > 100) {
    errors.push('Max participants must be between 2 and 100');
  }
  
  if (errors.length > 0) {
    return {
      valid: false,
      response: {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Match creation validation failed',
        errors: errors,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { valid: true };
};

const prepareMatchData = async (body, user, session) => {
  const now = new Date();
  const scheduleTime = new Date(body.schedule_time || now.getTime() + 2 * 60 * 60 * 1000);
  
  return {
    // Basic info
    title: body.title.trim(),
    game: body.game.trim(),
    description: body.description || '',
    rules: body.rules || '',
    
    // Financial
    entry_fee: parseFloat(body.entry_fee || 0),
    total_prize: calculatePrizePool(body),
    per_kill: parseFloat(body.per_kill || 0),
    platform_fee: calculatePlatformFee(parseFloat(body.entry_fee || 0), parseInt(body.max_participants || 25)),
    
    // Participants
    max_participants: parseInt(body.max_participants || 25),
    current_participants: 0,
    min_participants: parseInt(body.min_participants || 2),
    has_waiting_list: body.has_waiting_list || false,
    
    // Game settings
    type: body.type || 'Solo',
    map: body.map || 'Bermuda',
    mode: body.mode || 'Classic',
    platform: body.platform || 'Mobile',
    version: body.version || 'Latest',
    region: body.region || 'Global',
    
    // Room info
    room_id: body.room_id || '',
    room_password: body.room_password || '',
    streaming_link: body.streaming_link || '',
    
    // Timing
    schedule_time: scheduleTime,
    start_time: new Date(body.start_time || scheduleTime.getTime() + 30 * 60 * 1000),
    end_time: new Date(body.end_time || scheduleTime.getTime() + 2 * 60 * 60 * 1000),
    registration_deadline: new Date(body.registration_deadline || scheduleTime.getTime() - 15 * 60 * 1000),
    
    // Status
    status: user.role === 'admin' ? 'upcoming' : 'pending',
    approval_status: user.role === 'admin' ? 'approved' : 'pending',
    visibility: body.visibility || 'public',
    is_featured: body.is_featured || false,
    is_verified: false,
    
    // Creator
    created_by: user.userId,
    
    // Metadata
    tags: body.tags || [],
    requirements: body.requirements || [],
    prizes: calculatePrizes(body),
    statistics: {
      views: 0,
      joins: 0,
      shares: 0
    }
  };
};

const calculatePrizePool = (body) => {
  const entryFee = parseFloat(body.entry_fee || 0);
  const maxParticipants = parseInt(body.max_participants || 25);
  const customPrize = parseFloat(body.total_prize || 0);
  
  if (customPrize > 0) {
    return customPrize;
  }
  
  // Calculate based on entry fee and participants
  const basePrize = entryFee * maxParticipants;
  const platformFee = basePrize * 0.1; // 10% platform fee
  return Math.max(0, basePrize - platformFee);
};

const calculatePlatformFee = (entryFee, maxParticipants) => {
  const totalCollection = entryFee * maxParticipants;
  return totalCollection * 0.1; // 10% platform fee
};

const calculatePrizes = (body) => {
  const prizePool = calculatePrizePool(body);
  const distribution = body.prize_distribution || [50, 30, 20]; // Default: 50%, 30%, 20%
  
  return distribution.map((percentage, index) => ({
    position: index + 1,
    percentage: percentage,
    amount: (prizePool * percentage) / 100,
    description: getPositionDescription(index + 1)
  }));
};

const getPositionDescription = (position) => {
  const descriptions = {
    1: 'Champion 🏆',
    2: 'Runner-up 🥈',
    3: 'Third Place 🥉',
    4: 'Fourth Place',
    5: 'Fifth Place'
  };
  return descriptions[position] || `Position ${position}`;
};

// Cache management
const generateMatchesCacheKey = (query, user) => {
  const params = {
    page: query.page || 1,
    limit: query.limit || 20,
    status: query.status,
    game: query.game,
    search: query.search,
    user_role: user?.role || 'guest',
    user_id: user?.userId || 'anonymous'
  };
  
  return `matches:${JSON.stringify(params)}`;
};

const clearMatchesCache = async () => {
  const keys = await redis.keys('matches:*');
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log('🧹 Cleared matches cache');
  }
};

const clearMatchRelatedCaches = async (matchId, userId) => {
  const keys = [
    `match:${matchId}`,
    `user_matches:${userId}`,
    ...(await redis.keys('matches:*'))
  ];
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// Error handling
const handleMatchError = (res, error) => {
  const response = {
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An error occurred while processing your request',
    timestamp: new Date().toISOString()
  };

  if (error.name === 'ValidationError') {
    response.code = 'VALIDATION_ERROR';
    response.message = 'Match data validation failed';
    response.errors = Object.values(error.errors).map(e => e.message);
    res.status(400).json(response);
  } else if (error.name === 'MongoError' && error.code === 11000) {
    response.code = 'DUPLICATE_ERROR';
    response.message = 'A match with similar details already exists';
    res.status(409).json(response);
  } else {
    res.status(500).json(response);
  }
};

const handleJoinError = (res, error) => {
  const response = {
    success: false,
    code: 'JOIN_FAILED',
    message: 'Failed to join match',
    timestamp: new Date().toISOString()
  };

  if (error.name === 'InsufficientBalanceError') {
    response.code = 'INSUFFICIENT_BALANCE';
    response.message = 'Insufficient wallet balance';
    res.status(400).json(response);
  } else {
    res.status(500).json(response);
  }
};

// Logging
const logMatchCreation = (match, user) => {
  console.log(`✅ MATCH CREATED | ID: ${match._id} | Title: ${match.title} | Creator: ${user.username} | Prize: ৳${match.total_prize}`);
};

const logMatchJoin = (match, user, payment) => {
  console.log(`✅ MATCH JOINED | Match: ${match.title} | User: ${user.username} | Payment: ${payment.paid ? '৳' + payment.amount : 'Free'}`);
};

module.exports = exports;
