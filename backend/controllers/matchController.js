// controllers/matchController.js - COMPLETELY FIXED VERSION WITH ALL FEATURES

const Match = require('../models/Match');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Redis = require('ioredis');

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache TTL constants
const MATCH_CACHE_TTL = 60; // 60 seconds
const MATCH_DETAILS_CACHE_TTL = 300; // 5 minutes

// ✅ FIXED: Universal formatter for responses
const formatMatchResponse = (match) => {
  if (!match) return null;
  
  return {
    ...match,
    // Frontend-friendly camelCase conversion
    entryFee: match.entry_fee || 0,
    prizePool: match.total_prize || 0,
    maxPlayers: match.max_participants || 0,
    currentPlayers: match.current_participants || 0,
    scheduleTime: match.schedule_time,
    startTime: match.start_time,
    endTime: match.end_time,
    isFeatured: match.is_featured || false,
    approvalStatus: match.approval_status || 'pending',
    registrationOpen: match.registration_open || false,
    resultSubmissionOpen: match.result_submission_open || false,
    allowResultEdit: match.allow_result_edit || false,
    killPrizeEnabled: match.kill_prize_enabled || false,
    perKillPrize: match.per_kill || 0,
    
    // Virtual fields for frontend
    spotsLeft: (match.max_participants || 0) - (match.current_participants || 0),
    isJoinable: (
      (match.status === 'upcoming' || match.status === 'registration_open') && 
      (match.current_participants || 0) < (match.max_participants || 0)
    ),
    timeUntilStart: match.schedule_time ? 
      new Date(match.schedule_time).getTime() - Date.now() : null
  };
};

// ✅ Helper: Clear match cache
const clearMatchCache = async (matchId = null) => {
  try {
    if (matchId) {
      const keys = [
        `match:${matchId}:details`,
        ...(await redis.keys(`match:*${matchId}*`)),
        ...(await redis.keys('matches:*'))
      ];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      const keys = await redis.keys('matches:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
    console.log('🧹 Match cache cleared');
  } catch (error) {
    console.error('❌ Clear cache error:', error);
  }
};

// ✅ Helper: Generate cache key for matches
const generateMatchesCacheKey = (query) => {
  const params = {
    page: query.page || 1,
    limit: query.limit || 20,
    status: query.status,
    game: query.game,
    type: query.type,
    sort: query.sort
  };
  return `matches:${JSON.stringify(params)}`;
};

// ✅ Helper: Create transaction record
const createTransactionRecord = async (userId, type, amount, description, referenceId, metadata = {}, session = null) => {
  try {
    const transactionData = {
      user_id: userId,
      type: type,
      amount: amount,
      description: description,
      status: 'completed',
      reference_id: referenceId,
      metadata: metadata,
      timestamp: new Date()
    };

    if (session) {
      return await Transaction.create([transactionData], { session });
    } else {
      return await Transaction.create([transactionData]);
    }
  } catch (error) {
    console.error('❌ Transaction creation error:', error);
    throw error;
  }
};

// ✅ Helper: Create notification
const createNotification = async (userId, type, title, message, data = {}, priority = 'medium', session = null) => {
  try {
    const notificationData = {
      user_id: userId,
      type: type,
      title: title,
      message: message,
      data: data,
      priority: priority,
      read: false,
      created_at: new Date()
    };

    if (session) {
      return await Notification.create([notificationData], { session });
    } else {
      return await Notification.create([notificationData]);
    }
  } catch (error) {
    console.error('❌ Notification creation error:', error);
    // Don't throw error for notification failure
  }
};

// ✅ Helper: Process revenue sharing
const processRevenueSharing = async (match, joinerId, joinerUsername, entryFee, session) => {
  try {
    const creatorId = match.created_by;
    
    // Check if creator is not admin and not joining themselves
    if (creatorId.toString() !== joinerId.toString()) {
      const creator = await User.findById(creatorId).session(session);
      
      if (creator && creator.role !== 'admin') {
        const revenueShare = entryFee * 0.10; // 10% revenue
        
        // Update creator's wallet
        const creatorWallet = await Wallet.findOne({ user_id: creatorId }).session(session);
        if (creatorWallet) {
          creatorWallet.balance += revenueShare;
          creatorWallet.total_earned += revenueShare;
          creatorWallet.last_activity = new Date();
          await creatorWallet.save({ session });

          // Transaction record for creator
          await createTransactionRecord(
            creatorId,
            'credit',
            revenueShare,
            `10% revenue from ${joinerUsername} joining your match: ${match.title}`,
            match._id,
            {
              match_id: match._id,
              match_title: match.title,
              from_user: joinerId,
              revenue_type: 'creator_share',
              percentage: 10
            },
            session
          );

          // Give 5 points to creator for each join
          await User.findByIdAndUpdate(creatorId, {
            $inc: { 
              points: 5,
              total_points_earned: 5
            },
            $push: {
              points_history: {
                type: 'player_join',
                amount: 5,
                description: `${joinerUsername} joined your match: ${match.title}`,
                timestamp: new Date(),
                reference_id: match._id
              }
            }
          }).session(session);

          console.log(`💰 Creator ${creatorId} received 10% revenue: ${revenueShare} and 5 points`);
          
          return revenueShare;
        }
      }
    }
    return 0;
  } catch (error) {
    console.error('❌ Revenue sharing error:', error);
    throw error;
  }
};

// ==================== PUBLIC ROUTE FUNCTIONS ====================

// ✅ GET all matches with filters - FIXED RESPONSE FORMAT WITH CACHING
exports.getMatches = async (req, res) => {
  try {
    const { 
      status, 
      game, 
      type, 
      limit = 20, 
      page = 1,
      sort = 'schedule_time'
    } = req.query;

    // Generate cache key
    const cacheKey = generateMatchesCacheKey({ status, game, type, limit, page, sort });
    
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving matches from cache');
      return res.json(JSON.parse(cachedData));
    }

    const query = { approval_status: 'approved' };
    
    if (status && status !== 'all') query.status = status;
    if (game && game !== 'all') query.game = game;
    if (type && type !== 'all') query.type = type;

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar rating')
      .sort({ [sort]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // ✅ Apply formatter to all matches
    const formattedMatches = matches.map(match => formatMatchResponse(match));

    const total = await Match.countDocuments(query);

    const response = {
      success: true,
      code: 'MATCHES_FETCHED',
      message: 'Matches fetched successfully',
      data: formattedMatches, // ✅ Formatted data
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: MATCH_CACHE_TTL
      }
    };

    // Store in cache
    await redis.setex(cacheKey, MATCH_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ GET MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET match by ID - FIXED WITH CACHING
exports.getMatchById = async (req, res) => {
  try {
    const matchId = req.params.id;
    const cacheKey = `match:${matchId}:details`;
    
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving match details from cache');
      return res.json(JSON.parse(cachedData));
    }

    const match = await Match.findById(matchId)
      .populate('created_by', 'username avatar rating')
      .populate('participants.user', 'username avatar')
      .populate('results.player_id', 'username avatar')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    // ✅ Apply formatter
    const formattedMatch = formatMatchResponse(match);

    // Check if user has joined
    let hasJoined = false;
    if (req.user && req.user.userId) {
      hasJoined = match.participants?.some(p => 
        p.user && p.user._id.toString() === req.user.userId.toString()
      ) || false;
    }

    const response = {
      success: true,
      code: 'MATCH_FETCHED',
      message: 'Match fetched successfully',
      data: {
        ...formattedMatch,
        has_joined: hasJoined
      }, // ✅ Formatted data
      participants_info: {
        total: match.current_participants,
        max: match.max_participants,
        spots_left: match.max_participants - match.current_participants,
        participants: match.participants || []
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: MATCH_DETAILS_CACHE_TTL
      }
    };

    // Store in cache
    await redis.setex(cacheKey, MATCH_DETAILS_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ GET MATCH BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ SEARCH matches - FIXED
exports.searchMatches = async (req, res) => {
  try {
    const { query, game, type, min_prize, max_prize } = req.query;
    
    const searchQuery = {
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open', 'live'] }
    };

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (game && game !== 'all') searchQuery.game = game;
    if (type && type !== 'all') searchQuery.type = type;
    if (min_prize) searchQuery.total_prize = { $gte: parseFloat(min_prize) };
    if (max_prize) searchQuery.total_prize = { ...searchQuery.total_prize, $lte: parseFloat(max_prize) };

    const matches = await Match.find(searchQuery)
      .populate('created_by', 'username avatar')
      .sort({ schedule_time: 1 })
      .limit(20)
      .lean();

    // ✅ Apply formatter
    const formattedMatches = matches.map(match => formatMatchResponse(match));

    res.json({
      success: true,
      code: 'SEARCH_COMPLETED',
      message: 'Matches search completed successfully',
      data: formattedMatches, // ✅ Formatted data
      count: matches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SEARCH MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SEARCH_ERROR',
      message: 'Failed to search matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ CREATE a new match - FIXED WITH POINTS SYSTEM AND NOTIFICATIONS
exports.createMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // ✅ Handle both camelCase and snake_case input
    const {
      entryFee,
      prizePool,
      maxPlayers,
      scheduleTime,
      endTime,
      title,
      description,
      game,
      type,
      map,
      perKillPrize,
      killPrizeEnabled,
      ...rest
    } = req.body;

    const matchData = {
      // Frontend fields → Database fields
      title,
      description,
      game,
      type,
      map,
      entry_fee: entryFee || 0,
      total_prize: prizePool || 0,
      max_participants: maxPlayers || 50,
      schedule_time: scheduleTime,
      start_time: scheduleTime,
      end_time: endTime,
      per_kill: perKillPrize || 0,
      kill_prize_enabled: killPrizeEnabled || false,
      
      // System fields
      created_by: req.user.userId,
      status: req.user.role === 'admin' ? 'upcoming' : 'pending_approval',
      approval_status: req.user.role === 'admin' ? 'approved' : 'pending',
      current_participants: 0,
      participants: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add admin approval data if admin created
    if (req.user.role === 'admin') {
      matchData.approved_by = req.user.userId;
      matchData.approved_at = new Date();
      matchData.admin_notes = 'Auto-approved by admin';
    }

    console.log('📦 Creating match with data:', matchData);

    const match = await Match.create([matchData], { session });
    const createdMatch = match[0];
    
    // ✅ GIVE POINTS TO CREATOR (5 points for match creation)
    if (req.user.role !== 'admin') {
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { 
          points: 5,
          total_points_earned: 5
        },
        $push: {
          points_history: {
            type: 'match_creation',
            amount: 5,
            description: `Created match: ${title}`,
            timestamp: new Date(),
            reference_id: createdMatch._id
          }
        }
      }).session(session);
      
      console.log(`✅ ${req.user.username} received 5 points for creating match`);
      
      // Create notification for creator
      await createNotification(
        req.user.userId,
        'match_created',
        'Match Created Successfully',
        req.user.role === 'admin' 
          ? `Your match "${title}" has been created and auto-approved!` 
          : `Your match "${title}" has been created! Waiting for admin approval.`,
        {
          match_id: createdMatch._id,
          match_title: title,
          status: createdMatch.approval_status,
          prize_pool: prizePool || 0
        },
        'high',
        session
      );
      
      // Notify admins about pending match
      if (req.user.role === 'user') {
        try {
          const adminUsers = await User.find({ role: { $in: ['admin', 'moderator'] } }).session(session);
          
          for (const admin of adminUsers) {
            await createNotification(
              admin._id,
              'match_pending',
              'New Match Pending Approval',
              `New match "${title}" created by ${req.user.username || 'User'}`,
              {
                match_id: createdMatch._id,
                match_title: title,
                created_by: req.user.userId,
                created_by_name: req.user.username || 'User',
                prize_pool: prizePool || 0,
                participants: maxPlayers || 50
              },
              'high',
              session
            );
          }
          console.log(`📢 Notifications sent to ${adminUsers.length} admins`);
        } catch (notifyError) {
          console.error('❌ Admin notification error:', notifyError);
        }
      }
    } else {
      // Admin created - auto-approved
      await createNotification(
        req.user.userId,
        'match_created',
        'Match Created and Approved',
        `Your match "${title}" has been created and auto-approved!`,
        {
          match_id: createdMatch._id,
          match_title: title,
          status: 'approved',
          prize_pool: prizePool || 0
        },
        'high',
        session
      );
    }
    
    // Clear cache
    await clearMatchCache();
    
    await session.commitTransaction();
    session.endSession();

    // ✅ Format response for frontend
    const formattedMatch = formatMatchResponse(createdMatch);

    res.status(201).json({
      success: true,
      code: 'MATCH_CREATED',
      message: req.user.role === 'admin' 
        ? 'Match created and approved successfully!' 
        : 'Match created successfully! Waiting for admin approval.',
      data: formattedMatch, // ✅ Formatted data
      points_awarded: req.user.role !== 'admin' ? 5 : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ CREATE MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'CREATE_ERROR',
      message: 'Failed to create match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ✅✅✅ FIXED: JOIN match WITH PAYMENT (10% REVENUE + POINTS SYSTEM + TRANSACTIONS + NOTIFICATIONS)
exports.joinMatchWithPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // ✅ Accept both camelCase and snake_case input
    const { game_uid, gameUID, game_name, gameName } = req.body;
    const matchId = req.params.id;
    const joinerId = req.user.userId;
    const joinerUsername = req.user.username;

    console.log(`🎮 Joining match ${matchId} by user ${joinerId}`);
    console.log('🎯 Game Data:', { 
      game_uid: game_uid || gameUID,
      game_name: game_name || gameName 
    });

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

    // Check if match requires payment
    if (match.entry_fee <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_PAYMENT_REQUIRED',
        message: 'This match does not require payment',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already joined
    const alreadyJoined = match.participants.some(p => 
      p.user && p.user.toString() === joinerId.toString()
    );
    
    if (alreadyJoined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_JOINED',
        message: 'Already joined this match',
        timestamp: new Date().toISOString()
      });
    }

    // Check if match is full
    if (match.current_participants >= match.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MATCH_FULL',
        message: 'Match is full',
        timestamp: new Date().toISOString()
      });
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ user_id: joinerId }).session(session);
    if (!wallet || wallet.balance < match.entry_fee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: `Insufficient balance. Required: ${match.entry_fee}, Available: ${wallet?.balance || 0}`,
        timestamp: new Date().toISOString()
      });
    }

    // ==================== PAYMENT PROCESSING ====================
    // Deduct from joiner's wallet
    wallet.balance -= match.entry_fee;
    wallet.total_spent += match.entry_fee;
    wallet.last_activity = new Date();
    await wallet.save({ session });

    // Create transaction record for joiner
    await createTransactionRecord(
      joinerId,
      'match_entry',
      match.entry_fee,
      `Entry fee for match: ${match.title}`,
      match._id,
      {
        match_id: match._id,
        match_title: match.title,
        game_uid: game_uid || gameUID,
        game_name: game_name || gameName,
        payment_type: 'entry_fee',
        status: 'completed'
      },
      session
    );

    // ==================== 10% REVENUE SHARING ====================
    const revenueShare = await processRevenueSharing(match, joinerId, joinerUsername, match.entry_fee, session);

    // ==================== ADD PARTICIPANT ====================
    match.participants.push({
      user: joinerId,
      status: 'registered',
      joined_at: new Date(),
      payment_status: 'paid',
      amount_paid: match.entry_fee,
      game_data: {
        uid: game_uid || gameUID,
        name: game_name || gameName,
        player_name: joinerUsername,
        region: 'BD',
        device: 'mobile'
      },
      metadata: {
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        join_method: 'paid',
        join_timestamp: new Date()
      }
    });
    
    match.current_participants += 1;
    
    // Update match revenue stats
    if (!match.revenue_info) {
      match.revenue_info = {
        total_collected: 0,
        creator_earned: 0,
        platform_fee: 0,
        revenue_share_percentage: 10
      };
    }
    
    match.revenue_info.total_collected += match.entry_fee;
    match.revenue_info.creator_earned += revenueShare;
    match.revenue_info.platform_fee += (match.entry_fee - revenueShare);
    
    await match.save({ session });
    
    // ==================== NOTIFICATIONS ====================
    // Notify creator about new participant
    if (match.created_by.toString() !== joinerId.toString()) {
      await createNotification(
        match.created_by,
        'participant_joined',
        'New Participant Joined',
        `${joinerUsername} joined your match "${match.title}"`,
        {
          match_id: match._id,
          match_title: match.title,
          participant_id: joinerId,
          participant_name: joinerUsername,
          entry_fee: match.entry_fee,
          current_participants: match.current_participants
        },
        'medium',
        session
      );
    }
    
    // Notify joiner about successful join
    await createNotification(
      joinerId,
      'match_joined',
      'Match Joined Successfully',
      `You joined "${match.title}" successfully`,
      {
        match_id: match._id,
        match_title: match.title,
        schedule_time: match.schedule_time,
        entry_fee: match.entry_fee,
        spots_left: match.max_participants - match.current_participants
      },
      'high',
      session
    );
    
    // Clear cache
    await clearMatchCache(matchId);
    
    await session.commitTransaction();
    session.endSession();

    // Get updated wallet balance
    const updatedWallet = await Wallet.findOne({ user_id: joinerId });
    
    // ✅ Format response for frontend
    const formattedMatch = formatMatchResponse(match);

    res.json({
      success: true,
      code: 'MATCH_JOINED_PAID',
      message: 'Successfully joined match with payment',
      data: {
        match: formattedMatch, // ✅ Formatted match data
        entry_fee: match.entry_fee,
        participants: match.current_participants,
        new_balance: updatedWallet.balance,
        spots_left: match.max_participants - match.current_participants,
        game_data_saved: true,
        revenue_shared: revenueShare,
        points_awarded_to_creator: 5
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ JOIN MATCH WITH PAYMENT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'JOIN_PAYMENT_ERROR',
      message: 'Failed to join match with payment',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ Get matches by filter type - FIXED WITH CACHING
exports.getMatchesByFilter = async (req, res) => {
  try {
    const { filterType } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    // Generate cache key
    const cacheKey = `matches:filter:${filterType}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving filtered matches from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    let query = { approval_status: 'approved' };
    
    switch (filterType) {
      case 'free':
        query.entry_fee = 0;
        break;
      case 'paid':
        query.entry_fee = { $gt: 0 };
        break;
      case 'high-prize':
        query.total_prize = { $gte: 1000 };
        break;
      case 'squad':
        query.type = 'Squad';
        break;
      case 'duo':
        query.type = 'Duo';
        break;
      case 'solo':
        query.type = 'Solo';
        break;
      case 'starting-soon':
        query.schedule_time = { $gte: new Date(), $lte: new Date(Date.now() + 2 * 60 * 60 * 1000) };
        query.status = { $in: ['upcoming', 'registration_open'] };
        break;
      default:
        query.status = filterType;
    }

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar rating')
      .sort({ schedule_time: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // ✅ Apply formatter
    const formattedMatches = matches.map(match => formatMatchResponse(match));

    const total = await Match.countDocuments(query);

    const response = {
      success: true,
      code: 'FILTERED_MATCHES_FETCHED',
      message: `Matches filtered by ${filterType}`,
      data: formattedMatches, // ✅ Formatted data
      filter: filterType,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: MATCH_CACHE_TTL
      }
    };

    // Store in cache
    await redis.setex(cacheKey, MATCH_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ GET MATCHES BY FILTER ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FILTER_ERROR',
      message: 'Failed to filter matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET user matches - FIXED
exports.getUserMatches = async (req, res) => {
  try {
    const { type = 'all', limit = 20, page = 1 } = req.query;
    const userId = req.user.userId;
    
    // Generate cache key
    const cacheKey = `user:${userId}:matches:${type}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving user matches from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    let query = {};
    
    if (type === 'created') {
      query.created_by = userId;
    } else if (type === 'joined') {
      query['participants.user'] = userId;
    } else if (type === 'upcoming') {
      query['participants.user'] = userId;
      query.status = { $in: ['upcoming', 'registration_open'] };
    } else if (type === 'ongoing') {
      query['participants.user'] = userId;
      query.status = 'live';
    } else if (type === 'completed') {
      query['participants.user'] = userId;
      query.status = 'completed';
    } else {
      // all - both created and joined
      query.$or = [
        { created_by: userId },
        { 'participants.user': userId }
      ];
    }

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar')
      .sort({ schedule_time: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // ✅ Apply formatter
    const formattedMatches = matches.map(match => formatMatchResponse(match));

    const total = await Match.countDocuments(query);

    const response = {
      success: true,
      code: 'USER_MATCHES_FETCHED',
      message: 'User matches fetched successfully',
      data: formattedMatches, // ✅ Formatted data
      type: type,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: MATCH_CACHE_TTL
      }
    };

    // Store in cache
    await redis.setex(cacheKey, MATCH_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ GET USER MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'USER_MATCHES_ERROR',
      message: 'Failed to fetch user matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Get all matches - FIXED WITH CACHING
exports.getAllMatchesForAdmin = async (req, res) => {
  try {
    const { status, approval_status, limit = 50, page = 1 } = req.query;
    
    // Generate cache key
    const cacheKey = `admin:matches:${status}:${approval_status}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving admin matches from cache');
      return res.json(JSON.parse(cachedData));
    }
    
    const query = {};
    
    if (status && status !== 'all') query.status = status;
    if (approval_status && approval_status !== 'all') query.approval_status = approval_status;

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar')
      .populate('approved_by', 'username')
      .populate('rejected_by', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // ✅ Apply formatter
    const formattedMatches = matches.map(match => formatMatchResponse(match));

    const total = await Match.countDocuments(query);

    const response = {
      success: true,
      code: 'ADMIN_MATCHES_FETCHED',
      message: 'Matches fetched for admin',
      data: formattedMatches, // ✅ Formatted data
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: MATCH_CACHE_TTL
      }
    };

    // Store in cache
    await redis.setex(cacheKey, MATCH_CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ ADMIN GET ALL MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_FETCH_ERROR',
      message: 'Failed to fetch matches for admin',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Approve match
exports.approveMatchForAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const adminId = req.user.userId;
    
    console.log(`👑 ADMIN: Approving match ${matchId}`);

    const match = await Match.findById(matchId)
      .populate('created_by', 'username email')
      .session(session);
    
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

    match.approval_status = 'approved';
    match.status = 'upcoming';
    match.approved_by = adminId;
    match.approved_at = new Date();
    match.admin_notes = req.body.admin_notes || 'Approved by admin';
    
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: 'approved',
      timestamp: new Date(),
      changed_by: adminId,
      notes: req.body.admin_notes || 'Approved by admin'
    });

    await match.save({ session });

    // Notify creator
    await createNotification(
      match.created_by._id,
      'match_approved',
      'Match Approved!',
      `Your match "${match.title}" has been approved by admin`,
      {
        match_id: match._id,
        match_title: match.title,
        approved_by: req.user.username,
        approved_at: new Date(),
        start_time: match.start_time,
        prize_pool: match.total_prize
      },
      'high',
      session
    );

    // Clear cache
    await clearMatchCache(matchId);

    await session.commitTransaction();
    session.endSession();

    console.log(`✅ MATCH APPROVED | ID: ${match._id} | Title: ${match.title} | Admin: ${req.user.username}`);

    const formattedMatch = formatMatchResponse(match);

    return res.json({
      success: true,
      code: 'MATCH_APPROVED',
      message: 'Match approved successfully',
      data: formattedMatch, // ✅ Formatted data
      approval_details: {
        approved_by: req.user.username,
        approved_at: new Date().toISOString(),
        notes: match.admin_notes
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ APPROVE MATCH ERROR:', error);
    return res.status(500).json({
      success: false,
      code: 'APPROVAL_FAILED',
      message: 'Failed to approve match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Reject match
exports.rejectMatchForAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const adminId = req.user.userId;
    
    console.log(`👑 ADMIN: Rejecting match ${matchId}`);

    const match = await Match.findById(matchId)
      .populate('created_by', 'username email')
      .populate('participants.user', 'username email')
      .session(session);
    
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

    if (match.approval_status === 'rejected') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'ALREADY_REJECTED',
        message: 'Match is already rejected',
        timestamp: new Date().toISOString()
      });
    }

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

    match.approval_status = 'rejected';
    match.status = 'cancelled';
    match.rejection_reason = req.body.rejection_reason;
    match.rejected_by = adminId;
    match.rejected_at = new Date();
    match.admin_notes = req.body.admin_notes || 'Rejected by admin';
    
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: 'rejected',
      timestamp: new Date(),
      changed_by: adminId,
      notes: req.body.rejection_reason
    });

    await match.save({ session });

    // Notify creator
    await createNotification(
      match.created_by._id,
      'match_rejected',
      'Match Rejected',
      `Your match "${match.title}" has been rejected`,
      {
        match_id: match._id,
        match_title: match.title,
        rejected_by: req.user.username,
        rejected_at: new Date(),
        rejection_reason: req.body.rejection_reason,
        admin_notes: req.body.admin_notes
      },
      'high',
      session
    );

    // Process refunds if match had paid participants
    if (match.entry_fee > 0 && match.participants.length > 0) {
      console.log('💰 Processing refunds for rejected match');
      
      for (const participant of match.participants) {
        if (participant.payment_status === 'paid') {
          const wallet = await Wallet.findOne({ user_id: participant.user }).session(session);
          if (wallet) {
            wallet.balance += participant.amount_paid;
            wallet.refunded_amount += participant.amount_paid;
            wallet.last_activity = new Date();
            await wallet.save({ session });
            
            await createTransactionRecord(
              participant.user,
              'credit',
              participant.amount_paid,
              `Refund for rejected match: ${match.title}`,
              match._id,
              {
                match_id: match._id,
                match_title: match.title,
                refund_reason: 'Match rejected by admin',
                refund_status: 'completed'
              },
              session
            );
            
            // Notify participant about refund
            await createNotification(
              participant.user,
              'match_refund',
              'Match Refund Processed',
              `Match "${match.title}" was rejected. Refund of ${match.entry_fee} processed.`,
              {
                match_id: match._id,
                match_title: match.title,
                refund_amount: match.entry_fee,
                refund_reason: 'Match rejected by admin',
                refund_status: 'completed'
              },
              'high',
              session
            );
          }
        }
      }
    }

    // Clear cache
    await clearMatchCache(matchId);

    await session.commitTransaction();
    session.endSession();

    console.log(`✅ MATCH REJECTED | ID: ${match._id} | Title: ${match.title} | Admin: ${req.user.username}`);

    const formattedMatch = formatMatchResponse(match);

    res.json({
      success: true,
      code: 'MATCH_REJECTED',
      message: 'Match rejected successfully',
      data: formattedMatch, // ✅ Formatted data
      rejection_details: {
        rejected_by: req.user.username,
        rejected_at: new Date().toISOString(),
        reason: match.rejection_reason,
        admin_notes: match.admin_notes
      },
      impact: {
        participants_notified: match.participants.length,
        refunds_processed: match.entry_fee > 0 ? match.participants.filter(p => p.payment_status === 'paid').length : 0,
        total_refund_amount: match.entry_fee > 0 ? match.entry_fee * match.participants.filter(p => p.payment_status === 'paid').length : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ REJECT MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REJECTION_FAILED',
      message: 'Failed to reject match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ Helper function to format matches array
const formatMatchesArray = (matches) => {
  return matches.map(match => formatMatchResponse(match));
};

module.exports = exports;
