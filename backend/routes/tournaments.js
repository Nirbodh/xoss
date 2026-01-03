// routes/tournaments.js - COMPLETELY FIXED WITH userId + PAYMENT JOIN
const express = require('express');
const Tournament = require('../models/Tournament');
const { Wallet, Transaction } = require('../models/Wallet'); // ✅ Wallet model import
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ FIXED DATA MAPPING FUNCTION - WITH userId SUPPORT
const mapTournamentData = (reqBody, userId, userRole) => {
  console.log('🔄 Mapping tournament data (BOTH FORMATS):', reqBody);
  
  const isAdmin = userRole === 'admin';
  
  return {
    // Basic info
    title: reqBody.title,
    game: reqBody.game,
    description: reqBody.description || '',
    rules: reqBody.rules || '',
    
    // Financial - ✅ ACCEPT BOTH FORMATS
    entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
    total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
    per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
    
    // Participants - ✅ ACCEPT BOTH FORMATS
    max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 50,
    current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
    
    // Game settings
    type: reqBody.type || 'Squad',
    map: reqBody.map || 'Bermuda',
    match_type: 'tournament',
    
    // Room info
    room_id: reqBody.room_id || reqBody.roomId || '',
    room_password: reqBody.room_password || reqBody.password || '',
    
    // Timing - ✅ FIXED: Handle missing dates properly
    start_time: new Date(reqBody.start_time || reqBody.startTime || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
    schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
    
    // ✅ FIXED: Role-based approval
    status: isAdmin ? 'upcoming' : 'pending',
    approval_status: isAdmin ? 'approved' : 'pending',
    created_by: userId,
    
    // ✅ Auto-set approval fields only for admin
    ...(isAdmin && {
      approved_by: userId,
      approved_at: new Date()
    })
  };
};

// ✅ FIXED: GET all tournaments - SHOW BASED ON USER ROLE
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching tournaments...');
    
    let filter = {};
    
    // ✅ FIXED: Check if user is admin via query param or auth
    const isAdmin = req.query.admin === 'true' || 
                   (req.user && req.user.role === 'admin');
    
    if (isAdmin) {
      console.log('👑 Admin: No default filters');
      // Admin sees everything - no default filters
    } else {
      // Non-admin users see only approved and upcoming/live tournaments
      filter.approval_status = 'approved';
      filter.status = { $in: ['upcoming', 'live'] };
      console.log('👤 Non-admin filter applied:', filter);
    }

    // Additional filters
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
    
    // Count by status for debugging
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
});

// ✅ FIXED: CREATE tournament - WITH userId SUPPORT
router.post('/create', auth, async (req, res) => {
  try {
    console.log('📥 Received tournament creation request:', req.body);
    console.log('👤 User creating tournament:', req.user);
    console.log('👑 User role:', req.user.role);
    
    // ✅ FIXED: Use req.user.userId if req.user._id is undefined
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }
    
    const tournamentData = mapTournamentData(req.body, userId, req.user.role);

    console.log('🔄 Mapped tournament data:', tournamentData);
    console.log('✅ Tournament will be created with status:', {
      status: tournamentData.status,
      approval_status: tournamentData.approval_status,
      created_by: tournamentData.created_by
    });

    // ✅ FIXED: Better validation with specific messages
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

    // ✅ FIXED: Validate schedule_time
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
    console.log('📊 Tournament details:', {
      status: tournament.status,
      approval_status: tournament.approval_status,
      created_by: tournament.created_by
    });
    
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
});

// ✅ FIXED: SIMPLIFIED CREATE endpoint - WITH userId SUPPORT
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 SIMPLE CREATE tournament request:', req.body);
    console.log('👤 User role:', req.user.role);
    
    const isAdmin = req.user.role === 'admin';
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Please login again.'
      });
    }
    
    // ✅ SIMPLE DATA MAPPING - ROLE-BASED APPROVAL
    const tournamentData = {
      title: req.body.title,
      game: req.body.game,
      description: req.body.description || '',
      rules: req.body.rules || '',
      entry_fee: Number(reqBody.entryFee) || 0,
      total_prize: Number(reqBody.prizePool) || 0,
      per_kill: Number(reqBody.perKill) || 0,
      max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 50,
      current_participants: 0,
      type: req.body.type || 'Squad',
      map: req.body.map || 'Bermuda',
      match_type: 'tournament',
      room_id: req.body.roomId || '',
      room_password: req.body.password || '',
      start_time: new Date(req.body.startTime || req.body.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
      end_time: new Date(req.body.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
      schedule_time: new Date(req.body.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
      
      // ✅ FIXED: Role-based approval
      status: isAdmin ? 'upcoming' : 'pending',
      approval_status: isAdmin ? 'approved' : 'pending',
      created_by: userId,
      
      // ✅ Auto-set approval fields only for admin
      ...(isAdmin && {
        approved_by: userId,
        approved_at: new Date()
      })
    };

    console.log('🔄 Simple tournament data:', tournamentData);
    console.log('✅ Tournament will be created with status:', {
      status: tournamentData.status,
      approval_status: tournamentData.approval_status,
      created_by: tournamentData.created_by
    });

    // Basic validation
    if (!tournamentData.title || !tournamentData.game) {
      return res.status(400).json({
        success: false,
        message: 'Title and game are required'
      });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('created_by', 'username');
    
    if (tournamentData.approval_status === 'approved') {
      await tournament.populate('approved_by', 'username');
    }

    res.json({
      success: true,
      tournament,
      message: isAdmin
        ? 'Tournament created successfully and is now live! (Auto-approved)'
        : 'Tournament created successfully! Waiting for admin approval.'
    });
  } catch (err) {
    console.error('❌ Simple create tournament error:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// ✅ FIXED: GET tournament by ID
router.get('/:id', async (req, res) => {
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
});

// ✅ FIXED: UPDATE tournament - WITH userId SUPPORT
router.put('/:id', auth, async (req, res) => {
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
    
    // Check if user is owner or admin
    if (tournament.created_by.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this tournament' 
      });
    }
    
    const updateData = mapTournamentData(req.body, userId, req.user.role);
    
    // Don't update approval status if user is not admin
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
});

// ✅ FIXED: DELETE tournament - WITH userId SUPPORT
router.delete('/:id', auth, async (req, res) => {
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
    
    // Check if user is owner or admin
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
});

// ✅ FIXED: JOIN tournament - WITH userId SUPPORT
router.post('/:id/join', auth, async (req, res) => {
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

    // Check if tournament is approved
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

    const alreadyJoined = tournament.participants.some(
      participant => participant.user.toString() === userId.toString()
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
});

// ✅ NEW: JOIN tournament WITH PAYMENT - AUTO DEDUCT FROM WALLET
router.post('/:id/join-with-payment', auth, async (req, res) => {
  const session = await Tournament.startSession(); // Start a MongoDB session for transaction
  session.startTransaction();
  
  try {
    console.log('💳 JOIN tournament WITH PAYMENT request:', req.params.id);
    
    const tournament = await Tournament.findById(req.params.id).session(session);

    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please login again.' 
      });
    }

    // Check if tournament is approved
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

    const alreadyJoined = tournament.participants.some(
      participant => participant.user.toString() === userId.toString()
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

    // ✅ Check wallet balance and deduct entry fee
    const entryFee = tournament.entry_fee || 0;
    
    if (entryFee > 0) {
      // Get user's wallet
      const wallet = await Wallet.findOrCreate(userId);
      
      // Check if user has sufficient balance
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

      // ✅ Deduct entry fee from wallet
      const debitResult = await wallet.debit(
        entryFee,
        `Tournament Entry Fee: ${tournament.title}`,
        {
          method: 'tournament_entry',
          reference_id: tournament._id.toString(),
          tournament_id: tournament._id,
          tournament_title: tournament.title
        }
      );

      console.log(`✅ Wallet debited: ${userId}, Amount: ${entryFee}, New Balance: ${debitResult.wallet.balance}`);
    }

    // ✅ Add user to tournament participants
    tournament.participants.push({
      user: userId,
      status: 'joined',
      joined_at: new Date(),
      payment_status: 'paid',
      amount_paid: entryFee
    });

    tournament.current_participants += 1;
    await tournament.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate data for response
    await tournament.populate('participants.user', 'username');
    await tournament.populate('created_by', 'username');

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
          transaction_id: entryFee > 0 ? 'generated_in_wallet' : null
        },
        spots_left: tournament.max_participants - tournament.current_participants
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ JOIN WITH PAYMENT error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to join tournament with payment',
      error: error.message 
    });
  }
});

// ✅ ADMIN: Get all tournaments (including pending) - FIXED
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    console.log('👑 ADMIN: Fetching ALL tournaments (including pending)...');
    
    const tournaments = await Tournament.find({})
      .populate('created_by', 'username email')
      .populate('approved_by', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`👑 ADMIN: Found ${tournaments.length} tournaments (all statuses)`);
    
    // Count by status for dashboard
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
});

// ✅ ADMIN: Get pending tournaments
router.get('/admin/pending', adminAuth, async (req, res) => {
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
});

// ✅ FIXED: ADMIN: Approve tournament - WITH userId SUPPORT
router.post('/admin/approve/:id', adminAuth, async (req, res) => {
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
});

// ✅ FIXED: ADMIN: Reject tournament - WITH userId SUPPORT
router.post('/admin/reject/:id', adminAuth, async (req, res) => {
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
});

module.exports = router;
