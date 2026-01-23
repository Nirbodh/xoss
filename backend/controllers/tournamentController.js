// controllers/tournamentController.js - PRODUCTION PRO VERSION
const Tournament = require('../models/Tournament');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Redis = require('ioredis');

// Redis for caching and rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Constants
const TOURNAMENT_CACHE_TTL = 60; // 1 minute
const TOURNAMENT_RATE_LIMIT = {
  CREATE: 5, // 5 tournaments per hour
  JOIN: 10   // 10 joins per hour
};

// 🔥 HELPER: Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
};

// 🔥 HELPER: Validate tournament data
const validateTournamentData = (data, isAdmin = false) => {
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
  
  const maxParticipants = parseInt(data.max_participants || data.maxParticipants || 50);
  if (isNaN(maxParticipants) || maxParticipants < 4 || maxParticipants > 200) {
    errors.push('Max participants must be between 4 and 200');
  }
  
  const scheduleTime = new Date(data.schedule_time || data.scheduleTime || data.start_time || data.startTime);
  if (isNaN(scheduleTime.getTime())) {
    errors.push('Invalid schedule time');
  } else if (scheduleTime < new Date()) {
    errors.push('Schedule time cannot be in the past');
  }
  
  return errors;
};

// 🔥 HELPER: Map request data to tournament model
const mapTournamentData = (reqBody, userId, userRole) => {
  console.log('🔄 Mapping tournament data for user:', userId);
  
  const isAdmin = ['admin', 'moderator', 'super_admin'].includes(userRole);
  
  // Parse dates safely
  let scheduleTime;
  try {
    scheduleTime = new Date(reqBody.schedule_time || reqBody.scheduleTime || reqBody.start_time || reqBody.startTime);
    if (isNaN(scheduleTime.getTime())) {
      scheduleTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
    }
  } catch (error) {
    scheduleTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
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
      endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours after start
    }
  } catch (error) {
    endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
  }
  
  const tournamentData = {
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
    max_participants: parseInt(reqBody.max_participants || reqBody.maxParticipants || reqBody.maxPlayers || 50),
    min_participants: parseInt(reqBody.min_participants || reqBody.minParticipants || 4),
    current_participants: 0,
    
    // Game settings
    type: reqBody.type || 'Squad',
    map: reqBody.map || 'Bermuda',
    mode: reqBody.mode || 'Classic',
    match_type: 'tournament',
    
    // Room info
    room_id: (reqBody.room_id || reqBody.roomId || '').trim(),
    room_password: (reqBody.room_password || reqBody.password || reqBody.roomPassword || '').trim(),
    
    // Timing
    schedule_time: scheduleTime,
    start_time: startTime,
    end_time: endTime,
    registration_deadline: new Date(reqBody.registration_deadline || scheduleTime.getTime() - 30 * 60 * 1000),
    
    // Status
    status: isAdmin ? 'upcoming' : 'pending',
    approval_status: isAdmin ? 'approved' : 'pending',
    created_by: userId,
    
    // Additional fields
    platform: reqBody.platform || 'Mobile',
    version: reqBody.version || 'Latest',
    streaming_link: reqBody.streaming_link || reqBody.streamingLink || '',
    thumbnail: reqBody.thumbnail || reqBody.image || '',
    tags: Array.isArray(reqBody.tags) ? reqBody.tags : [],
    is_featured: reqBody.is_featured || false,
    is_private: reqBody.is_private || false,
    requires_verification: reqBody.requires_verification || false,
    prize_distribution: reqBody.prize_distribution || [50, 30, 20], // Default: 50%, 30%, 20%
    bracket_type: reqBody.bracket_type || 'single_elimination',
    check_in_required: reqBody.check_in_required || false,
    check_in_time: reqBody.check_in_time ? new Date(reqBody.check_in_time) : new Date(scheduleTime.getTime() - 15 * 60 * 1000)
  };
  
  // Set auto-approval for admin
  if (isAdmin) {
    tournamentData.approved_by = userId;
    tournamentData.approved_at = new Date();
    tournamentData.admin_notes = reqBody.admin_notes || 'Auto-approved by admin';
  }
  
  return tournamentData;
};

// 🔥 HELPER: Format tournament response
const formatTournamentResponse = (tournament) => {
  const formatted = tournament.toObject ? tournament.toObject() : tournament;
  
  return {
    id: formatted._id,
    title: formatted.title,
    game: formatted.game,
    description: formatted.description,
    rules: formatted.rules,
    entry_fee: formatted.entry_fee,
    total_prize: formatted.total_prize,
    per_kill: formatted.per_kill,
    max_participants: formatted.max_participants,
    current_participants: formatted.current_participants,
    type: formatted.type,
    map: formatted.map,
    mode: formatted.mode,
    platform: formatted.platform,
    room_id: formatted.room_id,
    room_password: formatted.room_password,
    schedule_time: formatted.schedule_time,
    start_time: formatted.start_time,
    end_time: formatted.end_time,
    status: formatted.status,
    approval_status: formatted.approval_status,
    created_by: formatted.created_by,
    approved_by: formatted.approved_by,
    approved_at: formatted.approved_at,
    thumbnail: formatted.thumbnail,
    streaming_link: formatted.streaming_link,
    tags: formatted.tags || [],
    is_featured: formatted.is_featured,
    is_private: formatted.is_private,
    requires_verification: formatted.requires_verification,
    prize_distribution: formatted.prize_distribution,
    check_in_required: formatted.check_in_required,
    check_in_time: formatted.check_in_time,
    registration_deadline: formatted.registration_deadline,
    created_at: formatted.createdAt,
    updated_at: formatted.updatedAt,
    participants_count: formatted.participants?.length || 0,
    spots_left: formatted.max_participants - (formatted.current_participants || 0),
    is_joinable: formatted.approval_status === 'approved' && 
                 ['upcoming', 'registration_open'].includes(formatted.status) &&
                 formatted.current_participants < formatted.max_participants &&
                 (!formatted.registration_deadline || new Date() < new Date(formatted.registration_deadline))
  };
};

// 🔥 HELPER: Calculate prize pool
const calculatePrizePool = (tournamentData) => {
  const entryFee = tournamentData.entry_fee || 0;
  const maxParticipants = tournamentData.max_participants || 50;
  const customPrize = tournamentData.total_prize || 0;
  
  if (customPrize > 0) {
    return customPrize;
  }
  
  // Calculate based on entry fee and participants
  const basePrize = entryFee * maxParticipants;
  const platformFee = basePrize * 0.1; // 10% platform fee
  return Math.max(0, basePrize - platformFee);
};

// 🔥 HELPER: Calculate platform fee
const calculatePlatformFee = (entryFee, maxParticipants) => {
  const totalCollection = entryFee * maxParticipants;
  return totalCollection * 0.1; // 10% platform fee
};

// 🔥 HELPER: Calculate estimated revenue
const calculateEstimatedRevenue = (tournament) => {
  const collection = tournament.entry_fee * tournament.max_participants;
  const prizePool = tournament.total_prize;
  return collection - prizePool;
};

// 🔥 HELPER: Generate cache key
const generateTournamentsCacheKey = (query, user) => {
  const params = {
    page: query.page || 1,
    limit: query.limit || 20,
    status: query.status,
    game: query.game,
    search: query.search,
    user_role: user?.role || 'guest',
    user_id: user?.userId || 'anonymous'
  };
  
  return `tournaments:${JSON.stringify(params)}`;
};

// 🔥 HELPER: Clear tournaments cache
const clearTournamentsCache = async () => {
  const keys = await redis.keys('tournaments:*');
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log('🧹 Cleared tournaments cache');
  }
};

// 🔥 HELPER: Clear tournament related caches
const clearTournamentRelatedCaches = async (tournamentId, userId) => {
  const keys = [
    `tournament:${tournamentId}`,
    `user_tournaments:${userId}`,
    ...(await redis.keys('tournaments:*'))
  ];
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// 🔥 HELPER: Rate limiting
const checkRateLimit = async (key, maxRequests, windowSeconds) => {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  
  const requests = await redis.lrange(key, 0, -1);
  const recentRequests = requests.filter(time => now - parseInt(time) < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  await redis.lpush(key, now.toString());
  await redis.ltrim(key, 0, maxRequests - 1);
  await redis.expire(key, windowSeconds);
  
  return true;
};

// 🔥 HELPER: Validate tournament for joining
const validateTournamentForJoining = (tournament, userRole) => {
  if (tournament.approval_status !== 'approved') {
    return {
      valid: false,
      response: {
        success: false,
        code: 'NOT_APPROVED',
        message: 'This tournament is not approved yet',
        timestamp: new Date().toISOString()
      }
    };
  }

  const allowedStatuses = ['upcoming', 'registration_open'];
  if (!allowedStatuses.includes(tournament.status)) {
    return {
      valid: false,
      response: {
        success: false,
        code: 'NOT_JOINABLE',
        message: `Tournament is not joinable. Current status: ${tournament.status}`,
        allowed_statuses: allowedStatuses,
        timestamp: new Date().toISOString()
      }
    };
  }

  return { valid: true };
};

// 🔥 HELPER: Check if user already joined
const isUserAlreadyJoined = (participants, userId) => {
  return participants?.some(p => 
    p.user && p.user.toString() === userId.toString()
  ) || false;
};

// 🔥 HELPER: Process tournament payment
const processTournamentPayment = async (tournament, userId, body, session) => {
  const entryFee = tournament.entry_fee || 0;
  
  if (entryFee <= 0) {
    return {
      success: true,
      paid: false,
      details: {
        amount: 0,
        status: 'free',
        method: 'free_entry'
      }
    };
  }

  try {
    const wallet = await Wallet.findOne({ user_id: userId }).session(session);
    
    if (!wallet) {
      return {
        success: false,
        response: {
          success: false,
          code: 'WALLET_NOT_FOUND',
          message: 'Wallet not found. Please contact support.',
          timestamp: new Date().toISOString()
        }
      };
    }

    console.log(`💰 Wallet Balance: ${wallet.balance}, Required: ${entryFee}`);
    
    if (wallet.balance < entryFee) {
      return {
        success: false,
        response: {
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          message: `Insufficient balance. Required: ৳${entryFee}, Available: ৳${wallet.balance}`,
          required: entryFee,
          available: wallet.balance,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Deduct from wallet
    wallet.balance -= entryFee;
    wallet.total_spent += entryFee;
    wallet.last_activity = new Date();
    await wallet.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      user_id: userId,
      type: 'debit',
      amount: entryFee,
      description: `Tournament Entry Fee: ${tournament.title}`,
      status: 'completed',
      method: 'tournament_entry',
      reference_id: tournament._id.toString(),
      metadata: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        match_type: 'tournament',
        entry_fee: entryFee,
        game: tournament.game
      }
    }], { session });

    console.log(`✅ Wallet debited: ${userId}, Amount: ${entryFee}, New Balance: ${wallet.balance}`);

    return {
      success: true,
      paid: true,
      transaction_id: transaction[0]._id.toString(),
      details: {
        amount: entryFee,
        status: 'deducted',
        method: 'wallet',
        transaction_id: transaction[0]._id.toString(),
        new_balance: wallet.balance
      }
    };
    
  } catch (error) {
    console.error('❌ Payment processing error:', error);
    return {
      success: false,
      response: {
        success: false,
        code: 'PAYMENT_FAILED',
        message: 'Payment processing failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};

// 🔥 HELPER: Update tournament stats
const updateTournamentStats = (tournament, participant) => {
  if (!tournament.stats) {
    tournament.stats = {
      total_joins: 0,
      total_collection: 0,
      average_join_time: null
    };
  }
  
  tournament.stats.total_joins += 1;
  tournament.stats.total_collection += participant.amount_paid || 0;
};

// 🔥 HELPER: Create join notification
const createJoinNotification = async (tournament, user, session) => {
  try {
    // Notification for tournament creator
    await Notification.create([{
      user_id: tournament.created_by,
      type: 'participant_joined',
      title: 'New Participant Joined',
      message: `${user.username || 'A user'} joined your tournament "${tournament.title}"`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        participant_id: user.userId,
        participant_name: user.username,
        entry_fee: tournament.entry_fee,
        current_participants: tournament.current_participants
      },
      priority: 'medium'
    }], { session });

    // Notification for participant
    await Notification.create([{
      user_id: user.userId,
      type: 'tournament_joined',
      title: 'Tournament Joined Successfully',
      message: `You joined "${tournament.title}" successfully`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        schedule_time: tournament.schedule_time,
        room_id: tournament.room_id,
        entry_fee: tournament.entry_fee
      },
      priority: 'high'
    }], { session });

  } catch (error) {
    console.error('❌ Notification creation error:', error);
  }
};

// 🔥 HELPER: Generate room ID
const generateRoomId = (tournamentId) => {
  return `T${tournamentId.toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
};

// 🔥 HELPER: Generate room password
const generateRoomPassword = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// 🔥 HELPER: Generate room join link
const generateRoomJoinLink = (tournament) => {
  if (tournament.game === 'Free Fire') {
    return `https://freefire.game/join?room=${tournament.room_id}&password=${tournament.room_password}`;
  } else if (tournament.game === 'PUBG Mobile') {
    return `https://pubgm.game/room/${tournament.room_id}`;
  }
  return null;
};

// 🔥 HELPER: Get room instructions
const getRoomInstructions = (game) => {
  const instructions = {
    'Free Fire': [
      'Open Free Fire game',
      'Click on "Custom Room"',
      'Enter Room ID and Password',
      'Join before tournament starts'
    ],
    'PUBG Mobile': [
      'Open PUBG Mobile',
      'Go to "Custom Match"',
      'Enter Room ID',
      'Use Password if required'
    ],
    'COD Mobile': [
      'Open Call of Duty Mobile',
      'Select "Private Match"',
      'Enter Room Details',
      'Join with team'
    ]
  };
  
  return instructions[game] || [
    'Join the room using provided details',
    'Be ready 10 minutes before start',
    'Follow tournament rules'
  ];
};

// 🔥 HELPER: Log tournament join
const logTournamentJoin = (tournament, user, paymentResult) => {
  console.log('🎮 TOURNAMENT JOIN LOG:', {
    tournament_id: tournament._id,
    tournament_title: tournament.title,
    user_id: user.userId,
    username: user.username,
    entry_fee: tournament.entry_fee,
    payment_method: paymentResult.paid ? 'wallet' : 'free',
    transaction_id: paymentResult.transaction_id,
    timestamp: new Date().toISOString(),
    participants_count: tournament.current_participants
  });
};

// 🔥 HELPER: Handle join error
const handleJoinError = (res, error) => {
  const errorResponses = {
    'InsufficientBalance': {
      status: 400,
      code: 'INSUFFICIENT_BALANCE',
      message: 'Insufficient wallet balance'
    },
    'TournamentFull': {
      status: 400,
      code: 'TOURNAMENT_FULL',
      message: 'Tournament is full'
    },
    'AlreadyJoined': {
      status: 400,
      code: 'ALREADY_JOINED',
      message: 'Already joined this tournament'
    }
  };

  const errorKey = error.code || error.name || 'UNKNOWN_ERROR';
  const errorResponse = errorResponses[errorKey] || {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Failed to join tournament'
  };

  res.status(errorResponse.status).json({
    success: false,
    code: errorResponse.code,
    message: errorResponse.message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
};

// 🔥 HELPER: Handle tournament error
const handleTournamentError = (res, error) => {
  const errorMap = {
    'ValidationError': {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Data validation failed'
    },
    'MongoError': {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Database operation failed'
    },
    'CastError': {
      status: 400,
      code: 'INVALID_ID',
      message: 'Invalid tournament ID'
    }
  };

  const errorKey = error.name || 'UNKNOWN_ERROR';
  const errorConfig = errorMap[errorKey] || {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  };

  res.status(errorConfig.status).json({
    success: false,
    code: errorConfig.code,
    message: errorConfig.message,
    details: process.env.NODE_ENV === 'development' ? {
      error: error.message,
      stack: error.stack
    } : undefined,
    timestamp: new Date().toISOString()
  });
};

// 🔥 HELPER: Check if user can create tournament
const canUserCreateTournament = (user) => {
  if (!user) return false;
  
  const restrictions = [
    user.is_banned !== true,
    user.verified_email === true,
    user.account_status === 'active',
    user.tournaments_created_today < 10, // Limit per day
    user.rating >= 500 // Minimum rating
  ];
  
  return restrictions.every(r => r === true);
};

// 🔥 HELPER: Create tournament approval notifications
const createTournamentApprovalNotifications = async (tournament, admin, session) => {
  try {
    // Notification for creator
    await Notification.create([{
      user_id: tournament.created_by,
      type: 'tournament_approved',
      title: 'Tournament Approved!',
      message: `Your tournament "${tournament.title}" has been approved by admin`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        approved_by: admin.username,
        approved_at: new Date(),
        start_time: tournament.start_time,
        prize_pool: tournament.total_prize
      },
      priority: 'high'
    }], { session });

    // Notification for participants (if any)
    if (tournament.participants && tournament.participants.length > 0) {
      const participantNotifications = tournament.participants.map(participant => ({
        user_id: participant.user,
        type: 'tournament_go_live',
        title: 'Tournament is Live!',
        message: `Tournament "${tournament.title}" is now live and starting soon`,
        data: {
          tournament_id: tournament._id,
          tournament_title: tournament.title,
          start_time: tournament.start_time,
          room_id: tournament.room_id,
          check_in_required: tournament.check_in_required
        },
        priority: 'high'
      }));
      
      await Notification.insertMany(participantNotifications, { session });
    }

  } catch (error) {
    console.error('❌ Approval notifications error:', error);
  }
};

// 🔥 HELPER: Notify participants
const notifyParticipants = async (tournament, eventType, session) => {
  try {
    const messageTemplates = {
      'approved': {
        title: 'Tournament Approved',
        message: `Tournament "${tournament.title}" has been approved and is now live!`
      },
      'starting_soon': {
        title: 'Tournament Starting Soon',
        message: `Tournament "${tournament.title}" starts in 30 minutes`
      },
      'started': {
        title: 'Tournament Started',
        message: `Tournament "${tournament.title}" has started! Join now.`
      },
      'cancelled': {
        title: 'Tournament Cancelled',
        message: `Tournament "${tournament.title}" has been cancelled`
      }
    };

    const template = messageTemplates[eventType];
    if (!template) return;

    const notifications = tournament.participants.map(participant => ({
      user_id: participant.user,
      type: `tournament_${eventType}`,
      title: template.title,
      message: template.message,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        event_type: eventType,
        timestamp: new Date()
      },
      priority: 'high'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { session });
    }

  } catch (error) {
    console.error('❌ Participant notification error:', error);
  }
};

// ==================== GET ALL TOURNAMENTS ====================
exports.getTournaments = async (req, res) => {
  try {
    console.log('🔍 GET tournaments request');
    console.log('👤 User role:', req.user?.role || 'guest');
    
    const cacheKey = generateTournamentsCacheKey(req.query, req.user);
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving tournaments from cache');
      return res.json(JSON.parse(cachedData));
    }
    
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
      filter.status = { $in: ['upcoming', 'live', 'registration_open'] };
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
    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username name avatar rating')
      .populate('approved_by', 'username name')
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean();
    
    // Get total count
    const totalTournaments = await Tournament.countDocuments(filter);
    
    // Check if user has joined each tournament
    if (req.user && req.user.userId) {
      const userId = req.user.userId;
      for (const tournament of tournaments) {
        tournament.has_joined = tournament.participants?.some(p => 
          p.user && p.user.toString() === userId.toString()
        ) || false;
      }
    }
    
    console.log(`✅ Found ${tournaments.length} tournaments out of ${totalTournaments} total`);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalTournaments / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    // Get stats
    const stats = await Tournament.aggregate([
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
    
    // Format tournaments
    const formattedTournaments = tournaments.map(t => formatTournamentResponse(t));
    
    const response = {
      success: true,
      code: 'TOURNAMENTS_FETCHED',
      message: 'Tournaments fetched successfully',
      data: {
        tournaments: formattedTournaments,
        pagination: {
          current_page: pageNumber,
          page_size: pageSize,
          total_items: totalTournaments,
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
          user_id: req.user?.userId,
          can_create: canUserCreateTournament(req.user)
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: TOURNAMENT_CACHE_TTL
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, TOURNAMENT_CACHE_TTL, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch tournaments',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== CREATE TOURNAMENT ====================
exports.createTournament = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('🎮 CREATE TOURNAMENT REQUEST:', {
      user: req.user.username,
      body: req.body,
      ip: req.ip
    });

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
    
    // Validate tournament data
    const validationErrors = validateTournamentData(req.body, userRole === 'admin');
    if (validationErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Tournament data validation failed',
        errors: validationErrors,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check rate limit for tournament creation
    const rateLimitKey = `rate_limit:create_tournament:${userId}`;
    const canCreate = await checkRateLimit(rateLimitKey, TOURNAMENT_RATE_LIMIT.CREATE, 3600);
    
    if (!canCreate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many tournament creation attempts. Please try again later.',
        limit: TOURNAMENT_RATE_LIMIT.CREATE,
        period: 'per hour',
        timestamp: new Date().toISOString()
      });
    }
    
    // Map request data to tournament model
    const tournamentData = mapTournamentData(req.body, userId, userRole);
    
    // Calculate prize pool if not specified
    if (tournamentData.total_prize === 0) {
      tournamentData.total_prize = calculatePrizePool(tournamentData);
    }
    
    // Create tournament
    const tournament = await Tournament.create([tournamentData], { session });
    const createdTournament = tournament[0];
    
    // Populate creator info
    await createdTournament.populate('created_by', 'username name email rating');
    if (createdTournament.approved_by) {
      await createdTournament.populate('approved_by', 'username name');
    }
    
    // Create notification for admin (if not auto-approved)
    if (userRole === 'user') {
      try {
        const adminUsers = await User.find({ role: { $in: ['admin', 'moderator'] } }).session(session);
        
        for (const admin of adminUsers) {
          await Notification.create([{
            user_id: admin._id,
            type: 'tournament_pending',
            title: 'New Tournament Pending Approval',
            message: `New tournament "${createdTournament.title}" created by ${req.user.username || 'User'}`,
            data: {
              tournament_id: createdTournament._id,
              tournament_title: createdTournament.title,
              created_by: userId,
              created_by_name: req.user.username || 'User',
              prize_pool: createdTournament.total_prize,
              participants: createdTournament.max_participants
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
    
    // Clear tournaments cache
    await clearTournamentsCache();
    
    console.log('✅ Tournament created successfully:', createdTournament._id);
    
    // Prepare response
    const response = {
      success: true,
      code: 'TOURNAMENT_CREATED',
      message: userRole === 'user' 
        ? 'Tournament created successfully! Waiting for admin approval.' 
        : 'Tournament created and auto-approved successfully!',
      data: {
        tournament: formatTournamentResponse(createdTournament),
        creator: {
          id: req.user.userId,
          username: req.user.username,
          name: req.user.name,
          rating: req.user.rating || 1000
        },
        approval_info: {
          status: createdTournament.approval_status,
          message: createdTournament.approval_status === 'approved' 
            ? 'Tournament is live and visible to users' 
            : 'Waiting for admin review',
          estimated_review_time: 'Within 24 hours'
        },
        economic_impact: {
          entry_fee: createdTournament.entry_fee,
          prize_pool: createdTournament.total_prize,
          platform_fee: calculatePlatformFee(createdTournament.entry_fee, createdTournament.max_participants),
          estimated_revenue: calculateEstimatedRevenue(createdTournament)
        },
        timeline: {
          registration_deadline: createdTournament.registration_deadline,
          schedule_time: createdTournament.schedule_time,
          start_time: createdTournament.start_time,
          end_time: createdTournament.end_time
        },
        next_steps: [
          'Share tournament with friends',
          'Wait for participants to join',
          'Set up room details before start time',
          'Check participant verification'
        ]
      },
      timestamp: new Date().toISOString(),
      reference_id: `T${createdTournament._id}${Date.now().toString().slice(-6)}`
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
    
    console.error('❌ CREATE TOURNAMENT ERROR:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
      endpoint: req.originalUrl
    });
    
    handleTournamentError(res, error);
  }
};

// ==================== GET TOURNAMENT BY ID ====================
exports.getTournamentById = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const cacheKey = `tournament:${tournamentId}:details`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving tournament details from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    const tournament = await Tournament.findById(tournamentId)
      .populate('created_by', 'username name avatar rating tournaments_created tournaments_won')
      .populate('approved_by', 'username name')
      .populate('participants.user', 'username avatar rating game_uid game_name')
      .populate('winners.user', 'username avatar')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user has joined
    if (req.user && req.user.userId) {
      tournament.has_joined = tournament.participants?.some(p => 
        p.user && p.user._id.toString() === req.user.userId.toString()
      ) || false;
    }
    
    // Format response
    const response = {
      success: true,
      code: 'TOURNAMENT_FETCHED',
      message: 'Tournament details fetched successfully',
      data: {
        tournament: formatTournamentResponse(tournament),
        participants_info: {
          total: tournament.current_participants,
          max: tournament.max_participants,
          spots_left: tournament.max_participants - tournament.current_participants,
          participants: tournament.participants || []
        },
        prize_info: {
          total_prize: tournament.total_prize,
          prize_distribution: tournament.prize_distribution || [50, 30, 20],
          per_kill: tournament.per_kill,
          estimated_prizes: calculateEstimatedPrizes(tournament)
        },
        schedule_info: {
          schedule_time: tournament.schedule_time,
          start_time: tournament.start_time,
          end_time: tournament.end_time,
          registration_deadline: tournament.registration_deadline,
          check_in_time: tournament.check_in_time,
          time_until_start: calculateTimeUntil(tournament.start_time)
        },
        creator_info: tournament.created_by,
        admin_info: tournament.approved_by ? {
          approved_by: tournament.approved_by,
          approved_at: tournament.approved_at,
          admin_notes: tournament.admin_notes
        } : null
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: TOURNAMENT_CACHE_TTL
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, TOURNAMENT_CACHE_TTL, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET TOURNAMENT BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch tournament details',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 HELPER: Calculate estimated prizes
const calculateEstimatedPrizes = (tournament) => {
  const totalPrize = tournament.total_prize;
  const distribution = tournament.prize_distribution || [50, 30, 20];
  
  return distribution.map((percentage, index) => ({
    position: index + 1,
    percentage: percentage,
    amount: (totalPrize * percentage) / 100,
    formatted_amount: formatCurrency((totalPrize * percentage) / 100)
  }));
};

// 🔥 HELPER: Calculate time until
const calculateTimeUntil = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  
  if (diffMs <= 0) return 'Started';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
};

// ==================== UPDATE TOURNAMENT ====================
exports.updateTournament = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('🔄 UPDATE TOURNAMENT REQUEST:', {
      tournamentId,
      userId: req.user.username,
      body: req.body
    });

    // Get tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check authorization
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(userRole);
    const isCreator = tournament.created_by.toString() === userId.toString();
    
    if (!isAdmin && !isCreator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to update this tournament',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if tournament can be updated
    if (tournament.status === 'live' && !isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_LIVE',
        message: 'Cannot update tournament while it is live',
        timestamp: new Date().toISOString()
      });
    }
    
    // Map update data
    const updateData = mapTournamentData(req.body, userId, userRole);
    
    // Restrict certain fields for non-admins
    if (!isAdmin) {
      delete updateData.approval_status;
      delete updateData.status;
      delete updateData.approved_by;
      delete updateData.approved_at;
      
      // If tournament is approved, non-admin cannot change entry fee or max participants
      if (tournament.approval_status === 'approved') {
        delete updateData.entry_fee;
        delete updateData.max_participants;
        delete updateData.total_prize;
      }
    }
    
    // Update tournament
    Object.assign(tournament, updateData);
    tournament.updated_at = new Date();
    
    // Add to update history
    if (!tournament.update_history) {
      tournament.update_history = [];
    }
    
    tournament.update_history.push({
      updated_by: userId,
      updated_at: new Date(),
      changes: Object.keys(updateData),
      reason: req.body.update_reason || 'General update'
    });
    
    await tournament.save({ session });
    
    // Populate fields
    await tournament.populate('created_by', 'username name');
    if (tournament.approved_by) {
      await tournament.populate('approved_by', 'username name');
    }
    
    // Clear caches
    await clearTournamentRelatedCaches(tournamentId, userId);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ Tournament updated: ${tournamentId}`);
    
    res.json({
      success: true,
      code: 'TOURNAMENT_UPDATED',
      message: 'Tournament updated successfully',
      data: {
        tournament: formatTournamentResponse(tournament),
        updated_fields: Object.keys(updateData),
        updated_at: new Date().toISOString(),
        updated_by: req.user.username
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ UPDATE TOURNAMENT ERROR:', error);
    handleTournamentError(res, error);
  }
};

// ==================== DELETE TOURNAMENT ====================
exports.deleteTournament = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('🗑️ DELETE TOURNAMENT REQUEST:', {
      tournamentId,
      userId: req.user.username
    });

    // Get tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check authorization
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(userRole);
    const isCreator = tournament.created_by.toString() === userId.toString();
    
    if (!isAdmin && !isCreator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to delete this tournament',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if tournament can be deleted
    if (tournament.status === 'live' && !isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_LIVE',
        message: 'Cannot delete tournament while it is live. Cancel it first.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Refund participants if tournament has entry fee and is approved
    if (tournament.approval_status === 'approved' && tournament.entry_fee > 0 && tournament.participants.length > 0) {
      console.log('💰 Processing refunds for tournament participants');
      
      for (const participant of tournament.participants) {
        if (participant.payment_status === 'paid') {
          const wallet = await Wallet.findOne({ user_id: participant.user }).session(session);
          if (wallet) {
            wallet.balance += participant.amount_paid;
            wallet.refunded_amount += participant.amount_paid;
            wallet.last_activity = new Date();
            await wallet.save({ session });
            
            // Create refund transaction
            await Transaction.create([{
              user_id: participant.user,
              type: 'credit',
              amount: participant.amount_paid,
              description: `Refund for deleted tournament: ${tournament.title}`,
              status: 'completed',
              method: 'refund',
              reference_id: tournament._id.toString(),
              metadata: {
                tournament_id: tournament._id,
                tournament_title: tournament.title,
                refund_reason: 'Tournament deleted by ' + (isAdmin ? 'admin' : 'creator')
              }
            }], { session });
          }
        }
      }
    }
    
    // Create notification for participants about deletion
    if (tournament.participants.length > 0) {
      const deletionNotifications = tournament.participants.map(participant => ({
        user_id: participant.user,
        type: 'tournament_cancelled',
        title: 'Tournament Cancelled',
        message: `Tournament "${tournament.title}" has been cancelled`,
        data: {
          tournament_id: tournament._id,
          tournament_title: tournament.title,
          cancelled_by: req.user.username,
          refund_processed: tournament.entry_fee > 0,
          refund_amount: tournament.entry_fee
        },
        priority: 'high'
      }));
      
      await Notification.insertMany(deletionNotifications, { session });
    }
    
    // Delete tournament
    await Tournament.findByIdAndDelete(tournamentId).session(session);
    
    // Clear caches
    await clearTournamentsCache();
    await redis.del(`tournament:${tournamentId}:*`);
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ Tournament deleted: ${tournamentId}`);
    
    res.json({
      success: true,
      code: 'TOURNAMENT_DELETED',
      message: 'Tournament deleted successfully',
      data: {
        tournament_id: tournamentId,
        title: tournament.title,
        participants_refunded: tournament.entry_fee > 0 ? tournament.participants.length : 0,
        total_refund_amount: tournament.entry_fee > 0 ? tournament.entry_fee * tournament.participants.length : 0,
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.username
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ DELETE TOURNAMENT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'DELETE_FAILED',
      message: 'Failed to delete tournament',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== JOIN TOURNAMENT WITH PAYMENT ====================
exports.joinTournamentWithPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('🎮 JOIN TOURNAMENT REQUEST:', {
      tournamentId,
      userId: req.user.username,
      body: req.body,
      ip: req.ip
    });

    // Get tournament with lock
    const tournament = await Tournament.findById(tournamentId).session(session).select('+participants');
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found or has been removed',
        timestamp: new Date().toISOString()
      });
    }

    // Validate tournament status
    const tournamentValidation = validateTournamentForJoining(tournament, userRole);
    if (!tournamentValidation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(tournamentValidation.response);
    }

    // Check if user already joined
    if (isUserAlreadyJoined(tournament.participants, userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_JOINED',
        message: 'You have already joined this tournament',
        timestamp: new Date().toISOString()
      });
    }

    // Check tournament capacity
    if (tournament.current_participants >= tournament.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_FULL',
        message: 'Tournament is full. No spots available.',
        waiting_list_available: tournament.has_waiting_list || false,
        timestamp: new Date().toISOString()
      });
    }

    // Check registration deadline
    if (tournament.registration_deadline && new Date() > tournament.registration_deadline) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'REGISTRATION_CLOSED',
        message: 'Registration for this tournament has closed',
        registration_deadline: tournament.registration_deadline,
        timestamp: new Date().toISOString()
      });
    }

    // Check rate limit for joining
    const rateLimitKey = `rate_limit:join_tournament:${userId}`;
    const canJoin = await checkRateLimit(rateLimitKey, TOURNAMENT_RATE_LIMIT.JOIN, 3600);
    
    if (!canJoin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(429).json({
        success: false,
        code: 'JOIN_RATE_LIMITED',
        message: 'Too many tournament join attempts. Please try again later.',
        limit: TOURNAMENT_RATE_LIMIT.JOIN,
        period: 'per hour',
        timestamp: new Date().toISOString()
      });
    }

    // Process payment
    const paymentResult = await processTournamentPayment(tournament, userId, req.body, session);
    if (!paymentResult.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(paymentResult.response);
    }

    // Add participant
    const participant = {
      user: userId,
      status: 'registered',
      joined_at: new Date(),
      payment_status: paymentResult.paid ? 'paid' : 'free',
      amount_paid: tournament.entry_fee,
      game_data: {
        uid: req.body.game_uid,
        name: req.body.game_name,
        region: req.body.region || 'BD',
        device: req.body.device || 'mobile',
        player_name: req.body.player_name || req.user.username
      },
      metadata: {
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        join_method: 'direct',
        join_timestamp: new Date().toISOString()
      },
      check_in_status: tournament.check_in_required ? 'pending' : 'auto_checked',
      check_in_time: tournament.check_in_required ? null : new Date()
    };

    tournament.participants.push(participant);
    tournament.current_participants += 1;
    
    // Update tournament stats
    updateTournamentStats(tournament, participant);
    
    await tournament.save({ session });

    // Create join notification
    await createJoinNotification(tournament, req.user, session);

    // Clear relevant caches
    await clearTournamentRelatedCaches(tournamentId, userId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Log successful join
    logTournamentJoin(tournament, req.user, paymentResult);

    // Prepare success response
    const response = {
      success: true,
      code: paymentResult.paid ? 'TOURNAMENT_JOINED_PAID' : 'TOURNAMENT_JOINED_FREE',
      message: paymentResult.paid 
        ? `Successfully joined tournament! ${formatCurrency(tournament.entry_fee)} deducted from your wallet. 🎉` 
        : 'Successfully joined tournament! Good luck! 🍀',
      data: {
        tournament: {
          id: tournament._id,
          title: tournament.title,
          game: tournament.game,
          tournament_id: tournament.tournament_id || tournament._id.toString()
        },
        room: {
          id: tournament.room_id || generateRoomId(tournament._id),
          password: tournament.room_password || generateRoomPassword(),
          join_link: generateRoomJoinLink(tournament),
          instructions: getRoomInstructions(tournament.game),
          check_in_required: tournament.check_in_required,
          check_in_time: tournament.check_in_time,
          check_in_window: tournament.check_in_window || '15 minutes before start'
        },
        participant: {
          position: tournament.current_participants,
          total_spots: tournament.max_participants,
          spots_left: tournament.max_participants - tournament.current_participants,
          join_time: new Date().toISOString(),
          check_in_status: participant.check_in_status,
          check_in_time: participant.check_in_time
        },
        payment: paymentResult.details,
        schedule: {
          start_time: tournament.start_time,
          check_in_deadline: tournament.check_in_time || new Date(tournament.start_time.getTime() - 15 * 60 * 1000),
          duration: `${Math.round((tournament.end_time - tournament.start_time) / (60 * 60 * 1000))} hours`
        },
        next_steps: tournament.check_in_required ? [
          'Complete check-in 15 minutes before start time',
          'Join the tournament room',
          'Check tournament updates regularly'
        ] : [
          'Join the tournament room',
          'Check tournament updates regularly'
        ],
        important: {
          start_time: tournament.start_time,
          rules: tournament.rules || 'Standard tournament rules apply',
          prize_distribution: tournament.prize_distribution || [50, 30, 20]
        }
      },
      timestamp: new Date().toISOString(),
      transaction_id: paymentResult.transaction_id || `JOIN_T${tournamentId}_${Date.now()}`
    };

    res.json(response);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ JOIN TOURNAMENT ERROR:', {
      error: error.message,
      tournamentId: req.params.id,
      userId: req.user.username
    });

    handleJoinError(res, error);
  }
};

// ==================== JOIN TOURNAMENT WITHOUT PAYMENT ====================
exports.joinTournament = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId;
    
    console.log('🎮 JOIN FREE TOURNAMENT REQUEST:', {
      tournamentId,
      userId: req.user.username
    });

    // Get tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if tournament is free
    if (tournament.entry_fee > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'PAYMENT_REQUIRED',
        message: 'This tournament requires payment to join',
        entry_fee: tournament.entry_fee,
        timestamp: new Date().toISOString()
      });
    }

    // Validate tournament status
    const tournamentValidation = validateTournamentForJoining(tournament, req.user.role);
    if (!tournamentValidation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(tournamentValidation.response);
    }

    // Check if user already joined
    if (isUserAlreadyJoined(tournament.participants, userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_JOINED',
        message: 'You have already joined this tournament',
        timestamp: new Date().toISOString()
      });
    }

    // Check tournament capacity
    if (tournament.current_participants >= tournament.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_FULL',
        message: 'Tournament is full. No spots available.',
        timestamp: new Date().toISOString()
      });
    }

    // Add participant
    const participant = {
      user: userId,
      status: 'registered',
      joined_at: new Date(),
      payment_status: 'free',
      amount_paid: 0,
      game_data: {
        uid: req.body.game_uid,
        name: req.body.game_name
      }
    };

    tournament.participants.push(participant);
    tournament.current_participants += 1;
    await tournament.save({ session });

    // Create notification
    await createJoinNotification(tournament, req.user, session);

    // Clear caches
    await clearTournamentRelatedCaches(tournamentId, userId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ User ${req.user.username} joined free tournament ${tournamentId}`);

    res.json({
      success: true,
      code: 'TOURNAMENT_JOINED_FREE',
      message: 'Successfully joined tournament!',
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        participants: tournament.current_participants,
        spots_left: tournament.max_participants - tournament.current_participants,
        join_time: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ JOIN FREE TOURNAMENT ERROR:', error);
    handleJoinError(res, error);
  }
};

// ==================== LEAVE TOURNAMENT ====================
exports.leaveTournament = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId;
    
    console.log('🚪 LEAVE TOURNAMENT REQUEST:', {
      tournamentId,
      userId: req.user.username
    });

    // Get tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user has joined
    const participantIndex = tournament.participants.findIndex(p => 
      p.user && p.user.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_JOINED',
        message: 'You have not joined this tournament',
        timestamp: new Date().toISOString()
      });
    }

    // Check if tournament has started
    if (tournament.status === 'live') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_STARTED',
        message: 'Cannot leave tournament after it has started',
        timestamp: new Date().toISOString()
      });
    }

    // Get participant info before removal
    const participant = tournament.participants[participantIndex];
    const entryFee = participant.amount_paid || 0;
    const joinedAt = participant.joined_at;

    // Remove participant
    tournament.participants.splice(participantIndex, 1);
    tournament.current_participants = Math.max(0, tournament.current_participants - 1);
    
    // Refund if paid and within refund period (1 hour before start)
    if (entryFee > 0 && new Date() < new Date(tournament.start_time.getTime() - 60 * 60 * 1000)) {
      const wallet = await Wallet.findOne({ user_id: userId }).session(session);
      if (wallet) {
        wallet.balance += entryFee;
        wallet.total_spent -= entryFee;
        wallet.last_activity = new Date();
        await wallet.save({ session });

        // Create refund transaction
        await Transaction.create([{
          user_id: userId,
          type: 'credit',
          amount: entryFee,
          description: `Refund for leaving tournament: ${tournament.title}`,
          status: 'completed',
          method: 'refund',
          reference_id: tournament._id.toString(),
          metadata: {
            tournament_id: tournament._id,
            tournament_title: tournament.title,
            refund_reason: 'Voluntary leave before tournament start',
            joined_at: joinedAt,
            left_at: new Date()
          }
        }], { session });

        console.log(`💰 Refunded ${entryFee} to user ${userId}`);
      }
    }

    await tournament.save({ session });

    // Create notification for creator
    await Notification.create([{
      user_id: tournament.created_by,
      type: 'participant_left',
      title: 'Participant Left Tournament',
      message: `${req.user.username} left your tournament "${tournament.title}"`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        participant_id: userId,
        participant_name: req.user.username,
        refund_processed: entryFee > 0,
        refund_amount: entryFee
      },
      priority: 'medium'
    }], { session });

    // Clear caches
    await clearTournamentRelatedCaches(tournamentId, userId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ User ${req.user.username} left tournament ${tournamentId}`);

    res.json({
      success: true,
      code: 'LEFT_TOURNAMENT',
      message: entryFee > 0 ? 'Successfully left tournament. Refund processed.' : 'Successfully left tournament.',
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        refund_processed: entryFee > 0,
        refund_amount: entryFee,
        left_at: new Date().toISOString(),
        remaining_participants: tournament.current_participants
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ LEAVE TOURNAMENT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'LEAVE_FAILED',
      message: 'Failed to leave tournament',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: GET ALL TOURNAMENTS ====================
exports.getAllTournamentsForAdmin = async (req, res) => {
  try {
    console.log('👑 ADMIN: Fetching ALL tournaments');
    
    const { 
      limit = 50, 
      page = 1, 
      status,
      approval_status,
      game,
      search,
      sort_by = '-createdAt',
      start_date,
      end_date
    } = req.query;
    
    // Build filter
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (approval_status && approval_status !== 'all') {
      filter.approval_status = approval_status;
    }
    
    if (game && game !== 'all') {
      filter.game = game;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'created_by.username': { $regex: search, $options: 'i' } },
        { room_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filtering
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }
    
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
    
    // Execute query
    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username name email phone rating')
      .populate('approved_by', 'username name')
      .populate('participants.user', 'username')
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean();
    
    // Get total count
    const totalTournaments = await Tournament.countDocuments(filter);
    
    // Get statistics
    const stats = await Tournament.aggregate([
  { $match: filter }, // filter অনুযায়ী টুর্নামেন্ট বাছাই
  {
    $group: {
      _id: null, // সব ডকুমেন্ট একসাথে গ্রুপ হবে
      total_tournaments: { $sum: 1 }, // টুর্নামেন্ট সংখ্যা
      total_prize_pool: { $sum: '$total_prize' }, // prize যোগফল
      total_collection: { $sum: { $multiply: ['$entry_fee', '$current_participants'] } }, // entry_fee × participants যোগফল
      total_participants: { $sum: '$current_participants' }, // মোট participants
      approved_count: { 
        $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } // approved count
      },
      pending_count: { 
        $sum: { $cond: [{ $eq: ['$approval_status', 'pending'] }, 1, 0] } // pending count
      },
      rejected_count: { 
        $sum: { $cond: [{ $eq: ['$approval_status', 'rejected'] }, 1, 0] } // rejected count
      }
    }
  }
]);
    
    // Calculate pagination
    const totalPages = Math.ceil(totalTournaments / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    console.log(`👑 ADMIN: Found ${tournaments.length} tournaments out of ${totalTournaments} total`);
    
    res.json({
      success: true,
      code: 'ADMIN_TOURNAMENTS_FETCHED',
      message: 'Tournaments fetched successfully for admin',
      data: {
        tournaments: tournaments.map(t => formatTournamentResponse(t)),
        pagination: {
          current_page: pageNumber,
          page_size: pageSize,
          total_items: totalTournaments,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        filters: {
          status: status || 'all',
          approval_status: approval_status || 'all',
          game: game || 'all',
          search: search || '',
          start_date: start_date || '',
          end_date: end_date || ''
        },
        statistics: stats[0] || {
          total_tournaments: 0,
          total_prize_pool: 0,
          total_collection: 0,
          total_participants: 0,
          approved_count: 0,
          pending_count: 0,
          rejected_count: 0
        },
        admin_context: {
          admin_id: req.user.userId,
          admin_name: req.user.username,
          admin_role: req.user.role,
          can_manage: ['admin', 'super_admin'].includes(req.user.role)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ADMIN GET ALL TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_FETCH_ERROR',
      message: 'Failed to fetch tournaments for admin',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: GET PENDING TOURNAMENTS ====================
exports.getPendingTournamentsForAdmin = async (req, res) => {
  try {
    console.log('👑 ADMIN: Fetching pending tournaments');
    
    const tournaments = await Tournament.find({ 
      approval_status: 'pending'
    })
      .populate('created_by', 'username name email rating')
      .populate('approved_by', 'username name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`📊 ADMIN: Found ${tournaments.length} pending tournaments`);
    
    res.json({
      success: true,
      code: 'PENDING_TOURNAMENTS_FETCHED',
      message: tournaments.length === 0 ? 'No pending tournaments' : 'Pending tournaments fetched',
      data: {
        tournaments: tournaments.map(t => formatTournamentResponse(t)),
        count: tournaments.length,
        requires_attention: tournaments.filter(t => 
          new Date(t.schedule_time) < new Date(Date.now() + 24 * 60 * 60 * 1000)
        ).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ADMIN PENDING TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'PENDING_FETCH_ERROR',
      message: 'Failed to fetch pending tournaments',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: APPROVE TOURNAMENT ====================
exports.approveTournamentForAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const adminId = req.user.userId;
    const adminName = req.user.username;
    
    console.log(`👑 ADMIN: Approving tournament ${tournamentId}`);

    // Get tournament
    const tournament = await Tournament.findById(tournamentId)
      .populate('created_by', 'username email')
      .populate('participants.user', 'username email')
      .session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already approved
    if (tournament.approval_status === 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_APPROVED',
        message: 'Tournament is already approved',
        timestamp: new Date().toISOString()
      });
    }

    // Update tournament
    tournament.approval_status = 'approved';
    tournament.status = 'upcoming';
    tournament.approved_by = adminId;
    tournament.approved_at = new Date();
    tournament.admin_notes = req.body.admin_notes || 'Approved by admin';
    tournament.approval_reason = req.body.reason || 'Meeting requirements';
    
    // Add to status history
    if (!tournament.status_history) {
      tournament.status_history = [];
    }
    
    tournament.status_history.push({
      status: 'approved',
      timestamp: new Date(),
      changed_by: adminId,
      notes: req.body.admin_notes || 'Approved by admin'
    });

    await tournament.save({ session });

    // Create notification for creator and participants
    await createTournamentApprovalNotifications(tournament, req.user, session);

    // Send push notifications to participants
    await notifyParticipants(tournament, 'approved', session);

    // Clear caches
    await clearTournamentsCache();

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Log approval
    console.log(`✅ TOURNAMENT APPROVED | ID: ${tournament._id} | Title: ${tournament.title} | Admin: ${adminName}`);

    // Send response
    return res.json({
      success: true,
      code: 'TOURNAMENT_APPROVED',
      message: 'Tournament approved successfully',
      data: {
        tournament: formatTournamentResponse(tournament),
        approval_details: {
          approved_by: adminName,
          approved_at: new Date().toISOString(),
          notes: tournament.admin_notes,
          reason: tournament.approval_reason
        },
        impact: {
          participants_notified: tournament.participants.length,
          now_visible_to: 'All users',
          status_changed_to: 'Upcoming'
        },
        next_steps: [
          'Tournament is now visible to all users',
          'Participants will be notified',
          'Tournament room details can now be shared'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ APPROVE TOURNAMENT ERROR:', error);
    return res.status(500).json({
      success: false,
      code: 'APPROVAL_FAILED',
      message: 'Failed to approve tournament',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: REJECT TOURNAMENT ====================
exports.rejectTournamentForAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const adminId = req.user.userId;
    const adminName = req.user.username;
    
    console.log(`👑 ADMIN: Rejecting tournament ${tournamentId}`);

    // Get tournament
    const tournament = await Tournament.findById(tournamentId)
      .populate('created_by', 'username email')
      .populate('participants.user', 'username email')
      .session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already rejected
    if (tournament.approval_status === 'rejected') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_REJECTED',
        message: 'Tournament is already rejected',
        timestamp: new Date().toISOString()
      });
    }

    // Validate rejection reason
    if (!req.body.rejection_reason || req.body.rejection_reason.trim().length < 10) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_REJECTION_REASON',
        message: 'Rejection reason must be at least 10 characters',
        timestamp: new Date().toISOString()
      });
    }

    // Update tournament
    tournament.approval_status = 'rejected';
    tournament.status = 'cancelled';
    tournament.rejection_reason = req.body.rejection_reason;
    tournament.rejected_by = adminId;
    tournament.rejected_at = new Date();
    tournament.admin_notes = req.body.admin_notes || 'Rejected by admin';
    
    // Add to status history
    if (!tournament.status_history) {
      tournament.status_history = [];
    }
    
    tournament.status_history.push({
      status: 'rejected',
      timestamp: new Date(),
      changed_by: adminId,
      notes: req.body.rejection_reason
    });

    await tournament.save({ session });

    // Create notification for creator
    await Notification.create([{
      user_id: tournament.created_by,
      type: 'tournament_rejected',
      title: 'Tournament Rejected',
      message: `Your tournament "${tournament.title}" has been rejected`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        rejected_by: adminName,
        rejected_at: new Date(),
        rejection_reason: req.body.rejection_reason,
        admin_notes: req.body.admin_notes
      },
      priority: 'high'
    }], { session });

    // Refund participants if any have paid
    if (tournament.entry_fee > 0 && tournament.participants.length > 0) {
      console.log('💰 Processing refunds for rejected tournament');
      
      for (const participant of tournament.participants) {
        if (participant.payment_status === 'paid') {
          const wallet = await Wallet.findOne({ user_id: participant.user }).session(session);
          if (wallet) {
            wallet.balance += participant.amount_paid;
            wallet.refunded_amount += participant.amount_paid;
            wallet.last_activity = new Date();
            await wallet.save({ session });
            
            // Create refund transaction
            await Transaction.create([{
              user_id: participant.user,
              type: 'credit',
              amount: participant.amount_paid,
              description: `Refund for rejected tournament: ${tournament.title}`,
              status: 'completed',
              method: 'refund',
              reference_id: tournament._id.toString(),
              metadata: {
                tournament_id: tournament._id,
                tournament_title: tournament.title,
                refund_reason: 'Tournament rejected by admin'
              }
            }], { session });
          }
        }
      }
      
      // Notify participants about refund
      for (const participant of tournament.participants) {
        if (participant.payment_status === 'paid') {
          await Notification.create([{
            user_id: participant.user,
            type: 'tournament_refund',
            title: 'Tournament Refund Processed',
            message: `Tournament "${tournament.title}" was rejected. Refund of ৳${tournament.entry_fee} processed.`,
            data: {
              tournament_id: tournament._id,
              tournament_title: tournament.title,
              refund_amount: tournament.entry_fee,
              refund_reason: 'Tournament rejected by admin',
              refund_status: 'completed'
            },
            priority: 'high'
          }], { session });
        }
      }
    }

    // Clear caches
    await clearTournamentsCache();

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ TOURNAMENT REJECTED | ID: ${tournament._id} | Title: ${tournament.title} | Admin: ${adminName}`);

    res.json({
      success: true,
      code: 'TOURNAMENT_REJECTED',
      message: 'Tournament rejected successfully',
      data: {
        tournament: formatTournamentResponse(tournament),
        rejection_details: {
          rejected_by: adminName,
          rejected_at: new Date().toISOString(),
          reason: tournament.rejection_reason,
          admin_notes: tournament.admin_notes
        },
        impact: {
          participants_notified: tournament.participants.length,
          refunds_processed: tournament.entry_fee > 0 ? tournament.participants.filter(p => p.payment_status === 'paid').length : 0,
          total_refund_amount: tournament.entry_fee > 0 ? tournament.entry_fee * tournament.participants.filter(p => p.payment_status === 'paid').length : 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ REJECT TOURNAMENT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REJECTION_FAILED',
      message: 'Failed to reject tournament',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN: UPDATE TOURNAMENT STATUS ====================
exports.updateTournamentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.id;
    const newStatus = req.body.status;
    const adminId = req.user.userId;
    const adminName = req.user.username;
    
    console.log(`👑 ADMIN: Updating tournament ${tournamentId} status to ${newStatus}`);

    // Validate status
    const allowedStatuses = ['upcoming', 'live', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get tournament
    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user', 'username email')
      .session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if tournament is approved
    if (tournament.approval_status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_APPROVED',
        message: 'Cannot update status of unapproved tournament',
        timestamp: new Date().toISOString()
      });
    }

    // Validate status transition
    const validTransitions = {
      'upcoming': ['live', 'cancelled'],
      'live': ['completed', 'cancelled'],
      'completed': ['archived'],
      'cancelled': []
    };

    if (!validTransitions[tournament.status]?.includes(newStatus)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${tournament.status} to ${newStatus}`,
        allowed_transitions: validTransitions[tournament.status] || [],
        timestamp: new Date().toISOString()
      });
    }

    // Update tournament
    const oldStatus = tournament.status;
    tournament.status = newStatus;
    
    // Set timestamps based on status
    if (newStatus === 'live' && !tournament.started_at) {
      tournament.started_at = new Date();
    } else if (newStatus === 'completed' && !tournament.completed_at) {
      tournament.completed_at = new Date();
    } else if (newStatus === 'cancelled' && !tournament.cancelled_at) {
      tournament.cancelled_at = new Date();
    }
    
    // Add to status history
    if (!tournament.status_history) {
      tournament.status_history = [];
    }
    
    tournament.status_history.push({
      old_status: oldStatus,
      new_status: newStatus,
      timestamp: new Date(),
      changed_by: adminId,
      notes: req.body.notes || `Status changed from ${oldStatus} to ${newStatus}`
    });

    await tournament.save({ session });

    // Notify participants about status change
    await notifyParticipants(tournament, newStatus, session);

    // Clear caches
    await clearTournamentRelatedCaches(tournamentId, adminId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ TOURNAMENT STATUS UPDATED | ID: ${tournament._id} | ${oldStatus} → ${newStatus} | Admin: ${adminName}`);

    res.json({
      success: true,
      code: 'TOURNAMENT_STATUS_UPDATED',
      message: `Tournament status updated to ${newStatus}`,
      data: {
        tournament: formatTournamentResponse(tournament),
        status_change: {
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: adminName,
          changed_at: new Date().toISOString(),
          notes: req.body.notes || ''
        },
        impact: {
          participants_notified: tournament.participants.length,
          next_steps: getNextStepsForStatus(newStatus)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ UPDATE TOURNAMENT STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_FAILED',
      message: 'Failed to update tournament status',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 HELPER: Get next steps for status
const getNextStepsForStatus = (status) => {
  const steps = {
    'upcoming': [
      'Wait for participants to join',
      'Share tournament details',
      'Prepare room setup'
    ],
    'live': [
      'Monitor tournament progress',
      'Handle disputes if any',
      'Track scores and results'
    ],
    'completed': [
      'Calculate final results',
      'Distribute prizes',
      'Archive tournament data'
    ],
    'cancelled': [
      'Process refunds if applicable',
      'Notify all participants',
      'Archive tournament'
    ]
  };
  
  return steps[status] || [];
};

// ==================== GET USER TOURNAMENTS ====================
exports.getUserTournaments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'all', limit = 20, page = 1 } = req.query;
    
    console.log(`👤 Fetching ${type} tournaments for user ${userId}`);
    
    // Build filter based on type
    let filter = {};
    
    if (type === 'created') {
      filter.created_by = userId;
    } else if (type === 'joined') {
      filter['participants.user'] = userId;
    } else if (type === 'upcoming') {
      filter['participants.user'] = userId;
      filter.status = { $in: ['upcoming', 'registration_open'] };
    } else if (type === 'ongoing') {
      filter['participants.user'] = userId;
      filter.status = 'live';
    } else if (type === 'completed') {
      filter['participants.user'] = userId;
      filter.status = 'completed';
    } else {
      // all - both created and joined
      filter.$or = [
        { created_by: userId },
        { 'participants.user': userId }
      ];
    }
    
    filter.approval_status = 'approved';
    
    // Pagination
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Execute query
    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username avatar')
      .populate('approved_by', 'username')
      .sort({ schedule_time: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();
    
    // Get total count
    const totalCount = await Tournament.countDocuments(filter);
    
    // Format tournaments with user-specific info
    const formattedTournaments = tournaments.map(tournament => {
      const formatted = formatTournamentResponse(tournament);
      
      // Add user-specific info
      const isCreator = tournament.created_by._id.toString() === userId.toString();
      const participant = tournament.participants?.find(p => 
        p.user && p.user.toString() === userId.toString()
      );
      
      formatted.user_info = {
        is_creator: isCreator,
        is_participant: !!participant,
        participant_info: participant ? {
          joined_at: participant.joined_at,
          payment_status: participant.payment_status,
          check_in_status: participant.check_in_status,
          position: participant.position
        } : null
      };
      
      return formatted;
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    console.log(`✅ Found ${tournaments.length} ${type} tournaments for user ${userId}`);
    
    res.json({
      success: true,
      code: 'USER_TOURNAMENTS_FETCHED',
      message: `${type} tournaments fetched successfully`,
      data: {
        tournaments: formattedTournaments,
        pagination: {
          current_page: pageNumber,
          page_size: pageSize,
          total_items: totalCount,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        user_info: {
          user_id: userId,
          username: req.user.username,
          tournament_type: type
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET USER TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'USER_TOURNAMENTS_ERROR',
      message: 'Failed to fetch user tournaments',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET TOURNAMENT PARTICIPANTS ====================
exports.getTournamentParticipants = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    
    console.log(`👥 Fetching participants for tournament ${tournamentId}`);
    
    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user', 'username avatar rating game_uid game_name')
      .select('participants title current_participants max_participants')
      .lean();
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Format participants
    const participants = tournament.participants.map((p, index) => ({
      position: index + 1,
      user: p.user,
      joined_at: p.joined_at,
      payment_status: p.payment_status,
      check_in_status: p.check_in_status,
      check_in_time: p.check_in_time,
      game_data: p.game_data,
      participant_id: p._id
    }));
    
    res.json({
      success: true,
      code: 'PARTICIPANTS_FETCHED',
      message: 'Participants fetched successfully',
      data: {
        tournament: {
          id: tournamentId,
          title: tournament.title,
          current_participants: tournament.current_participants,
          max_participants: tournament.max_participants,
          spots_left: tournament.max_participants - tournament.current_participants
        },
        participants: participants,
        count: participants.length,
        stats: {
          paid_participants: participants.filter(p => p.payment_status === 'paid').length,
          free_participants: participants.filter(p => p.payment_status === 'free').length,
          checked_in: participants.filter(p => p.check_in_status === 'checked_in').length,
          pending_check_in: participants.filter(p => p.check_in_status === 'pending').length
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET TOURNAMENT PARTICIPANTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'PARTICIPANTS_FETCH_ERROR',
      message: 'Failed to fetch tournament participants',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== UPDATE PARTICIPANT STATUS ====================
exports.updateParticipantStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.tournamentId;
    const participantId = req.params.participantId;
    const { status, notes } = req.body;
    const adminId = req.user.userId;
    
    console.log(`👑 ADMIN: Updating participant ${participantId} status to ${status} in tournament ${tournamentId}`);
    
    // Get tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user is admin or creator
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    const isCreator = tournament.created_by.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isCreator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Only tournament creator or admin can update participant status',
        timestamp: new Date().toISOString()
      });
    }
    
    // Find participant
    const participant = tournament.participants.id(participantId);
    
    if (!participant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found in this tournament',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update participant status
    const oldStatus = participant.status;
    participant.status = status;
    participant.updated_at = new Date();
    
    if (notes) {
      participant.admin_notes = notes;
    }
    
    // Add to status history
    if (!participant.status_history) {
      participant.status_history = [];
    }
    
    participant.status_history.push({
      old_status: oldStatus,
      new_status: status,
      timestamp: new Date(),
      changed_by: adminId,
      notes: notes || 'Status updated'
    });
    
    await tournament.save({ session });
    
    // Create notification for participant
    await Notification.create([{
      user_id: participant.user,
      type: 'participant_status_updated',
      title: 'Participant Status Updated',
      message: `Your status in tournament "${tournament.title}" has been updated to ${status}`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        old_status: oldStatus,
        new_status: status,
        updated_by: req.user.username,
        notes: notes
      },
      priority: 'medium'
    }], { session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ Participant ${participantId} status updated: ${oldStatus} → ${status}`);
    
    res.json({
      success: true,
      code: 'PARTICIPANT_STATUS_UPDATED',
      message: 'Participant status updated successfully',
      data: {
        tournament_id: tournamentId,
        participant_id: participantId,
        participant_user_id: participant.user,
        status_change: {
          old_status: oldStatus,
          new_status: status,
          changed_by: req.user.username,
          changed_at: new Date().toISOString(),
          notes: notes
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ UPDATE PARTICIPANT STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_FAILED',
      message: 'Failed to update participant status',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== REMOVE PARTICIPANT ====================
exports.removeParticipant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tournamentId = req.params.tournamentId;
    const participantId = req.params.participantId;
    const adminId = req.user.userId;
    
    console.log(`👑 ADMIN: Removing participant ${participantId} from tournament ${tournamentId}`);
    
    // Get tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if user is admin
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    
    if (!isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Only admin can remove participants',
        timestamp: new Date().toISOString()
      });
    }
    
    // Find participant
    const participant = tournament.participants.id(participantId);
    
    if (!participant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found in this tournament',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if tournament has started
    if (tournament.status === 'live') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_STARTED',
        message: 'Cannot remove participant after tournament has started',
        timestamp: new Date().toISOString()
      });
    }
    
    // Store participant info for refund
    const entryFee = participant.amount_paid || 0;
    const userId = participant.user;
    
    // Remove participant
    tournament.participants.pull(participantId);
    tournament.current_participants = Math.max(0, tournament.current_participants - 1);
    
    // Refund if participant paid
    if (entryFee > 0) {
      const wallet = await Wallet.findOne({ user_id: userId }).session(session);
      if (wallet) {
        wallet.balance += entryFee;
        wallet.total_spent -= entryFee;
        wallet.last_activity = new Date();
        await wallet.save({ session });
        
        // Create refund transaction
        await Transaction.create([{
          user_id: userId,
          type: 'credit',
          amount: entryFee,
          description: `Refund for removal from tournament: ${tournament.title}`,
          status: 'completed',
          method: 'refund',
          reference_id: tournament._id.toString(),
          metadata: {
            tournament_id: tournament._id,
            tournament_title: tournament.title,
            refund_reason: 'Removed by admin',
            removed_by: req.user.username,
            removed_at: new Date()
          }
        }], { session });
        
        console.log(`💰 Refunded ${entryFee} to user ${userId}`);
      }
    }
    
    await tournament.save({ session });
    
    // Create notification for removed participant
    await Notification.create([{
      user_id: userId,
      type: 'removed_from_tournament',
      title: 'Removed from Tournament',
      message: `You have been removed from tournament "${tournament.title}" by admin`,
      data: {
        tournament_id: tournament._id,
        tournament_title: tournament.title,
        removed_by: req.user.username,
        removed_at: new Date(),
        refund_processed: entryFee > 0,
        refund_amount: entryFee,
        reason: req.body.reason || 'Administrative decision'
      },
      priority: 'high'
    }], { session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    console.log(`✅ Participant ${participantId} removed from tournament ${tournamentId}`);
    
    res.json({
      success: true,
      code: 'PARTICIPANT_REMOVED',
      message: 'Participant removed successfully',
      data: {
        tournament_id: tournamentId,
        participant_id: participantId,
        participant_user_id: userId,
        removal_details: {
          removed_by: req.user.username,
          removed_at: new Date().toISOString(),
          reason: req.body.reason || 'Administrative decision',
          refund_processed: entryFee > 0,
          refund_amount: entryFee
        },
        tournament_update: {
          current_participants: tournament.current_participants,
          spots_left: tournament.max_participants - tournament.current_participants
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ REMOVE PARTICIPANT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REMOVAL_FAILED',
      message: 'Failed to remove participant',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET TOURNAMENT ANALYTICS ====================
exports.getTournamentAnalytics = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    
    console.log(`📊 Fetching analytics for tournament ${tournamentId}`);
    
    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user', 'username rating')
      .populate('created_by', 'username')
      .lean();
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Calculate analytics
    const participants = tournament.participants || [];
    const totalParticipants = participants.length;
    
    // Payment analytics
    const paidParticipants = participants.filter(p => p.payment_status === 'paid').length;
    const freeParticipants = participants.filter(p => p.payment_status === 'free').length;
    
    // Check-in analytics
    const checkedIn = participants.filter(p => p.check_in_status === 'checked_in').length;
    const pendingCheckIn = participants.filter(p => p.check_in_status === 'pending').length;
    
    // Rating analytics
    const ratings = participants
      .filter(p => p.user && p.user.rating)
      .map(p => p.user.rating);
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;
    
    // Time analytics
    const joinTimes = participants.map(p => new Date(p.joined_at));
    const earliestJoin = joinTimes.length > 0 ? new Date(Math.min(...joinTimes)) : null;
    const latestJoin = joinTimes.length > 0 ? new Date(Math.max(...joinTimes)) : null;
    
    // Financial analytics
    const totalCollection = paidParticipants * tournament.entry_fee;
    const prizePool = tournament.total_prize;
    const platformEarning = totalCollection - prizePool;
    const platformFeePercentage = totalCollection > 0 ? ((platformEarning / totalCollection) * 100) : 0;
    
    // Participation rate
    const participationRate = tournament.max_participants > 0 
      ? (totalParticipants / tournament.max_participants) * 100 
      : 0;
    
    // Response
    res.json({
      success: true,
      code: 'ANALYTICS_FETCHED',
      message: 'Tournament analytics fetched successfully',
      data: {
        tournament: {
          id: tournament._id,
          title: tournament.title,
          status: tournament.status,
          game: tournament.game,
          creator: tournament.created_by?.username
        },
        participation: {
          total_participants: totalParticipants,
          max_participants: tournament.max_participants,
          participation_rate: `${participationRate.toFixed(2)}%`,
          spots_left: tournament.max_participants - totalParticipants,
          fill_percentage: participationRate
        },
        financial: {
          entry_fee: tournament.entry_fee,
          total_collection: totalCollection,
          formatted_collection: formatCurrency(totalCollection),
          prize_pool: prizePool,
          formatted_prize_pool: formatCurrency(prizePool),
          platform_earning: platformEarning,
          formatted_platform_earning: formatCurrency(platformEarning),
          platform_fee_percentage: `${platformFeePercentage.toFixed(2)}%`,
          per_kill_prize: tournament.per_kill,
          formatted_per_kill: formatCurrency(tournament.per_kill)
        },
        participants: {
          paid_count: paidParticipants,
          free_count: freeParticipants,
          paid_percentage: totalParticipants > 0 ? (paidParticipants / totalParticipants) * 100 : 0,
          check_in_stats: {
            checked_in: checkedIn,
            pending: pendingCheckIn,
            check_in_rate: totalParticipants > 0 ? (checkedIn / totalParticipants) * 100 : 0
          },
          rating_stats: {
            average_rating: averageRating.toFixed(2),
            min_rating: ratings.length > 0 ? Math.min(...ratings) : 0,
            max_rating: ratings.length > 0 ? Math.max(...ratings) : 0,
            total_rated_participants: ratings.length
          }
        },
        timing: {
          schedule_time: tournament.schedule_time,
          start_time: tournament.start_time,
          registration_deadline: tournament.registration_deadline,
          earliest_join: earliestJoin,
          latest_join: latestJoin,
          registration_duration: earliestJoin && latestJoin 
            ? `${Math.round((latestJoin - earliestJoin) / (1000 * 60 * 60))} hours` 
            : 'N/A'
        },
        insights: {
          popularity_score: calculatePopularityScore(tournament, totalParticipants, participationRate),
          revenue_potential: calculateRevenuePotential(tournament, totalParticipants),
          success_probability: calculateSuccessProbability(tournament, totalParticipants, averageRating)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ GET TOURNAMENT ANALYTICS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ANALYTICS_ERROR',
      message: 'Failed to fetch tournament analytics',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 HELPER: Calculate popularity score
const calculatePopularityScore = (tournament, participants, participationRate) => {
  let score = 0;
  
  // Base on participation rate
  score += participationRate * 0.5;
  
  // Bonus for high prize pool
  if (tournament.total_prize > 1000) score += 10;
  else if (tournament.total_prize > 500) score += 5;
  
  // Bonus for free entry (attracts more people)
  if (tournament.entry_fee === 0) score += 5;
  
  // Bonus for featured tournaments
  if (tournament.is_featured) score += 10;
  
  return Math.min(100, Math.max(0, score));
};

// 🔥 HELPER: Calculate revenue potential
const calculateRevenuePotential = (tournament, participants) => {
  const maxPotential = tournament.entry_fee * tournament.max_participants;
  const currentRevenue = tournament.entry_fee * participants;
  
  return {
    current: currentRevenue,
    max_potential: maxPotential,
    percentage: maxPotential > 0 ? (currentRevenue / maxPotential) * 100 : 0,
    projected: tournament.status === 'upcoming' 
      ? currentRevenue * (tournament.max_participants / Math.max(1, participants))
      : currentRevenue
  };
};

// 🔥 HELPER: Calculate success probability
const calculateSuccessProbability = (tournament, participants, averageRating) => {
  let probability = 0;
  
  // Based on fill percentage
  const fillPercentage = (participants / tournament.max_participants) * 100;
  probability += Math.min(50, fillPercentage);
  
  // Based on average rating (if applicable)
  if (averageRating > 1500) probability += 20;
  else if (averageRating > 1200) probability += 10;
  
  // Based on tournament type
  if (tournament.type === 'Squad') probability += 5;
  
  // Based on prize pool
  if (tournament.total_prize > 1000) probability += 15;
  else if (tournament.total_prize > 500) probability += 10;
  
  // Based on creator rating (if available)
  if (tournament.created_by?.rating > 1500) probability += 10;
  
  return Math.min(100, probability);
};

// ==================== SEARCH TOURNAMENTS ====================
exports.searchTournaments = async (req, res) => {
  try {
    const { 
      query, 
      game, 
      type, 
      min_prize, 
      max_prize,
      min_players,
      max_players,
      date_from,
      date_to,
      sort = 'relevance',
      limit = 20,
      page = 1 
    } = req.query;
    
    console.log('🔍 SEARCH TOURNAMENTS:', {
      query,
      game,
      type,
      min_prize,
      max_prize
    });
    
    // Build search query
    let searchQuery = {
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open', 'live'] }
    };
    
    // Text search
    if (query && query.trim().length > 0) {
      searchQuery.$text = { $search: query.trim() };
    }
    
    // Filter by game
    if (game && game !== 'all') {
      searchQuery.game = game;
    }
    
    // Filter by type
    if (type && type !== 'all') {
      searchQuery.type = type;
    }
    
    // Filter by prize range
    if (min_prize || max_prize) {
      searchQuery.total_prize = {};
      if (min_prize) searchQuery.total_prize.$gte = parseFloat(min_prize);
      if (max_prize) searchQuery.total_prize.$lte = parseFloat(max_prize);
    }
    
    // Filter by player count
    if (min_players || max_players) {
      searchQuery.max_participants = {};
      if (min_players) searchQuery.max_participants.$gte = parseInt(min_players);
      if (max_players) searchQuery.max_participants.$lte = parseInt(max_players);
    }
    
    // Filter by date range
    if (date_from || date_to) {
      searchQuery.schedule_time = {};
      if (date_from) searchQuery.schedule_time.$gte = new Date(date_from);
      if (date_to) searchQuery.schedule_time.$lte = new Date(date_to);
    }
    
    // Pagination
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Build sort
    let sortOptions = {};
    switch (sort) {
      case 'date':
        sortOptions = { schedule_time: 1 };
        break;
      case 'date_desc':
        sortOptions = { schedule_time: -1 };
        break;
      case 'prize':
        sortOptions = { total_prize: -1 };
        break;
      case 'participants':
        sortOptions = { current_participants: -1 };
        break;
      case 'relevance':
        // For text search relevance
        if (query) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { schedule_time: 1 };
        }
        break;
      default:
        sortOptions = { schedule_time: 1 };
    }
    
    // Build find options
    const findOptions = {
      ...sortOptions,
      skip,
      limit: pageSize
    };
    
    // If text search, include score
    if (query && query.trim().length > 0) {
      findOptions.score = { $meta: 'textScore' };
    }
    
    // Execute search
    const tournaments = await Tournament.find(searchQuery, null, findOptions)
      .populate('created_by', 'username avatar rating')
      .populate('approved_by', 'username')
      .lean();
    
    // Get total count
    const totalCount = await Tournament.countDocuments(searchQuery);
    
    // Format tournaments
    const formattedTournaments = tournaments.map(t => ({
      ...formatTournamentResponse(t),
      search_score: t.score || 0
    }));
    
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    console.log(`✅ Search found ${tournaments.length} tournaments`);
    
    res.json({
      success: true,
      code: 'SEARCH_COMPLETED',
      message: 'Tournament search completed successfully',
      data: {
        tournaments: formattedTournaments,
        search_info: {
          query: query || '',
          filters: {
            game: game || 'all',
            type: type || 'all',
            min_prize: min_prize || null,
            max_prize: max_prize || null,
            date_from: date_from || null,
            date_to: date_to || null,
            sort: sort
          },
          total_results: totalCount,
          showing_results: tournaments.length
        },
        pagination: {
          current_page: pageNumber,
          page_size: pageSize,
          total_items: totalCount,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ SEARCH TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SEARCH_ERROR',
      message: 'Failed to search tournaments',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET FEATURED TOURNAMENTS ====================
exports.getFeaturedTournaments = async (req, res) => {
  try {
    console.log('🌟 Fetching featured tournaments');
    
    const cacheKey = 'tournaments:featured';
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving featured tournaments from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    const tournaments = await Tournament.find({
      is_featured: true,
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open'] }
    })
      .populate('created_by', 'username avatar rating')
      .populate('approved_by', 'username')
      .sort({ schedule_time: 1 })
      .limit(10)
      .lean();
    
    console.log(`✅ Found ${tournaments.length} featured tournaments`);
    
    const response = {
      success: true,
      code: 'FEATURED_TOURNAMENTS_FETCHED',
      message: 'Featured tournaments fetched successfully',
      data: {
        tournaments: tournaments.map(t => formatTournamentResponse(t)),
        count: tournaments.length,
        featured_until: new Date(Date.now() + 24 * 60 * 60 * 1000) // Featured for 24 hours
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 300 // 5 minutes cache for featured tournaments
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, 300, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET FEATURED TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FEATURED_FETCH_ERROR',
      message: 'Failed to fetch featured tournaments',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET UPCOMING TOURNAMENTS ====================
exports.getUpcomingTournaments = async (req, res) => {
  try {
    const { limit = 10, hours = 24 } = req.query;
    
    console.log(`⏰ Fetching tournaments in next ${hours} hours`);
    
    const cacheKey = `tournaments:upcoming:${hours}:${limit}`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving upcoming tournaments from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    const hoursFromNow = parseInt(hours);
    const timeThreshold = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    
    const tournaments = await Tournament.find({
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open'] },
      schedule_time: { $lte: timeThreshold },
      schedule_time: { $gt: new Date() }
    })
      .populate('created_by', 'username avatar rating')
      .populate('approved_by', 'username')
      .sort({ schedule_time: 1 })
      .limit(parseInt(limit))
      .lean();
    
    console.log(`✅ Found ${tournaments.length} upcoming tournaments in next ${hours} hours`);
    
    const response = {
      success: true,
      code: 'UPCOMING_TOURNAMENTS_FETCHED',
      message: 'Upcoming tournaments fetched successfully',
      data: {
        tournaments: tournaments.map(t => formatTournamentResponse(t)),
        count: tournaments.length,
        time_window: `${hours} hours`,
        next_update: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 300 // 5 minutes cache
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, 300, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET UPCOMING TOURNAMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'UPCOMING_FETCH_ERROR',
      message: 'Failed to fetch upcoming tournaments',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET TOURNAMENT STATISTICS ====================
exports.getTournamentStatistics = async (req, res) => {
  try {
    console.log('📈 Fetching tournament statistics');
    
    const cacheKey = 'tournaments:statistics';
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving tournament statistics from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    // Get overall statistics
    const overallStats = await Tournament.aggregate([
      {
        $group: {
          _id: null,
          total_tournaments: { $sum: 1 },
          total_prize_pool: { $sum: '$total_prize' },
          total_participants: { $sum: '$current_participants' },
          total_collection: { $sum: { $multiply: ['$entry_fee', '$current_participants'] } },
          upcoming_count: { $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] } },
          live_count: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
          completed_count: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          approved_count: { $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } },
          pending_count: { $sum: { $cond: [{ $eq: ['$approval_status', 'pending'] }, 1, 0] } }
        }
      }
    ]);
    
    // Get game-wise statistics
    const gameStats = await Tournament.aggregate([
      {
        $group: {
          _id: '$game',
          count: { $sum: 1 },
          total_prize: { $sum: '$total_prize' },
          total_participants: { $sum: '$current_participants' },
          upcoming: { $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] } },
          live: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get type-wise statistics
    const typeStats = await Tournament.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avg_participants: { $avg: '$current_participants' },
          avg_prize: { $avg: '$total_prize' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentStats = await Tournament.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          tournaments_created: { $sum: 1 },
          participants_joined: { $sum: '$current_participants' },
          total_prize: { $sum: '$total_prize' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get top tournaments by prize
    const topPrizeTournaments = await Tournament.find({
      approval_status: 'approved',
      status: { $in: ['completed', 'live'] }
    })
      .sort({ total_prize: -1 })
      .limit(5)
      .select('title game total_prize current_participants status schedule_time')
      .lean();
    
    // Get top tournaments by participants
    const topParticipantTournaments = await Tournament.find({
      approval_status: 'approved'
    })
      .sort({ current_participants: -1 })
      .limit(5)
      .select('title game current_participants max_participants status schedule_time')
      .lean();
    
    const stats = overallStats[0] || {
      total_tournaments: 0,
      total_prize_pool: 0,
      total_participants: 0,
      total_collection: 0,
      upcoming_count: 0,
      live_count: 0,
      completed_count: 0,
      approved_count: 0,
      pending_count: 0
    };
    
    const response = {
      success: true,
      code: 'STATISTICS_FETCHED',
      message: 'Tournament statistics fetched successfully',
      data: {
        overall: {
          total_tournaments: stats.total_tournaments,
          formatted_total_prize: formatCurrency(stats.total_prize_pool),
          formatted_total_collection: formatCurrency(stats.total_collection),
          total_participants: stats.total_participants,
          approval_rate: stats.total_tournaments > 0 
            ? ((stats.approved_count / stats.total_tournaments) * 100).toFixed(2) + '%'
            : '0%',
          completion_rate: stats.total_tournaments > 0
            ? ((stats.completed_count / stats.total_tournaments) * 100).toFixed(2) + '%'
            : '0%'
        },
        status_distribution: {
          upcoming: stats.upcoming_count,
          live: stats.live_count,
          completed: stats.completed_count,
          pending_approval: stats.pending_count
        },
        game_distribution: gameStats.map(stat => ({
          game: stat._id || 'Unknown',
          count: stat.count,
          percentage: stats.total_tournaments > 0 
            ? ((stat.count / stats.total_tournaments) * 100).toFixed(2) + '%'
            : '0%',
          total_prize: stat.total_prize,
          total_participants: stat.total_participants
        })),
        type_distribution: typeStats.map(stat => ({
          type: stat._id || 'Unknown',
          count: stat.count,
          avg_participants: stat.avg_participants?.toFixed(2) || '0',
          avg_prize: formatCurrency(stat.avg_prize || 0)
        })),
        recent_activity: recentStats.map(stat => ({
          date: stat._id,
          tournaments_created: stat.tournaments_created,
          participants_joined: stat.participants_joined,
          total_prize: stat.total_prize
        })),
        top_tournaments: {
          by_prize: topPrizeTournaments.map(t => ({
            title: t.title,
            game: t.game,
            prize: formatCurrency(t.total_prize),
            participants: t.current_participants,
            status: t.status
          })),
          by_participants: topParticipantTournaments.map(t => ({
            title: t.title,
            game: t.game,
            participants: t.current_participants,
            capacity: t.max_participants,
            fill_rate: ((t.current_participants / t.max_participants) * 100).toFixed(2) + '%',
            status: t.status
          }))
        },
        insights: {
          avg_prize_per_tournament: stats.total_tournaments > 0 
            ? formatCurrency(stats.total_prize_pool / stats.total_tournaments)
            : '৳0',
          avg_participants_per_tournament: stats.total_tournaments > 0 
            ? (stats.total_participants / stats.total_tournaments).toFixed(2)
            : '0',
          platform_revenue: formatCurrency(stats.total_collection - stats.total_prize_pool),
          revenue_share: stats.total_collection > 0
            ? (((stats.total_collection - stats.total_prize_pool) / stats.total_collection) * 100).toFixed(2) + '%'
            : '0%'
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 600 // 10 minutes cache for statistics
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, 600, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET TOURNAMENT STATISTICS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATISTICS_ERROR',
      message: 'Failed to fetch tournament statistics',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== GET DASHBOARD OVERVIEW ====================
exports.getDashboardOverview = async (req, res) => {
  try {
    console.log('📊 Fetching tournament dashboard overview');
    
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const cacheKey = `dashboard:${userId}:overview`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving dashboard overview from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    let userStats = {};
    let adminStats = {};
    
    // User-specific stats
    if (userRole === 'user') {
      // Tournaments created by user
      const createdTournaments = await Tournament.find({
        created_by: userId
      });
      
      // Tournaments joined by user
      const joinedTournaments = await Tournament.find({
        'participants.user': userId,
        approval_status: 'approved'
      });
      
      // Upcoming tournaments joined
      const upcomingJoined = joinedTournaments.filter(t => 
        ['upcoming', 'registration_open'].includes(t.status)
      );
      
      // Live tournaments joined
      const liveJoined = joinedTournaments.filter(t => 
        t.status === 'live'
      );
      
      // Completed tournaments joined
      const completedJoined = joinedTournaments.filter(t => 
        t.status === 'completed'
      );
      
      // Calculate total spent
      const totalSpent = joinedTournaments.reduce((sum, tournament) => {
        const participant = tournament.participants.find(p => 
          p.user && p.user.toString() === userId.toString()
        );
        return sum + (participant?.amount_paid || 0);
      }, 0);
      
      // Calculate potential winnings
      const potentialWinnings = upcomingJoined.reduce((sum, tournament) => {
        const prizeDistribution = tournament.prize_distribution || [50, 30, 20];
        const firstPrize = (tournament.total_prize * prizeDistribution[0]) / 100;
        return sum + firstPrize;
      }, 0);
      
      userStats = {
        created: {
          total: createdTournaments.length,
          approved: createdTournaments.filter(t => t.approval_status === 'approved').length,
          pending: createdTournaments.filter(t => t.approval_status === 'pending').length
        },
        joined: {
          total: joinedTournaments.length,
          upcoming: upcomingJoined.length,
          live: liveJoined.length,
          completed: completedJoined.length
        },
        financial: {
          total_spent: totalSpent,
          formatted_total_spent: formatCurrency(totalSpent),
          potential_winnings: potentialWinnings,
          formatted_potential_winnings: formatCurrency(potentialWinnings),
          net_projected: potentialWinnings - totalSpent,
          formatted_net_projected: formatCurrency(potentialWinnings - totalSpent)
        },
        performance: {
          win_rate: '0%', // To be calculated from results
          avg_position: 'N/A', // To be calculated from results
          total_winnings: 0,
          formatted_total_winnings: formatCurrency(0)
        }
      };
    }
    
    // Admin-specific stats
    if (['admin', 'moderator', 'super_admin'].includes(userRole)) {
      const pendingApproval = await Tournament.countDocuments({
        approval_status: 'pending'
      });
      
      const recentTournaments = await Tournament.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const totalCollection = await Tournament.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$entry_fee', '$current_participants'] } }
          }
        }
      ]);
      
      const platformRevenue = await Tournament.aggregate([
        {
          $group: {
            _id: null,
            total_collection: { $sum: { $multiply: ['$entry_fee', '$current_participants'] } },
            total_prize: { $sum: '$total_prize' }
          }
        }
      ]);
      
      const revenueData = platformRevenue[0] || { total_collection: 0, total_prize: 0 };
      const platformEarnings = revenueData.total_collection - revenueData.total_prize;
      
      adminStats = {
        moderation: {
          pending_approval: pendingApproval,
          recent_submissions: recentTournaments,
          approval_rate: '95%' // Example
        },
        financial: {
          total_collection: totalCollection[0]?.total || 0,
          formatted_total_collection: formatCurrency(totalCollection[0]?.total || 0),
          platform_earnings: platformEarnings,
          formatted_platform_earnings: formatCurrency(platformEarnings),
          earnings_percentage: revenueData.total_collection > 0
            ? ((platformEarnings / revenueData.total_collection) * 100).toFixed(2) + '%'
            : '0%'
        },
        activity: {
          active_tournaments: 0, // To be calculated
          participants_online: 0, // To be calculated
          avg_participation_rate: '75%' // Example
        }
      };
    }
    
    // Common stats for all users
    const upcomingTournaments = await Tournament.countDocuments({
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open'] },
      schedule_time: { $gt: new Date() }
    });
    
    const liveTournaments = await Tournament.countDocuments({
      approval_status: 'approved',
      status: 'live'
    });
    
    const totalPrizePool = await Tournament.aggregate([
      {
        $match: {
          approval_status: 'approved',
          status: { $in: ['upcoming', 'registration_open', 'live'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_prize' }
        }
      }
    ]);
    
    const response = {
      success: true,
      code: 'DASHBOARD_FETCHED',
      message: 'Dashboard overview fetched successfully',
      data: {
        user: {
          id: userId,
          username: req.user.username,
          role: userRole,
          joined_date: req.user.createdAt || new Date()
        },
        overview: {
          upcoming_tournaments: upcomingTournaments,
          live_tournaments: liveTournaments,
          total_prize_pool: totalPrizePool[0]?.total || 0,
          formatted_total_prize_pool: formatCurrency(totalPrizePool[0]?.total || 0),
          total_participants: 0, // To be calculated
          platform_status: 'operational' // Example
        },
        user_specific: userStats,
        admin_specific: userRole !== 'user' ? adminStats : null,
        quick_actions: getQuickActions(userRole),
        notifications: {
          unread_count: 0, // To be calculated
          recent_alerts: [] // To be populated
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 60 // 1 minute cache for dashboard
      }
    };
    
    // Cache response
    await redis.setex(cacheKey, 60, JSON.stringify(response));
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ GET DASHBOARD OVERVIEW ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'DASHBOARD_ERROR',
      message: 'Failed to fetch dashboard overview',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 HELPER: Get quick actions based on user role
const getQuickActions = (userRole) => {
  const actions = [
    {
      id: 'create_tournament',
      label: 'Create Tournament',
      icon: 'plus',
      path: '/tournaments/create',
      description: 'Create a new tournament',
      available: true
    },
    {
      id: 'join_tournament',
      label: 'Join Tournament',
      icon: 'user-plus',
      path: '/tournaments',
      description: 'Join upcoming tournaments',
      available: true
    },
    {
      id: 'my_tournaments',
      label: 'My Tournaments',
      icon: 'list',
      path: '/tournaments/my',
      description: 'View your tournaments',
      available: true
    }
  ];
  
  if (userRole !== 'user') {
    actions.push(
      {
        id: 'approve_tournaments',
        label: 'Approve Tournaments',
        icon: 'check-circle',
        path: '/admin/tournaments/pending',
        description: 'Review pending tournaments',
        available: true
      },
      {
        id: 'manage_tournaments',
        label: 'Manage Tournaments',
        icon: 'settings',
        path: '/admin/tournaments',
        description: 'Manage all tournaments',
        available: true
      }
    );
  }
  
  return actions;
};

// Export all functions
module.exports = exports;
