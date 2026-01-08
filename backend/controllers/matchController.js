// controllers/matchController.js - COMPLETE & ERROR-FREE VERSION
const Match = require('../models/Match');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');

// ✅ UNIFIED DATA MAPPING FUNCTION (from matches.js)
const mapMatchData = (reqBody, userId, userRole) => {
  console.log('🔄 Mapping match data:', reqBody);
  
  const isAdmin = userRole === 'admin';
  
  return {
    // Basic info
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',

    // Financial - Consistent backend fields
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,

    // Participants - Consistent backend fields
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 25,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,

    // Game settings
    type: reqBody.type || 'Solo',
    map: reqBody.map || 'Bermuda',
    match_type: 'match',

    // Room info
    room_id: reqBody.room_id || reqBody.roomId || '',
    room_password: reqBody.room_password || reqBody.password || '',

    // Timing
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),

    // Role-based approval
    status: isAdmin ? 'upcoming' : 'pending',
    approval_status: isAdmin ? 'approved' : 'pending',
    created_by: userId,
    
    // Auto-set approval fields only for admin
    ...(isAdmin && {
      approved_by: userId,
      approved_at: new Date()
    })
  };
};

// ✅ CREATE match (from matches.js)
exports.createMatch = async (req, res) => {
  try {
    console.log('📥 CREATE match request:', req.body);
    console.log('👤 User creating match:', req.user);
    console.log('👑 User role:', req.user.role);

    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }
    
    const matchData = mapMatchData(req.body, userId, req.user.role);

    console.log('✅ Processed match data:', matchData);

    if (!matchData.title || !matchData.game) {
      return res.status(400).json({
        success: false,
        message: 'Title and game are required fields'
      });
    }

    if (isNaN(matchData.schedule_time.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule time'
      });
    }

    const match = await Match.create(matchData);
    await match.populate('created_by', 'username');
    
    if (matchData.approval_status === 'approved') {
      await match.populate('approved_by', 'username');
    }

    console.log('✅ Match created successfully:', match._id);

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Match created successfully and is now live! (Auto-approved)' 
        : 'Match created successfully! Waiting for admin approval.',
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
};

// ✅ GET ALL MATCHES (from matchController.js but with matches.js logic)
exports.getMatches = async (req, res) => {
  try {
    console.log('🔍 matchController: Fetching matches...');
    
    const { 
      limit = 100, 
      page = 1, 
      status,
      game,
      search,
      approval_status 
    } = req.query;

    let filter = {};
    
    const isAdmin = req.query.admin === 'true' || 
                   (req.user && req.user.role === 'admin');
    
    if (isAdmin) {
      console.log('👑 Admin: No default filters');
    } else {
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live'] };
      console.log('👤 Non-admin filter applied:', filter);
    }

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (game && game !== 'all') {
      filter.game = game;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (approval_status && approval_status !== 'all') {
      filter.approval_status = approval_status;
    }

    console.log('📊 Final filter:', filter);

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalMatches = await Match.countDocuments(filter);

    console.log(`✅ Found ${matches.length} matches out of ${totalMatches} total`);

    res.json({
      success: true,
      count: matches.length,
      total: totalMatches,
      page: pageNumber,
      pages: Math.ceil(totalMatches / pageSize),
      data: matches
    });

  } catch (err) {
    console.error('❌ GET matches error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ✅ GET match by ID (combined from both)
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('participants.user', 'username email')
      .populate('approved_by', 'username');

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
};

// ✅ UPDATE match (from matches.js)
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }
    
    if (match.created_by.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this match'
      });
    }
    
    const updateData = mapMatchData(req.body, userId, req.user.role);
    
    if (req.user.role !== 'admin') {
      delete updateData.approval_status;
      delete updateData.status;
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('created_by', 'username')
    .populate('approved_by', 'username');

    res.json({
      success: true,
      message: 'Match updated successfully',
      data: updatedMatch
    });
  } catch (error) {
    console.error('❌ UPDATE match error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update match',
      error: error.message
    });
  }
};

// ✅ DELETE match (from matches.js)
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }
    
    if (match.created_by.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this match'
      });
    }

    await Match.findByIdAndDelete(req.params.id);

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
};

// ✅ UPDATE match status (from matches.js)
exports.updateMatchStatus = async (req, res) => {
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
};

// ✅ JOIN match (without payment) - FIXED (from matches.js)
exports.joinMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }

    if (match.approval_status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This match is not approved yet'
      });
    }

    if (match.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Match is not joinable'
      });
    }

    // ✅ FIXED: Check participants safely
    const participantsArray = match.participants || [];
    const alreadyJoined = participantsArray.some(
      participant => participant.user && participant.user.toString() === userId.toString()
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

    if (!match.participants) {
      match.participants = [];
    }

    match.participants.push({
      user: userId,
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
};

// ✅ JOIN match WITH PAYMENT - COMPLETELY FIXED (from matches.js)
exports.joinMatchWithPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('💳 JOIN match WITH PAYMENT request:', req.params.id);
    console.log('📥 Request body:', req.body);
    console.log('👤 User:', req.user);
    
    const match = await Match.findById(req.params.id).session(session);

    if (!match) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }

    if (match.approval_status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This match is not approved yet'
      });
    }

    if (match.status !== 'upcoming') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Match is not joinable'
      });
    }

    // ✅ FIXED: Check participants safely
    const participantsArray = match.participants || [];
    const alreadyJoined = participantsArray.some(
      participant => participant.user && participant.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Already joined this match'
      });
    }

    if (match.current_participants >= match.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'No spots left in this match'
      });
    }

    const entryFee = match.entry_fee || 0;
    
    console.log(`💰 Entry Fee: ${entryFee}, User ID: ${userId}`);
    
    if (entryFee > 0) {
      try {
        const wallet = await Wallet.findOne({ user_id: userId }).session(session);
        
        if (!wallet) {
          const newWallet = await Wallet.findOrCreate(userId);
          console.log('🆕 New wallet created for user:', userId);
          
          if (newWallet.balance < entryFee) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Insufficient balance. Required: ৳${entryFee}, Available: ৳${newWallet.balance}`,
              required: entryFee,
              available: newWallet.balance
            });
          }
          
          newWallet.balance -= entryFee;
          newWallet.total_spent += entryFee;
          newWallet.last_activity = new Date();
          await newWallet.save({ session });

          await Transaction.create([{
            user_id: userId,
            type: 'debit',
            amount: entryFee,
            description: `Match Entry Fee: ${match.title}`,
            status: 'completed',
            method: 'match_entry',
            reference_id: match._id.toString(),
            metadata: {
              match_id: match._id,
              match_title: match.title,
              match_type: 'match'
            }
          }], { session });

          console.log(`✅ Wallet debited: ${userId}, Amount: ${entryFee}, New Balance: ${newWallet.balance}`);
        } else {
          console.log(`💰 Wallet Balance: ${wallet.balance}, Required: ${entryFee}`);
          
          if (wallet.balance < entryFee) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Insufficient balance. Required: ৳${entryFee}, Available: ৳${wallet.balance}`,
              required: entryFee,
              available: wallet.balance
            });
          }

          wallet.balance -= entryFee;
          wallet.total_spent += entryFee;
          wallet.last_activity = new Date();
          await wallet.save({ session });

          await Transaction.create([{
            user_id: userId,
            type: 'debit',
            amount: entryFee,
            description: `Match Entry Fee: ${match.title}`,
            status: 'completed',
            method: 'match_entry',
            reference_id: match._id.toString(),
            metadata: {
              match_id: match._id,
              match_title: match.title,
              match_type: 'match'
            }
          }], { session });

          console.log(`✅ Wallet debited: ${userId}, Amount: ${entryFee}, New Balance: ${wallet.balance}`);
        }
      } catch (walletError) {
        console.error('❌ Wallet error:', walletError);
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
          success: false,
          message: 'Wallet transaction failed',
          error: walletError.message
        });
      }
    }

    const participantData = {
      user: userId,
      status: 'joined',
      joined_at: new Date(),
      payment_status: entryFee > 0 ? 'paid' : 'free',
      amount_paid: entryFee
    };

    if (req.body.game_uid || req.body.gameUID) {
      participantData.game_uid = req.body.game_uid || req.body.gameUID;
    }
    if (req.body.game_name || req.body.gameName) {
      participantData.game_name = req.body.game_name || req.body.gameName;
    }

    if (!match.participants) {
      match.participants = [];
    }

    match.participants.push(participantData);
    match.current_participants += 1;
    
    await match.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`✅ User ${userId} joined match ${match._id} with payment`);

    // ✅ ✅ ✅ ✅ ✅ ✅ FIXED SECTION ✅ ✅ ✅ ✅ ✅ ✅
    // Get room details from the match
    const roomId = match.room_id || 'WAITING';
    const roomPassword = match.room_password || 'WAITING';

    res.json({
      success: true,
      message: entryFee > 0 
        ? `Successfully joined match! ৳${entryFee} deducted from your wallet.` 
        : 'Successfully joined match!',
      data: {
        match_id: match._id,
        match_title: match.title,
        room_id: roomId,                    // ✅ ADDED: Real Room ID
        room_password: roomPassword,        // ✅ ADDED: Real Room Password
        entry_fee: entryFee,
        game_uid: req.body.game_uid || req.body.gameUID,
        game_name: req.body.game_name || req.body.gameName,
        payment: {
          amount: entryFee,
          status: 'deducted',
          transaction_id: 'completed'
        },
        spots_left: match.max_participants - match.current_participants
      }
    });

  } catch (error) {
    console.error('❌ JOIN WITH PAYMENT error:', error);
    
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (sessionError) {
      console.error('Session abort error:', sessionError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to join match with payment',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ✅ ADMIN: Get all matches (from matches.js)
exports.getAllMatchesForAdmin = async (req, res) => {
  try {
    console.log('👑 ADMIN: Fetching ALL matches...');
    
    const { 
      limit = 100, 
      page = 1, 
      status,
      approval_status,
      game,
      search 
    } = req.query;

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
      filter.title = { $regex: search, $options: 'i' };
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const matches = await Match.find(filter)
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalMatches = await Match.countDocuments(filter);

    console.log(`👑 ADMIN: Found ${matches.length} matches (all statuses)`);

    const pendingCount = await Match.countDocuments({ approval_status: 'pending' });
    const approvedCount = await Match.countDocuments({ approval_status: 'approved' });
    const rejectedCount = await Match.countDocuments({ approval_status: 'rejected' });

    res.json({
      success: true,
      count: matches.length,
      total: totalMatches,
      page: pageNumber,
      pages: Math.ceil(totalMatches / pageSize),
      data: matches,
      dashboard: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalMatches
      }
    });
  } catch (error) {
    console.error('❌ ADMIN all matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
};

// ✅ ADMIN: Get pending matches (from matches.js)
exports.getPendingMatchesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      approval_status: 'pending'
    })
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Match.countDocuments({
      approval_status: 'pending'
    });

    console.log(`👑 ADMIN: Found ${matches.length} pending matches`);

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
};

// ✅ ADMIN: Approve match (from matches.js)
exports.approveMatchForAdmin = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'approved',
        status: 'upcoming',
        approved_by: userId,
        approved_at: new Date(),
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    )
    .populate('created_by', 'username email')
    .populate('approved_by', 'username');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log('✅ ADMIN: Match approved:', match._id);

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
};

// ✅ ADMIN: Reject match (from matches.js)
exports.rejectMatchForAdmin = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'rejected',
        status: 'cancelled',
        rejection_reason: req.body.rejectionReason || 'No reason provided',
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    )
    .populate('created_by', 'username email')
    .populate('approved_by', 'username');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log('✅ ADMIN: Match rejected:', match._id);

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
};

// ✅ DEBUG: Get collection info (from matchController.js)
exports.debugCollections = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 All collections:', collections.map(c => c.name));
    
    // Count documents in each collection
    const collectionsToCheck = ['matches', 'tournaments', 'match', 'tournament', 'games'];
    const counts = {};
    
    for (const collectionName of collectionsToCheck) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        counts[collectionName] = count;
        console.log(`📊 ${collectionName} count: ${count}`);
      } catch (err) {
        counts[collectionName] = 'Collection does not exist';
      }
    }
    
    // Also count from Match model
    const matchModelCount = await Match.countDocuments();
    counts.matchModel = matchModelCount;
    
    // Get all matches with details
    const allMatches = await Match.find({});
    
    res.status(200).json({
      success: true,
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      counts: counts,
      allMatches: allMatches.map(m => ({
        id: m._id,
        title: m.title,
        status: m.status,
        approval_status: m.approval_status,
        game: m.game,
        match_type: m.match_type
      }))
    });
  } catch (error) {
    console.error('❌ Debug Error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

// ✅ ADDED: Get matches with different filters for testing (from matchController.js)
exports.getMatchesByFilter = async (req, res) => {
  try {
    const { filterType = 'all' } = req.params;
    
    let filter = {};
    
    switch(filterType) {
      case 'all':
        // No filter - get everything
        break;
      case 'approved':
        filter.approval_status = 'approved';
        break;
      case 'pending':
        filter.approval_status = 'pending';
        break;
      case 'upcoming':
        filter.status = 'upcoming';
        break;
      case 'completed':
        filter.status = 'completed';
        break;
      default:
        filter = {};
    }
    
    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      filterType,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('❌ GetMatchesByFilter Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filtered matches',
      error: error.message
    });
  }
};
