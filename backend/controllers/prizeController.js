// controllers/prizeController.js - COMPLETE FIXED VERSION
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const { Wallet } = require('../models/Wallet');
const mongoose = require('mongoose');

// ✅ Auto distribute prizes to wallet
exports.autoDistributeToWallet = async (eventId, winners) => {
  try {
    console.log(`💰 AUTO Distributing to wallets for event: ${eventId}`);
    
    const distributionResults = [];
    
    for (const winner of winners) {
      try {
        // Validate playerId
        if (!winner.playerId || !mongoose.Types.ObjectId.isValid(winner.playerId)) {
          console.warn(`⚠️ Invalid playerId for winner: ${winner.playerName}`);
          continue;
        }

        let wallet = await Wallet.findOne({ user_id: winner.playerId });
        
        if (!wallet) {
          wallet = new Wallet({ user_id: winner.playerId });
          await wallet.save();
          console.log(`✅ New wallet created for user: ${winner.playerId}`);
        }
        
        // ওয়ালেটে প্রাইজ যোগ করুন
        await wallet.credit(
          winner.prizeAmount,
          `Tournament Prize - Rank ${winner.rank} - ${winner.playerName}`,
          { 
            eventId: eventId,
            rank: winner.rank,
            type: 'prize_distribution',
            playerName: winner.playerName
          }
        );
        
        console.log(`✅ Prize ${winner.prizeAmount} added to wallet for user: ${winner.playerName}`);
        
        distributionResults.push({
          playerId: winner.playerId,
          playerName: winner.playerName,
          amount: winner.prizeAmount,
          status: 'success'
        });
      } catch (error) {
        console.error(`❌ Failed to distribute prize to ${winner.playerName}:`, error);
        distributionResults.push({
          playerId: winner.playerId,
          playerName: winner.playerName,
          amount: winner.prizeAmount,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return { 
      success: true, 
      distributed: distributionResults.filter(r => r.status === 'success').length,
      failed: distributionResults.filter(r => r.status === 'failed').length,
      results: distributionResults
    };
  } catch (error) {
    console.error('❌ Auto distribute to wallet error:', error);
    throw error;
  }
};

// ✅ Get REAL pending events from database
exports.getPendingEvents = async (req, res) => {
  try {
    console.log('🎯 Fetching REAL pending events from database...');
    
    // Get completed events with pending prize distribution
    const pendingMatches = await Match.find({ 
      $or: [
        { status: 'completed', prizeStatus: 'pending' },
        { status: 'completed', prizeStatus: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    
    const pendingTournaments = await Tournament.find({
      $or: [
        { status: 'completed', prizeStatus: 'pending' },
        { status: 'completed', prizeStatus: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    
    const pendingEvents = [...pendingMatches, ...pendingTournaments];
    
    console.log(`✅ Found ${pendingEvents.length} REAL pending events`);
    
    // Format response
    const formattedEvents = pendingEvents.map(event => ({
      id: event._id,
      title: event.title,
      game: event.game,
      type: event.type,
      matchType: event.matchType || (event.match_type || 'match'),
      prizePool: event.total_prize || event.prizePool || 0,
      prizeStatus: event.prizeStatus || 'pending',
      status: event.status,
      winners: event.winners || [],
      currentParticipants: event.current_participants || event.currentParticipants || 0,
      maxParticipants: event.max_participants || event.maxParticipants || 0,
      createdAt: event.createdAt,
      completedAt: event.completedAt || event.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: formattedEvents.length,
      data: formattedEvents
    });
  } catch (error) {
    console.error('❌ Get pending events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending events',
      error: error.message
    });
  }
};

// ✅ Distribute prizes with REAL database update AND WALLET - FIXED
exports.distributePrizes = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { winners } = req.body;
    
    console.log(`🎯 Distributing REAL prizes for event: ${eventId}`);
    console.log('🏆 Winners data:', winners);

    // Find event in both collections
    let event = await Match.findById(eventId);
    let eventType = 'match';
    
    if (!event) {
      event = await Tournament.findById(eventId);
      eventType = 'tournament';
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Validate prize pool
    const prizePool = event.total_prize || event.prizePool || 0;
    const totalDistribution = winners.reduce((sum, winner) => sum + (winner.prizeAmount || winner.amount || 0), 0);
    
    if (totalDistribution > prizePool) {
      return res.status(400).json({
        success: false,
        message: `Total distribution (${totalDistribution}) exceeds prize pool (${prizePool})`
      });
    }

    // Update event with winners
    event.winners = winners.map(winner => ({
      rank: winner.rank,
      playerId: winner.playerId,
      playerName: winner.playerName,
      teamName: winner.teamName,
      kills: winner.kills,
      damage: winner.damage,
      prizeAmount: winner.prizeAmount || winner.amount,
      paymentStatus: 'pending', // Manual payment - admin will mark as paid
      paymentMethod: winner.paymentMethod,
      phoneNumber: winner.phoneNumber
    }));
    
    event.prizeStatus = 'distributed';
    event.distributionDate = new Date();
    
    // ✅ FIXED: distributedBy field issue
    if (req.user && req.user.userId) {
      event.distributedBy = req.user.userId;
    } else {
      // Use a system user ID or leave it undefined for admin operations
      event.distributedBy = undefined; // Will not be set if no user
    }

    await event.save();

    // ✅ ওয়ালেটে প্রাইজ ডিস্ট্রিবিউট করুন
    console.log('💰 Starting wallet distribution...');
    const walletResult = await this.autoDistributeToWallet(eventId, winners);

    console.log(`✅ REAL prizes distributed for ${eventType}: ${event.title}`);
    
    res.status(200).json({
      success: true,
      message: 'Prizes distributed successfully to wallets!',
      data: {
        id: event._id,
        title: event.title,
        prizeStatus: event.prizeStatus,
        distributionDate: event.distributionDate,
        winners: event.winners,
        totalDistributed: totalDistribution,
        walletDistribution: walletResult
      }
    });
  } catch (error) {
    console.error('❌ Distribute prizes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to distribute prizes',
      error: error.message
    });
  }
};

// ✅ Get REAL distribution history
exports.getDistributionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    console.log('📜 Fetching REAL distribution history...');

    // Build filters
    const matchFilter = { prizeStatus: { $ne: 'pending' } };
    const tournamentFilter = { prizeStatus: { $ne: 'pending' } };
    
    if (status && status !== 'all') {
      matchFilter.prizeStatus = status;
      tournamentFilter.prizeStatus = status;
    }

    // Get distributed events
    const distributedMatches = await Match.find(matchFilter)
      .sort({ distributionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const distributedTournaments = await Tournament.find(tournamentFilter)
      .sort({ distributionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const history = [...distributedMatches, ...distributedTournaments]
      .sort((a, b) => new Date(b.distributionDate || b.updatedAt) - new Date(a.distributionDate || a.updatedAt));

    // Count totals
    const totalMatches = await Match.countDocuments(matchFilter);
    const totalTournaments = await Tournament.countDocuments(tournamentFilter);
    const total = totalMatches + totalTournaments;

    // Format response
    const formattedHistory = history.map(event => ({
      id: event._id,
      title: event.title,
      game: event.game,
      type: event.type,
      matchType: event.matchType || (event.match_type || 'match'),
      prizePool: event.total_prize || event.prizePool || 0,
      prizeStatus: event.prizeStatus,
      winners: event.winners || [],
      distributionDate: event.distributionDate,
      totalDistributed: event.winners ? event.winners.reduce((sum, winner) => sum + (winner.prizeAmount || 0), 0) : 0,
      winnersCount: event.winners ? event.winners.length : 0
    }));

    console.log(`✅ Found ${formattedHistory.length} REAL distributions`);
    
    res.status(200).json({
      success: true,
      count: formattedHistory.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: formattedHistory
    });
  } catch (error) {
    console.error('❌ Get distribution history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution history',
      error: error.message
    });
  }
};

// ✅ Mark winner as paid in REAL database (MANUAL BKASH PAYMENT)
exports.markAsPaid = async (req, res) => {
  try {
    const { eventId, winnerId } = req.params;
    const { transactionId, paymentMethod, phoneNumber, paidAmount } = req.body;
    
    console.log(`💰 Marking REAL winner ${winnerId} as paid - Manual Bkash`);

    let event = await Match.findById(eventId);
    let eventType = 'match';
    
    if (!event) {
      event = await Tournament.findById(eventId);
      eventType = 'tournament';
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find winner in winners array
    const winner = event.winners.id(winnerId);
    if (!winner) {
      return res.status(404).json({
        success: false,
        message: 'Winner not found in event'
      });
    }

    // Update winner payment status - MANUAL PAYMENT
    winner.paymentStatus = 'paid';
    winner.paymentMethod = paymentMethod || 'bkash';
    winner.transactionId = transactionId;
    winner.paidAt = new Date();
    winner.paidAmount = paidAmount || winner.prizeAmount;
    if (phoneNumber) winner.phoneNumber = phoneNumber;

    await event.save();

    console.log(`✅ MANUAL PAYMENT: ${winner.playerName} paid via ${paymentMethod} - Txn: ${transactionId}`);

    res.status(200).json({
      success: true,
      message: 'Manual payment recorded successfully!',
      data: {
        eventId: event._id,
        eventTitle: event.title,
        winner: {
          id: winner._id,
          playerName: winner.playerName,
          rank: winner.rank,
          prizeAmount: winner.prizeAmount,
          paidAmount: winner.paidAmount,
          paymentStatus: winner.paymentStatus,
          paymentMethod: winner.paymentMethod,
          transactionId: winner.transactionId,
          phoneNumber: winner.phoneNumber,
          paidAt: winner.paidAt
        }
      }
    });
  } catch (error) {
    console.error('❌ Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record manual payment',
      error: error.message
    });
  }
};

// ✅ Calculate prize breakdown
exports.calculatePrizeBreakdown = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`🧮 Calculating prize breakdown for event: ${eventId}`);

    let event = await Match.findById(eventId);
    if (!event) {
      event = await Tournament.findById(eventId);
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const prizePool = event.total_prize || event.prizePool || 0;
    const eventType = event.type?.toLowerCase() || 'solo';
    
    // Prize distribution rules
    const distributionRules = {
      solo: { 1: 0.50, 2: 0.30, 3: 0.20 },
      duo: { 1: 0.60, 2: 0.40 },
      squad: { 1: 0.40, 2: 0.30, 3: 0.20, 4: 0.10 },
      mp: { 1: 0.50, 2: 0.30, 3: 0.20 },
      default: { 1: 0.50, 2: 0.30, 3: 0.20 }
    };

    const rule = distributionRules[eventType] || distributionRules.default;
    const breakdown = Object.entries(rule).map(([rank, percentage]) => ({
      rank: parseInt(rank),
      percentage: Math.round(percentage * 100),
      amount: Math.round(prizePool * percentage)
    }));

    const totalDistributed = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const remaining = prizePool - totalDistributed;

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        eventTitle: event.title,
        eventType: eventType,
        prizePool,
        breakdown,
        totalDistributed,
        remaining,
        efficiency: Math.round((totalDistributed / prizePool) * 100)
      }
    });
  } catch (error) {
    console.error('❌ Calculate prize breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate prize breakdown',
      error: error.message
    });
  }
};

// ✅ Refund prizes
exports.refundPrizes = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { refundReason } = req.body;
    
    console.log(`🔄 Processing REAL refund for event: ${eventId}`);

    let event = await Match.findById(eventId);
    let eventType = 'match';
    
    if (!event) {
      event = await Tournament.findById(eventId);
      eventType = 'tournament';
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Reset winners payment status
    if (event.winners && event.winners.length > 0) {
      event.winners.forEach(winner => {
        winner.paymentStatus = 'pending';
        winner.transactionId = undefined;
        winner.paidAt = undefined;
        winner.paymentMethod = undefined;
      });
    }
    
    event.prizeStatus = 'refunded';
    event.refundDate = new Date();
    event.refundReason = refundReason;

    await event.save();

    console.log(`✅ REAL prizes refunded for ${eventType}: ${event.title}`);

    res.status(200).json({
      success: true,
      message: 'Prizes refunded successfully!',
      data: {
        id: event._id,
        title: event.title,
        prizeStatus: event.prizeStatus,
        refundDate: event.refundDate,
        refundReason: event.refundReason,
        totalRefunded: event.total_prize || event.prizePool || 0
      }
    });
  } catch (error) {
    console.error('❌ Refund prizes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund prizes',
      error: error.message
    });
  }
};
