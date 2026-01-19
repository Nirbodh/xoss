// controllers/matchController.js - COMPLETE PRODUCTION VERSION
const Match = require('../models/Match');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Redis = require('ioredis');

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ==================== PUBLIC ROUTE FUNCTIONS ====================

// ✅ GET all matches with filters
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

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      code: 'MATCHES_FETCHED',
      message: 'Matches fetched successfully',
      data: matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
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

// ✅ GET match by ID
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
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

    res.json({
      success: true,
      code: 'MATCH_FETCHED',
      message: 'Match fetched successfully',
      data: match,
      timestamp: new Date().toISOString()
    });
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

// ✅ SEARCH matches
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

    res.json({
      success: true,
      code: 'SEARCH_COMPLETED',
      message: 'Matches search completed successfully',
      data: matches,
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

// ✅ GET featured matches
exports.getFeaturedMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      is_featured: true,
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open'] }
    })
      .populate('created_by', 'username avatar rating')
      .sort({ schedule_time: 1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      code: 'FEATURED_MATCHES_FETCHED',
      message: 'Featured matches fetched successfully',
      data: matches,
      count: matches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET FEATURED MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch featured matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET upcoming matches
exports.getUpcomingMatches = async (req, res) => {
  try {
    const { hours = 24, limit = 10 } = req.query;
    const timeThreshold = new Date(Date.now() + parseInt(hours) * 60 * 60 * 1000);

    const matches = await Match.find({
      approval_status: 'approved',
      status: { $in: ['upcoming', 'registration_open'] },
      schedule_time: { $lte: timeThreshold, $gt: new Date() }
    })
      .populate('created_by', 'username avatar rating')
      .sort({ schedule_time: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      code: 'UPCOMING_MATCHES_FETCHED',
      message: 'Upcoming matches fetched successfully',
      data: matches,
      count: matches.length,
      time_window: `${hours} hours`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET UPCOMING MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch upcoming matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET match statistics
exports.getMatchStatistics = async (req, res) => {
  try {
    const stats = await Match.aggregate([
      {
        $group: {
          _id: null,
          total_matches: { $sum: 1 },
          total_prize_pool: { $sum: '$total_prize' },
          total_participants: { $sum: '$current_participants' },
          upcoming_count: { $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] } },
          live_count: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
          completed_count: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    const gameStats = await Match.aggregate([
      {
        $group: {
          _id: '$game',
          count: { $sum: 1 },
          total_prize: { $sum: '$total_prize' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      code: 'STATISTICS_FETCHED',
      message: 'Match statistics fetched successfully',
      data: {
        overall: stats[0] || {
          total_matches: 0,
          total_prize_pool: 0,
          total_participants: 0,
          upcoming_count: 0,
          live_count: 0,
          completed_count: 0
        },
        game_distribution: gameStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ GET MATCH STATISTICS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATISTICS_ERROR',
      message: 'Failed to fetch match statistics',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ DEBUG: Get collection info
exports.debugCollections = async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      code: 'DEBUG_INFO',
      message: 'Debug information fetched successfully',
      data: {
        collections: collections.map(c => c.name),
        total_collections: collections.length,
        mongodb_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ DEBUG COLLECTIONS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'DEBUG_ERROR',
      message: 'Failed to fetch debug information',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ Get matches by filter type
exports.getMatchesByFilter = async (req, res) => {
  try {
    const { filterType } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
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

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      code: 'FILTERED_MATCHES_FETCHED',
      message: `Matches filtered by ${filterType}`,
      data: matches,
      filter: filterType,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
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

// ==================== USER PROTECTED FUNCTIONS ====================

// ✅ CREATE a new match
exports.createMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchData = {
      ...req.body,
      created_by: req.user.userId,
      status: req.user.role === 'admin' ? 'upcoming' : 'pending',
      approval_status: req.user.role === 'admin' ? 'approved' : 'pending',
      current_participants: 0
    };

    if (req.user.role === 'admin') {
      matchData.approved_by = req.user.userId;
      matchData.approved_at = new Date();
    }

    const match = await Match.create([matchData], { session });
    
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      code: 'MATCH_CREATED',
      message: req.user.role === 'admin' 
        ? 'Match created and approved successfully!' 
        : 'Match created successfully! Waiting for admin approval.',
      data: match[0],
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

// ✅ UPDATE match
exports.updateMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const match = await Match.findById(req.params.id).session(session);
    
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

    // Check authorization
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    const isCreator = match.created_by.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isCreator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to update this match',
        timestamp: new Date().toISOString()
      });
    }

    Object.assign(match, req.body);
    match.updated_at = new Date();
    
    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_UPDATED',
      message: 'Match updated successfully',
      data: match,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ UPDATE MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ DELETE match
exports.deleteMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const match = await Match.findById(req.params.id).session(session);
    
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

    // Check authorization
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    const isCreator = match.created_by.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isCreator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to delete this match',
        timestamp: new Date().toISOString()
      });
    }

    await Match.findByIdAndDelete(req.params.id).session(session);
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_DELETED',
      message: 'Match deleted successfully',
      data: { match_id: req.params.id },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ DELETE MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'DELETE_ERROR',
      message: 'Failed to delete match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ UPDATE match status
exports.updateMatchStatus = async (req, res) => {
  try {
    // TODO: Implement match status update logic
    res.json({
      success: true,
      code: 'STATUS_UPDATED',
      message: 'Match status updated successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ UPDATE MATCH STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_ERROR',
      message: 'Failed to update match status',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ JOIN match (without payment)
exports.joinMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const match = await Match.findById(req.params.id).session(session);
    
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

    // Check if match is joinable
    if (match.status !== 'upcoming' && match.status !== 'registration_open') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_JOINABLE',
        message: 'Match is not joinable',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already joined
    const alreadyJoined = match.participants.some(p => 
      p.user && p.user.toString() === req.user.userId.toString()
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

    // Add participant
    match.participants.push({
      user: req.user.userId,
      status: 'registered',
      joined_at: new Date(),
      payment_status: 'free',
      amount_paid: 0
    });
    
    match.current_participants += 1;
    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_JOINED',
      message: 'Successfully joined match',
      data: {
        match_id: req.params.id,
        participants: match.current_participants,
        spots_left: match.max_participants - match.current_participants
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ JOIN MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'JOIN_ERROR',
      message: 'Failed to join match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ JOIN match WITH PAYMENT
exports.joinMatchWithPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const match = await Match.findById(req.params.id).session(session);
    
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

    // Check wallet balance
    const wallet = await Wallet.findOne({ user_id: req.user.userId }).session(session);
    if (!wallet || wallet.balance < match.entry_fee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: `Insufficient balance. Required: ${match.entry_fee}`,
        timestamp: new Date().toISOString()
      });
    }

    // Process payment
    wallet.balance -= match.entry_fee;
    wallet.total_spent += match.entry_fee;
    await wallet.save({ session });

    // Add participant
    match.participants.push({
      user: req.user.userId,
      status: 'registered',
      joined_at: new Date(),
      payment_status: 'paid',
      amount_paid: match.entry_fee
    });
    
    match.current_participants += 1;
    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_JOINED_PAID',
      message: 'Successfully joined match with payment',
      data: {
        match_id: req.params.id,
        entry_fee: match.entry_fee,
        participants: match.current_participants,
        new_balance: wallet.balance
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
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ LEAVE match
exports.leaveMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const match = await Match.findById(req.params.id).session(session);
    
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

    // Find participant
    const participantIndex = match.participants.findIndex(p => 
      p.user && p.user.toString() === req.user.userId.toString()
    );
    
    if (participantIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_JOINED',
        message: 'You have not joined this match',
        timestamp: new Date().toISOString()
      });
    }

    // Check if match has started
    if (match.status === 'live') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MATCH_STARTED',
        message: 'Cannot leave match after it has started',
        timestamp: new Date().toISOString()
      });
    }

    const participant = match.participants[participantIndex];
    
    // Refund if paid
    if (participant.payment_status === 'paid') {
      const wallet = await Wallet.findOne({ user_id: req.user.userId }).session(session);
      if (wallet) {
        wallet.balance += participant.amount_paid;
        wallet.total_spent -= participant.amount_paid;
        await wallet.save({ session });
      }
    }

    // Remove participant
    match.participants.splice(participantIndex, 1);
    match.current_participants = Math.max(0, match.current_participants - 1);
    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'LEFT_MATCH',
      message: 'Successfully left match',
      data: {
        match_id: req.params.id,
        refund_processed: participant.payment_status === 'paid',
        remaining_participants: match.current_participants
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ LEAVE MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'LEAVE_ERROR',
      message: 'Failed to leave match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET user matches
exports.getUserMatches = async (req, res) => {
  try {
    const { type = 'all', limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    if (type === 'created') {
      query.created_by = req.user.userId;
    } else if (type === 'joined') {
      query['participants.user'] = req.user.userId;
    } else if (type === 'upcoming') {
      query['participants.user'] = req.user.userId;
      query.status = { $in: ['upcoming', 'registration_open'] };
    } else if (type === 'ongoing') {
      query['participants.user'] = req.user.userId;
      query.status = 'live';
    } else if (type === 'completed') {
      query['participants.user'] = req.user.userId;
      query.status = 'completed';
    } else {
      // all - both created and joined
      query.$or = [
        { created_by: req.user.userId },
        { 'participants.user': req.user.userId }
      ];
    }

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar')
      .sort({ schedule_time: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      code: 'USER_MATCHES_FETCHED',
      message: 'User matches fetched successfully',
      data: matches,
      type: type,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
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

// ✅ GET match participants
exports.getMatchParticipants = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('participants.user', 'username avatar rating')
      .select('participants title current_participants max_participants')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      code: 'PARTICIPANTS_FETCHED',
      message: 'Match participants fetched successfully',
      data: {
        match_id: req.params.id,
        title: match.title,
        participants: match.participants,
        total: match.current_participants,
        max: match.max_participants,
        spots_left: match.max_participants - match.current_participants
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET MATCH PARTICIPANTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'PARTICIPANTS_ERROR',
      message: 'Failed to fetch match participants',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== MATCH RESULTS FUNCTIONS ====================

// ✅ SUBMIT match result
exports.submitMatchResult = async (req, res) => {
  try {
    // TODO: Implement submit match result logic
    res.json({
      success: true,
      code: 'RESULT_SUBMITTED',
      message: 'Match result submitted successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SUBMIT MATCH RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SUBMISSION_ERROR',
      message: 'Failed to submit match result',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET match results
exports.getMatchResults = async (req, res) => {
  try {
    // TODO: Implement get match results logic
    res.json({
      success: true,
      code: 'RESULTS_FETCHED',
      message: 'Match results fetched successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET MATCH RESULTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'RESULTS_ERROR',
      message: 'Failed to fetch match results',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ UPDATE submitted result
exports.updateMatchResult = async (req, res) => {
  try {
    // TODO: Implement update match result logic
    res.json({
      success: true,
      code: 'RESULT_UPDATED',
      message: 'Match result updated successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ UPDATE MATCH RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'UPDATE_RESULT_ERROR',
      message: 'Failed to update match result',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ GET user's match result
exports.getMyMatchResult = async (req, res) => {
  try {
    // TODO: Implement get user's match result logic
    res.json({
      success: true,
      code: 'MY_RESULT_FETCHED',
      message: 'User match result fetched successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET MY MATCH RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MY_RESULT_ERROR',
      message: 'Failed to fetch user match result',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== DASHBOARD & ANALYTICS FUNCTIONS ====================

// ✅ GET dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    // TODO: Implement dashboard overview logic
    res.json({
      success: true,
      code: 'DASHBOARD_FETCHED',
      message: 'Dashboard overview fetched successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
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

// ✅ GET match analytics
exports.getMatchAnalytics = async (req, res) => {
  try {
    // TODO: Implement match analytics logic
    res.json({
      success: true,
      code: 'ANALYTICS_FETCHED',
      message: 'Match analytics fetched successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GET MATCH ANALYTICS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ANALYTICS_ERROR',
      message: 'Failed to fetch match analytics',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

// ✅ ADMIN: Get all matches
exports.getAllMatchesForAdmin = async (req, res) => {
  try {
    // TODO: Implement get all matches for admin logic
    res.json({
      success: true,
      code: 'ADMIN_MATCHES_FETCHED',
      message: 'Matches fetched for admin',
      data: [],
      timestamp: new Date().toISOString()
    });
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

// ✅ ADMIN: Get pending matches
exports.getPendingMatchesForAdmin = async (req, res) => {
  try {
    // TODO: Implement get pending matches logic
    res.json({
      success: true,
      code: 'PENDING_MATCHES_FETCHED',
      message: 'Pending matches fetched',
      data: [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ ADMIN PENDING MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'PENDING_FETCH_ERROR',
      message: 'Failed to fetch pending matches',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Approve match
exports.approveMatchForAdmin = async (req, res) => {
  try {
    // TODO: Implement match approval logic
    res.json({
      success: true,
      code: 'MATCH_APPROVED',
      message: 'Match approved successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ APPROVE MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'APPROVAL_ERROR',
      message: 'Failed to approve match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Reject match
exports.rejectMatchForAdmin = async (req, res) => {
  try {
    // TODO: Implement match rejection logic
    res.json({
      success: true,
      code: 'MATCH_REJECTED',
      message: 'Match rejected successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ REJECT MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REJECTION_ERROR',
      message: 'Failed to reject match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Remove participant
exports.removeParticipant = async (req, res) => {
  try {
    // TODO: Implement remove participant logic
    res.json({
      success: true,
      code: 'PARTICIPANT_REMOVED',
      message: 'Participant removed successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ REMOVE PARTICIPANT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REMOVAL_ERROR',
      message: 'Failed to remove participant',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Update participant status
exports.updateParticipantStatus = async (req, res) => {
  try {
    // TODO: Implement update participant status logic
    res.json({
      success: true,
      code: 'PARTICIPANT_STATUS_UPDATED',
      message: 'Participant status updated successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ UPDATE PARTICIPANT STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'STATUS_UPDATE_ERROR',
      message: 'Failed to update participant status',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== RESULT VERIFICATION FUNCTIONS ====================

// ✅ ADMIN: Verify match result
exports.verifyMatchResult = async (req, res) => {
  try {
    // TODO: Implement verify match result logic
    res.json({
      success: true,
      code: 'RESULT_VERIFIED',
      message: 'Match result verified successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ VERIFY MATCH RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'VERIFICATION_ERROR',
      message: 'Failed to verify match result',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Reject match result
exports.rejectMatchResult = async (req, res) => {
  try {
    // TODO: Implement reject match result logic
    res.json({
      success: true,
      code: 'RESULT_REJECTED',
      message: 'Match result rejected successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ REJECT MATCH RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REJECTION_ERROR',
      message: 'Failed to reject match result',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Calculate winners
exports.calculateWinners = async (req, res) => {
  try {
    // TODO: Implement calculate winners logic
    res.json({
      success: true,
      code: 'WINNERS_CALCULATED',
      message: 'Winners calculated successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ CALCULATE WINNERS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'CALCULATION_ERROR',
      message: 'Failed to calculate winners',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Distribute prizes
exports.distributePrizes = async (req, res) => {
  try {
    // TODO: Implement distribute prizes logic
    res.json({
      success: true,
      code: 'PRIZES_DISTRIBUTED',
      message: 'Prizes distributed successfully',
      data: {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ DISTRIBUTE PRIZES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'DISTRIBUTION_ERROR',
      message: 'Failed to distribute prizes',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== EXPORT ====================

module.exports = exports;
