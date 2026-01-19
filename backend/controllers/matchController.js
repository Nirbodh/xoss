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
      status: req.user.role === 'admin' ? 'upcoming' : 'pending_approval',
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
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        code: 'STATUS_REQUIRED',
        message: 'Status is required',
        timestamp: new Date().toISOString()
      });
    }

    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    // Authorization check
    const isAdmin = ['admin', 'moderator', 'super_admin'].includes(req.user.role);
    const isCreator = match.created_by.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to update match status',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = match.status;
    match.status = status;
    
    // Add to status history
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: status,
      old_status: oldStatus,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: req.body.notes || 'Status updated'
    });

    await match.save();

    res.json({
      success: true,
      code: 'STATUS_UPDATED',
      message: 'Match status updated successfully',
      data: {
        match_id: req.params.id,
        old_status: oldStatus,
        new_status: status
      },
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { rank, kills, damage, screenshot, survival_time, headshots, assists, revives } = req.body;
    
    if (!rank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'RANK_REQUIRED',
        message: 'Rank is required to submit result',
        timestamp: new Date().toISOString()
      });
    }

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

    // Check if user is a participant
    const participant = match.participants.find(p => 
      p.user && p.user.toString() === req.user.userId.toString()
    );
    
    if (!participant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You are not a participant in this match',
        timestamp: new Date().toISOString()
      });
    }

    // Check if result submission is open
    if (!match.result_submission_open) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'SUBMISSION_CLOSED',
        message: 'Result submission is closed',
        timestamp: new Date().toISOString()
      });
    }

    // Submit result using match method
    const result = match.submitResult(req.user.userId, {
      rank,
      kills: kills || 0,
      damage: damage || 0,
      screenshot,
      survival_time,
      headshots: headshots || 0,
      assists: assists || 0,
      revives: revives || 0
    });

    if (!result.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'SUBMISSION_FAILED',
        message: result.message,
        timestamp: new Date().toISOString()
      });
    }

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'RESULT_SUBMITTED',
      message: 'Match result submitted successfully',
      data: result.result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
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
    const match = await Match.findById(req.params.id)
      .populate('results.player_id', 'username avatar')
      .populate('results.verified_by', 'username')
      .select('results title game status result_status')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    // Sort results by rank
    const sortedResults = match.results.sort((a, b) => a.rank - b.rank);

    res.json({
      success: true,
      code: 'RESULTS_FETCHED',
      message: 'Match results fetched successfully',
      data: {
        match_id: req.params.id,
        title: match.title,
        game: match.game,
        status: match.status,
        result_status: match.result_status,
        results: sortedResults,
        total_results: sortedResults.length
      },
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { rank, kills, damage, screenshot, survival_time } = req.body;

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

    // Check if user is a participant
    const participant = match.participants.find(p => 
      p.user && p.user.toString() === req.user.userId.toString()
    );
    
    if (!participant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You are not a participant in this match',
        timestamp: new Date().toISOString()
      });
    }

    // Check if result editing is allowed
    if (!match.allow_result_edit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'EDIT_DISABLED',
        message: 'Result editing is disabled for this match',
        timestamp: new Date().toISOString()
      });
    }

    const resultIndex = match.results.findIndex(r => 
      r.player_id.toString() === req.user.userId.toString()
    );
    
    if (resultIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found for this user',
        timestamp: new Date().toISOString()
      });
    }

    const result = match.results[resultIndex];
    
    // Update result fields
    if (rank !== undefined) result.rank = rank;
    if (kills !== undefined) result.kills = kills;
    if (damage !== undefined) result.damage = damage;
    if (screenshot !== undefined) result.screenshot = screenshot;
    if (survival_time !== undefined) result.survival_time = survival_time;
    
    result.submitted_at = new Date();
    result.status = 'pending';

    // Recalculate total score
    const scoring = match.scoring_settings;
    const killPoints = (result.kills || 0) * (scoring.kill_points || 10);
    const rankPoints = scoring.rank_points?.get(result.rank.toString()) || 0;
    const damagePoints = (result.damage || 0) * (scoring.damage_multiplier || 0.01);
    const headshotBonus = (result.headshots || 0) * (scoring.headshot_bonus || 2);
    const survivalBonus = result.survival_time ? (scoring.survival_bonus || 5) : 0;
    
    result.total_score = killPoints + rankPoints + damagePoints + headshotBonus + survivalBonus;

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'RESULT_UPDATED',
      message: 'Match result updated successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
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
    const match = await Match.findById(req.params.id)
      .populate('results.player_id', 'username avatar')
      .select('results title game')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    const userResult = match.results.find(r => 
      r.player_id && r.player_id._id.toString() === req.user.userId.toString()
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found for this user',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      code: 'MY_RESULT_FETCHED',
      message: 'User match result fetched successfully',
      data: {
        match_id: req.params.id,
        title: match.title,
        game: match.game,
        result: userResult
      },
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
    const userId = req.user.userId;
    
    // Get user stats
    const createdMatches = await Match.countDocuments({ created_by: userId });
    const joinedMatches = await Match.countDocuments({ 'participants.user': userId });
    const upcomingMatches = await Match.countDocuments({ 
      'participants.user': userId,
      status: { $in: ['upcoming', 'registration_open'] }
    });
    const completedMatches = await Match.countDocuments({ 
      'participants.user': userId,
      status: 'completed'
    });

    // Get recent matches
    const recentMatches = await Match.find({
      $or: [
        { created_by: userId },
        { 'participants.user': userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('created_by', 'username avatar')
      .lean();

    // Get upcoming matches user joined
    const upcomingJoinedMatches = await Match.find({
      'participants.user': userId,
      status: { $in: ['upcoming', 'registration_open'] }
    })
      .sort({ schedule_time: 1 })
      .limit(3)
      .populate('created_by', 'username avatar')
      .lean();

    res.json({
      success: true,
      code: 'DASHBOARD_FETCHED',
      message: 'Dashboard overview fetched successfully',
      data: {
        stats: {
          created_matches: createdMatches,
          joined_matches: joinedMatches,
          upcoming_matches: upcomingMatches,
          completed_matches: completedMatches
        },
        recent_matches: recentMatches,
        upcoming_matches: upcomingJoinedMatches
      },
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
    const match = await Match.findById(req.params.id)
      .populate('participants.user', 'username avatar rating')
      .populate('results.player_id', 'username')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    // Basic analytics
    const analytics = {
      match_info: {
        title: match.title,
        game: match.game,
        status: match.status,
        created_by: match.created_by,
        schedule_time: match.schedule_time,
        start_time: match.start_time,
        end_time: match.end_time
      },
      participation: {
        total_participants: match.current_participants,
        max_participants: match.max_participants,
        participation_rate: ((match.current_participants / match.max_participants) * 100).toFixed(2) + '%',
        paid_participants: match.participants.filter(p => p.payment_status === 'paid').length,
        free_participants: match.participants.filter(p => p.payment_status === 'free').length
      },
      financial: {
        entry_fee: match.entry_fee,
        total_prize: match.total_prize,
        total_collection: match.entry_fee * match.current_participants,
        profit_loss: (match.entry_fee * match.current_participants) - match.total_prize
      },
      results: {
        total_submitted: match.results.length,
        verified_results: match.results.filter(r => r.status === 'verified').length,
        pending_results: match.results.filter(r => r.status === 'pending').length,
        rejected_results: match.results.filter(r => r.status === 'rejected').length
      }
    };

    // Performance analytics if results exist
    if (match.results.length > 0) {
      const totalKills = match.results.reduce((sum, r) => sum + (r.kills || 0), 0);
      const totalDamage = match.results.reduce((sum, r) => sum + (r.damage || 0), 0);
      const avgKills = (totalKills / match.results.length).toFixed(2);
      const avgDamage = (totalDamage / match.results.length).toFixed(2);

      analytics.performance = {
        total_kills: totalKills,
        total_damage: totalDamage,
        average_kills: parseFloat(avgKills),
        average_damage: parseFloat(avgDamage)
      };
    }

    res.json({
      success: true,
      code: 'ANALYTICS_FETCHED',
      message: 'Match analytics fetched successfully',
      data: analytics,
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
    const { status, approval_status, limit = 50, page = 1 } = req.query;
    
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

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      code: 'ADMIN_MATCHES_FETCHED',
      message: 'Matches fetched for admin',
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
    const { limit = 20, page = 1 } = req.query;
    
    const query = { 
      approval_status: 'pending',
      $or: [
        { status: 'pending_approval' },
        { status: 'draft' }
      ]
    };

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar rating')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      code: 'PENDING_MATCHES_FETCHED',
      message: 'Pending matches fetched',
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

    const { reason, featured = false } = req.body;

    // Update match status
    match.approval_status = 'approved';
    match.status = 'upcoming';
    match.approved_by = req.user.userId;
    match.approved_at = new Date();
    match.approval_reason = reason || 'Approved by admin';
    match.is_featured = featured;
    match.updated_at = new Date();

    // Add to status history
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: 'approved',
      old_status: match.approval_status,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: reason || 'Approved by admin'
    });

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_APPROVED',
      message: 'Match approved successfully',
      data: match,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
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

    const { reason } = req.body;
    if (!reason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'REASON_REQUIRED',
        message: 'Rejection reason is required',
        timestamp: new Date().toISOString()
      });
    }

    // Update match status
    match.approval_status = 'rejected';
    match.status = 'cancelled';
    match.rejected_by = req.user.userId;
    match.rejected_at = new Date();
    match.rejection_reason = reason;
    match.updated_at = new Date();

    // Add to status history
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: 'rejected',
      old_status: match.approval_status,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: reason
    });

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_REJECTED',
      message: 'Match rejected successfully',
      data: {
        match_id: req.params.id,
        reason: reason
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ REJECT MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REJECTION_ERROR',
      message: 'Failed to reject match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Update match status
exports.adminUpdateMatchStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        code: 'STATUS_REQUIRED',
        message: 'Status is required',
        timestamp: new Date().toISOString()
      });
    }

    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = match.status;
    match.status = status;
    
    // Add to status history
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: status,
      old_status: oldStatus,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: notes || `Status changed from ${oldStatus} to ${status} by admin`
    });

    await match.save();

    res.json({
      success: true,
      code: 'ADMIN_STATUS_UPDATED',
      message: 'Match status updated successfully by admin',
      data: {
        match_id: req.params.id,
        old_status: oldStatus,
        new_status: status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ ADMIN UPDATE MATCH STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'ADMIN_STATUS_UPDATE_ERROR',
      message: 'Failed to update match status',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ ADMIN: Remove participant
exports.removeParticipant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { matchId, participantId } = req.params;
    
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

    const participantIndex = match.participants.findIndex(p => 
      p._id.toString() === participantId
    );
    
    if (participantIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found in this match',
        timestamp: new Date().toISOString()
      });
    }

    const participant = match.participants[participantIndex];
    
    // Refund if paid
    if (participant.payment_status === 'paid') {
      const wallet = await Wallet.findOne({ user_id: participant.user }).session(session);
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
      code: 'PARTICIPANT_REMOVED',
      message: 'Participant removed successfully',
      data: {
        match_id: matchId,
        participant_id: participantId,
        user_id: participant.user,
        refund_processed: participant.payment_status === 'paid'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
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
    const { matchId, participantId } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        code: 'STATUS_REQUIRED',
        message: 'Status is required',
        timestamp: new Date().toISOString()
      });
    }

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    const participant = match.participants.id(participantId);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = participant.status;
    participant.status = status;
    
    // Add to status history
    if (!participant.status_history) {
      participant.status_history = [];
    }
    
    participant.status_history.push({
      status: status,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: notes || `Status changed from ${oldStatus} to ${status}`
    });

    await match.save();

    res.json({
      success: true,
      code: 'PARTICIPANT_STATUS_UPDATED',
      message: 'Participant status updated successfully',
      data: {
        match_id: matchId,
        participant_id: participantId,
        user_id: participant.user,
        old_status: oldStatus,
        new_status: status
      },
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
    const { matchId, resultId } = req.params;
    const { status = 'verified', notes } = req.body;
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    const result = match.results.id(resultId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = result.status;
    result.status = status;
    result.verified_at = new Date();
    result.verified_by = req.user.userId;
    result.admin_notes = notes || `Verified by ${req.user.role}`;

    // Add to verification history
    if (!result.verification_history) {
      result.verification_history = [];
    }
    
    result.verification_history.push({
      status: status,
      timestamp: new Date(),
      verified_by: req.user.userId,
      notes: notes || 'Verified by admin'
    });

    await match.save();

    res.json({
      success: true,
      code: 'RESULT_VERIFIED',
      message: 'Match result verified successfully',
      data: {
        match_id: matchId,
        result_id: resultId,
        old_status: oldStatus,
        new_status: status,
        verified_at: result.verified_at,
        verified_by: result.verified_by
      },
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
    const { matchId, resultId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        code: 'REASON_REQUIRED',
        message: 'Rejection reason is required',
        timestamp: new Date().toISOString()
      });
    }

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    const result = match.results.id(resultId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = result.status;
    result.status = 'rejected';
    result.verified_at = new Date();
    result.verified_by = req.user.userId;
    result.admin_notes = reason;

    // Add to verification history
    if (!result.verification_history) {
      result.verification_history = [];
    }
    
    result.verification_history.push({
      status: 'rejected',
      timestamp: new Date(),
      verified_by: req.user.userId,
      notes: reason
    });

    await match.save();

    res.json({
      success: true,
      code: 'RESULT_REJECTED',
      message: 'Match result rejected successfully',
      data: {
        match_id: matchId,
        result_id: resultId,
        old_status: oldStatus,
        new_status: 'rejected',
        rejected_at: result.verified_at,
        rejected_by: result.verified_by,
        reason: reason
      },
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

    // Check if match is completed
    if (match.status !== 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MATCH_NOT_COMPLETED',
        message: 'Match must be completed to calculate winners',
        timestamp: new Date().toISOString()
      });
    }

    // Get verified results sorted by total score (descending)
    const verifiedResults = match.results
      .filter(r => r.status === 'verified')
      .sort((a, b) => b.total_score - a.total_score);

    if (verifiedResults.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_VERIFIED_RESULTS',
        message: 'No verified results to calculate winners',
        timestamp: new Date().toISOString()
      });
    }

    // Clear existing winners
    match.winners = [];

    // Calculate prize distribution
    const totalPrize = match.total_prize;
    const prizeDistribution = match.prize_distribution || [50, 30, 20]; // Default distribution
    
    // Calculate winners and prizes
    for (let i = 0; i < Math.min(verifiedResults.length, prizeDistribution.length); i++) {
      const result = verifiedResults[i];
      const prizePercentage = prizeDistribution[i];
      const prizeAmount = (totalPrize * prizePercentage) / 100;
      
      // Calculate kill prize
      const killPrize = match.kill_prize_enabled ? (result.kills * match.per_kill) : 0;
      const totalPrizeAmount = prizeAmount + killPrize;

      match.winners.push({
        rank: i + 1,
        user: result.player_id,
        username: result.player_name,
        kills: result.kills,
        damage: result.damage,
        prize_amount: prizeAmount,
        kill_prize: killPrize,
        total_prize: totalPrizeAmount,
        payment_status: 'pending'
      });
    }

    match.result_status = 'calculated';
    match.prize_status = 'ready';
    match.result_calculated_at = new Date();

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'WINNERS_CALCULATED',
      message: 'Winners calculated successfully',
      data: {
        match_id: req.params.id,
        winners: match.winners,
        total_winners: match.winners.length,
        total_prize_distributed: match.winners.reduce((sum, w) => sum + w.total_prize, 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
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

    if (match.prize_status !== 'ready') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'PRIZES_NOT_READY',
        message: 'Prizes are not ready for distribution',
        timestamp: new Date().toISOString()
      });
    }

    if (match.winners.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_WINNERS',
        message: 'No winners to distribute prizes to',
        timestamp: new Date().toISOString()
      });
    }

    const { payment_method = 'wallet', payment_details } = req.body;
    
    // Distribute prizes to each winner
    for (const winner of match.winners) {
      if (winner.payment_status === 'pending') {
        // Update winner payment status
        winner.payment_status = 'paid';
        winner.payment_method = payment_method;
        winner.paid_at = new Date();
        winner.payment_details = payment_details || {};
        winner.transaction_id = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

        // Update user wallet
        if (payment_method === 'wallet') {
          const wallet = await Wallet.findOne({ user_id: winner.user }).session(session);
          if (wallet) {
            wallet.balance += winner.total_prize;
            wallet.total_earned += winner.total_prize;
            await wallet.save({ session });

            // Create transaction record
            await Transaction.create([{
              user_id: winner.user,
              type: 'prize',
              amount: winner.total_prize,
              status: 'completed',
              description: `Prize for match: ${match.title} (Rank: ${winner.rank})`,
              match_id: match._id,
              metadata: {
                match_title: match.title,
                rank: winner.rank,
                kills: winner.kills,
                prize_amount: winner.prize_amount,
                kill_prize: winner.kill_prize
              }
            }], { session });
          }
        }
      }
    }

    match.prize_status = 'distributed';
    match.distribution_date = new Date();
    match.distributed_by = req.user.userId;

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'PRIZES_DISTRIBUTED',
      message: 'Prizes distributed successfully',
      data: {
        match_id: req.params.id,
        distributed_at: match.distribution_date,
        distributed_by: match.distributed_by,
        winners_count: match.winners.length,
        total_amount_distributed: match.winners.reduce((sum, w) => sum + w.total_prize, 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ DISTRIBUTE PRIZES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'DISTRIBUTION_ERROR',
      message: 'Failed to distribute prizes',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== MODERATOR FUNCTIONS ====================

// ✅ MODERATOR: Get matches for moderation
exports.getPendingMatchesForModerator = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const query = { 
      approval_status: 'pending',
      $or: [
        { status: 'pending_approval' },
        { status: 'draft' }
      ]
    };

    const matches = await Match.find(query)
      .populate('created_by', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      code: 'MODERATOR_PENDING_MATCHES_FETCHED',
      message: 'Pending matches for moderation fetched successfully',
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
    console.error('❌ MODERATOR GET PENDING MATCHES ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MODERATOR_FETCH_ERROR',
      message: 'Failed to fetch pending matches for moderation',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ MODERATOR: Approve match
exports.approveMatchForModerator = async (req, res) => {
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

    const { reason } = req.body;

    // Update match status
    match.approval_status = 'approved';
    match.status = 'upcoming';
    match.approved_by = req.user.userId;
    match.approved_at = new Date();
    match.approval_reason = reason || 'Approved by moderator';
    match.updated_at = new Date();

    // Add to status history
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: 'approved',
      old_status: match.approval_status,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: reason || 'Approved by moderator'
    });

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_APPROVED_BY_MODERATOR',
      message: 'Match approved successfully by moderator',
      data: match,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ MODERATOR APPROVE MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MODERATOR_APPROVAL_ERROR',
      message: 'Failed to approve match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ MODERATOR: Reject match
exports.rejectMatchForModerator = async (req, res) => {
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

    const { reason } = req.body;
    if (!reason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'REASON_REQUIRED',
        message: 'Rejection reason is required',
        timestamp: new Date().toISOString()
      });
    }

    // Update match status
    match.approval_status = 'rejected';
    match.status = 'cancelled';
    match.rejected_by = req.user.userId;
    match.rejected_at = new Date();
    match.rejection_reason = reason;
    match.updated_at = new Date();

    // Add to status history
    if (!match.status_history) {
      match.status_history = [];
    }
    
    match.status_history.push({
      status: 'rejected',
      old_status: match.approval_status,
      timestamp: new Date(),
      changed_by: req.user.userId,
      notes: reason
    });

    await match.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      code: 'MATCH_REJECTED_BY_MODERATOR',
      message: 'Match rejected successfully by moderator',
      data: {
        match_id: req.params.id,
        reason: reason
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ MODERATOR REJECT MATCH ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MODERATOR_REJECTION_ERROR',
      message: 'Failed to reject match',
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ MODERATOR: Verify results
exports.verifyMatchResultForModerator = async (req, res) => {
  try {
    const { matchId, resultId } = req.params;
    const { status = 'verified', notes } = req.body;
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    const result = match.results.id(resultId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = result.status;
    result.status = status;
    result.verified_at = new Date();
    result.verified_by = req.user.userId;
    result.admin_notes = notes || `Verified by ${req.user.role}`;

    // Add to verification history
    if (!result.verification_history) {
      result.verification_history = [];
    }
    
    result.verification_history.push({
      status: status,
      timestamp: new Date(),
      verified_by: req.user.userId,
      notes: notes || 'Verified by moderator'
    });

    await match.save();

    res.json({
      success: true,
      code: 'RESULT_VERIFIED_BY_MODERATOR',
      message: 'Match result verified successfully by moderator',
      data: {
        match_id: matchId,
        result_id: resultId,
        old_status: oldStatus,
        new_status: status,
        verified_at: result.verified_at,
        verified_by: result.verified_by
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MODERATOR VERIFY MATCH RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MODERATOR_VERIFICATION_ERROR',
      message: 'Failed to verify match result',
      timestamp: new Date().toISOString()
    });
  }
};

// ==================== EXPORT ====================

module.exports = exports;
