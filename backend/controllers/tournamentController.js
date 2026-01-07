// controllers/tournamentController.js - COMPLETE & ERROR-FREE VERSION
const Tournament = require('../models/Tournament');
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../models/Wallet');

// ✅ UNIFIED DATA MAPPING FUNCTION (from tournaments.js)
const mapTournamentData = (reqBody, userId, userRole) => {
  console.log('🔄 Mapping tournament data:', reqBody);
  
  const isAdmin = userRole === 'admin';
  
  return {
    // Basic info
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',
    
    // Financial
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
    
    // Participants
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 50,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
    
    // Game settings
    type: reqBody.type || 'Squad',
    map: reqBody.map || 'Bermuda',
    match_type: 'tournament',
    
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

// ✅ CREATE tournament (from tournaments.js)
exports.createTournament = async (req, res) => {
  try {
    console.log('📥 Received tournament creation request:', req.body);
    console.log('👤 User creating tournament:', req.user);
    console.log('👑 User role:', req.user.role);
    
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }
    
    const tournamentData = mapTournamentData(req.body, userId, req.user.role);

    console.log('🔄 Mapped tournament data:', tournamentData);

    const requiredFields = ['title', 'game', 'max_participants'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!tournamentData[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    if (!tournamentData.schedule_time || isNaN(tournamentData.schedule_time.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid schedule time provided'
      });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('created_by', 'username');
    
    if (tournamentData.approval_status === 'approved') {
      await tournament.populate('approved_by', 'username');
    }
    
    console.log('✅ Tournament created successfully:', tournament._id);
    
    res.json({ 
      success: true, 
      tournament,
      message: req.user.role === 'admin'
        ? 'Tournament created successfully and is now live! (Auto-approved)'
        : 'Tournament created successfully! Waiting for admin approval.'
    });
  } catch (err) {
    console.error('❌ Tournament creation error:', err);
    res.status(400).json({ 
      success: false, 
      message: `Create failed: ${err.message}`,
      errorDetails: err.errors ? Object.keys(err.errors) : 'Unknown error'
    });
  }
};

// ✅ GET ALL TOURNAMENTS (from tournaments.js)
exports.getTournaments = async (req, res) => {
  try {
    console.log('🔍 Fetching tournaments...');
    
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

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    if (req.query.game && req.query.game !== 'all') {
      filter.game = req.query.game;
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    console.log('📊 Final filter:', filter);

    const tournaments = await Tournament.find(filter)
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tournaments.length} tournaments`);
    
    const approvedCount = tournaments.filter(t => t.approval_status === 'approved').length;
    const pendingCount = tournaments.filter(t => t.approval_status === 'pending').length;
    const rejectedCount = tournaments.filter(t => t.approval_status === 'rejected').length;
    
    console.log(`📊 Status breakdown: Approved: ${approvedCount}, Pending: ${pendingCount}, Rejected: ${rejectedCount}`);
    
    res.json({ 
      success: true, 
      data: tournaments,
      count: tournaments.length,
      statusCounts: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount
      }
    });
  } catch (err) {
    console.error('❌ GET tournaments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ GET tournament by ID (from tournaments.js)
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('approved_by', 'username')
      .populate('participants.user', 'username email');

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: tournament 
    });
  } catch (err) {
    console.error('❌ GET tournament by ID error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ✅ UPDATE tournament (from tournaments.js)
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }
    
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }
    
    if (tournament.created_by.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this tournament' 
      });
    }
    
    const updateData = mapTournamentData(req.body, userId, req.user.role);
    
    if (req.user.role !== 'admin') {
      delete updateData.approval_status;
      delete updateData.status;
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'username')
      .populate('approved_by', 'username');
    
    res.json({ 
      success: true, 
      tournament: updatedTournament,
      message: 'Tournament updated successfully'
    });
  } catch (err) {
    console.error('❌ UPDATE tournament error:', err);
    res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ✅ DELETE tournament (from tournaments.js)
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }
    
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }
    
    if (tournament.created_by.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this tournament' 
      });
    }
    
    await Tournament.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Tournament deleted successfully' 
    });
  } catch (err) {
    console.error('❌ DELETE tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ✅ JOIN tournament (without payment) - FIXED (from tournaments.js)
exports.joinTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }

    if (tournament.approval_status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'This tournament is not approved yet' 
      });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ 
        success: false, 
        message: 'Tournament is not joinable' 
      });
    }

    // ✅ FIXED: Check participants safely
    const participantsArray = tournament.participants || [];
    const alreadyJoined = participantsArray.some(
      participant => participant.user && participant.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already joined this tournament' 
      });
    }

    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({ 
        success: false, 
        message: 'No spots left in this tournament' 
      });
    }

    if (!tournament.participants) {
      tournament.participants = [];
    }

    tournament.participants.push({
      user: userId,
      status: 'joined'
    });

    tournament.current_participants += 1;
    await tournament.save();

    await tournament.populate('participants.user', 'username');

    res.json({ 
      success: true, 
      message: 'Successfully joined tournament',
      data: tournament 
    });
  } catch (error) {
    console.error('❌ JOIN tournament error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to join tournament',
      error: error.message 
    });
  }
};

// ✅ JOIN tournament WITH PAYMENT - COMPLETELY FIXED (from tournaments.js)
exports.joinTournamentWithPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('💳 JOIN tournament WITH PAYMENT request:', req.params.id);
    console.log('📥 Request body:', req.body);
    console.log('👤 User:', req.user);
    
    const tournament = await Tournament.findById(req.params.id).session(session);

    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
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

    if (tournament.approval_status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'This tournament is not approved yet' 
      });
    }

    if (tournament.status !== 'upcoming') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'Tournament is not joinable' 
      });
    }

    // ✅ FIXED: Check participants safely
    const participantsArray = tournament.participants || [];
    const alreadyJoined = participantsArray.some(
      participant => participant.user && participant.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'Already joined this tournament' 
      });
    }

    if (tournament.current_participants >= tournament.max_participants) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'No spots left in this tournament' 
      });
    }

    const entryFee = tournament.entry_fee || 0;
    
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
            description: `Tournament Entry Fee: ${tournament.title}`,
            status: 'completed',
            method: 'tournament_entry',
            reference_id: tournament._id.toString(),
            metadata: {
              tournament_id: tournament._id,
              tournament_title: tournament.title,
              match_type: 'tournament'
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
            description: `Tournament Entry Fee: ${tournament.title}`,
            status: 'completed',
            method: 'tournament_entry',
            reference_id: tournament._id.toString(),
            metadata: {
              tournament_id: tournament._id,
              tournament_title: tournament.title,
              match_type: 'tournament'
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

    if (!tournament.participants) {
      tournament.participants = [];
    }

    tournament.participants.push(participantData);
    tournament.current_participants += 1;
    
    await tournament.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`✅ User ${userId} joined tournament ${tournament._id} with payment`);

    res.json({ 
      success: true, 
      message: entryFee > 0 
        ? `Successfully joined tournament! ৳${entryFee} deducted from your wallet.` 
        : 'Successfully joined tournament!',
      data: {
        tournament,
        payment: {
          amount: entryFee,
          status: 'deducted',
          transaction_id: 'completed'
        },
        spots_left: tournament.max_participants - tournament.current_participants
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
      message: 'Failed to join tournament with payment',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ✅ ADMIN: Get all tournaments (from tournaments.js)
exports.getAllTournamentsForAdmin = async (req, res) => {
  try {
    console.log('👑 ADMIN: Fetching ALL tournaments...');
    
    const tournaments = await Tournament.find({})
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`👑 ADMIN: Found ${tournaments.length} tournaments`);
    
    const approvedCount = tournaments.filter(t => t.approval_status === 'approved').length;
    const pendingCount = tournaments.filter(t => t.approval_status === 'pending').length;
    const rejectedCount = tournaments.filter(t => t.approval_status === 'rejected').length;
    
    res.json({ 
      success: true, 
      data: tournaments, 
      count: tournaments.length,
      dashboard: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        total: tournaments.length
      }
    });
  } catch (err) {
    console.error('❌ ADMIN all tournaments error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ✅ ADMIN: Get pending tournaments (from tournaments.js)
exports.getPendingTournamentsForAdmin = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ 
      approval_status: 'pending'
    })
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`📊 ADMIN: Found ${tournaments.length} pending tournaments`);
    
    res.json({ 
      success: true, 
      data: tournaments, 
      count: tournaments.length,
      message: tournaments.length === 0 ? 'No pending tournaments' : 'Found pending tournaments'
    });
  } catch (err) {
    console.error('❌ ADMIN pending tournaments error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ✅ ADMIN: Approve tournament (from tournaments.js)
exports.approveTournamentForAdmin = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }
    
    const tournament = await Tournament.findByIdAndUpdate(
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

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    console.log('✅ ADMIN: Tournament approved:', tournament._id);

    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament approved successfully'
    });
  } catch (err) {
    console.error('❌ ADMIN approve tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ✅ ADMIN: Reject tournament (from tournaments.js)
exports.rejectTournamentForAdmin = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }
    
    const tournament = await Tournament.findByIdAndUpdate(
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

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    console.log('✅ ADMIN: Tournament rejected:', tournament._id);

    res.json({ 
      success: true, 
      tournament,
      message: 'Tournament rejected successfully'
    });
  } catch (err) {
    console.error('❌ ADMIN reject tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
