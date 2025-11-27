// controllers/resultController.js - AUTO RESULT SYSTEM
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const ResultCalculator = require('../utils/resultCalculator');
const mongoose = require('mongoose'); // ✅ ADD THIS MISSING IMPORT

// ✅ Player result submit - FIXED
exports.submitResult = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { playerId, playerName, teamName, kills, damage, rank, screenshot } = req.body;
    
    console.log(`🎯 Player ${playerName} submitting result for event: ${eventId}`);

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

    // ✅ FIX: Check if results exists, if not initialize it
    if (!event.results) {
      event.results = [];
    }

    // Check if result already submitted
    const existingResult = event.results.find(r => 
      r.playerId && r.playerId.toString() === playerId
    );
    
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already submitted for this event'
      });
    }

    // Add new result
    event.results.push({
      playerId: playerId || new mongoose.Types.ObjectId(),
      playerName,
      teamName,
      kills: kills || 0,
      damage: damage || 0,
      rank: rank || 99,
      screenshot: screenshot || '',
      status: 'pending',
      submittedAt: new Date()
    });

    await event.save();

    console.log(`✅ Result submitted for player: ${playerName}`);

    res.status(200).json({
      success: true,
      message: 'Result submitted successfully! Waiting for verification.',
      data: {
        eventId: event._id,
        eventTitle: event.title,
        playerName,
        kills,
        damage,
        rank
      }
    });
  } catch (error) {
    console.error('❌ Submit result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit result',
      error: error.message
    });
  }
};

// ✅ Auto calculate winners from results - FIXED
exports.calculateWinners = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`🧮 AUTO Calculating winners for event: ${eventId}`);

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

    // ✅ FIX: Check if results exists
    if (!event.results) {
      event.results = [];
    }

    // Get verified results only
    const verifiedResults = event.results.filter(r => r.status === 'verified');
    
    if (verifiedResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No verified results found for calculation'
      });
    }

    const prizePool = event.total_prize || event.prizePool || 0;
    const calculatedWinners = ResultCalculator.calculateWinners(
      verifiedResults, 
      prizePool, 
      event.type?.toLowerCase() || 'solo'
    );

    // Update event with calculated winners
    event.calculatedWinners = calculatedWinners;
    event.resultStatus = 'calculated';
    
    await event.save();

    console.log(`✅ AUTO Calculated ${calculatedWinners.length} winners for event: ${event.title}`);

    // Auto trigger prize distribution
    const distributionResult = await this.autoDistributePrizes(eventId, calculatedWinners);

    res.status(200).json({
      success: true,
      message: `Winners calculated and prizes distributed automatically!`,
      data: {
        eventId: event._id,
        eventTitle: event.title,
        totalResults: verifiedResults.length,
        calculatedWinners,
        totalPrize: prizePool,
        distributedPrize: calculatedWinners.reduce((sum, w) => sum + w.prizeAmount, 0),
        distribution: distributionResult
      }
    });
  } catch (error) {
    console.error('❌ Calculate winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate winners',
      error: error.message
    });
  }
};

// ✅ Get event results - FIXED
exports.getEventResults = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`📊 Getting results for event: ${eventId}`);

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

    // ✅ FIX: Check if results exists and set defaults
    if (!event.results) {
      event.results = [];
    }
    if (!event.calculatedWinners) {
      event.calculatedWinners = [];
    }
    if (!event.resultStatus) {
      event.resultStatus = 'pending';
    }
    if (!event.prizeStatus) {
      event.prizeStatus = 'pending';
    }

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        eventTitle: event.title,
        totalResults: event.results.length,
        verifiedResults: event.results.filter(r => r.status === 'verified').length,
        pendingResults: event.results.filter(r => r.status === 'pending').length,
        results: event.results,
        calculatedWinners: event.calculatedWinners,
        resultStatus: event.resultStatus,
        prizeStatus: event.prizeStatus
      }
    });
  } catch (error) {
    console.error('❌ Get event results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event results',
      error: error.message
    });
  }
};

// ✅ Verify result (Admin) - FIXED
exports.verifyResult = async (req, res) => {
  try {
    const { eventId, resultId } = req.params;
    const { status, notes } = req.body;
    
    console.log(`🔍 Verifying result: ${resultId} for event: ${eventId}`);

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

    // ✅ FIX: Check if results exists
    if (!event.results) {
      event.results = [];
    }

    const result = event.results.id(resultId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    result.status = status;
    result.verifiedBy = req.user?.id || 'admin';
    result.verifiedAt = new Date();
    if (notes) result.adminNotes = notes;

    await event.save();

    console.log(`✅ Result ${resultId} ${status} by admin`);

    res.status(200).json({
      success: true,
      message: `Result ${status} successfully!`,
      data: result
    });
  } catch (error) {
    console.error('❌ Verify result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify result',
      error: error.message
    });
  }
};

// ✅ Bulk verify results - FIXED
exports.bulkVerifyResults = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { resultIds, status } = req.body;
    
    console.log(`🔍 Bulk ${status} for ${resultIds.length} results in event: ${eventId}`);

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

    // ✅ FIX: Check if results exists
    if (!event.results) {
      event.results = [];
    }

    let verifiedCount = 0;
    resultIds.forEach(resultId => {
      const result = event.results.id(resultId);
      if (result) {
        result.status = status;
        result.verifiedBy = 'admin';
        result.verifiedAt = new Date();
        verifiedCount++;
      }
    });

    await event.save();

    console.log(`✅ Bulk verified ${verifiedCount} results`);

    res.status(200).json({
      success: true,
      message: `Bulk ${status} completed for ${verifiedCount} results!`,
      data: { verifiedCount }
    });
  } catch (error) {
    console.error('❌ Bulk verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk verify results',
      error: error.message
    });
  }
};

// ✅ Auto distribute prizes after calculation - FIXED  
exports.autoDistributePrizes = async (eventId, calculatedWinners) => {
  try {
    console.log(`💰 AUTO Distributing prizes for event: ${eventId}`);
    
    let event = await Match.findById(eventId);
    let eventType = 'match';
    
    if (!event) {
      event = await Tournament.findById(eventId);
      eventType = 'tournament';
    }
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Convert calculated winners to prize distribution format
    const winners = calculatedWinners.map(winner => ({
      rank: winner.rank,
      playerId: winner.playerId,
      playerName: winner.playerName,
      teamName: winner.teamName,
      kills: winner.kills,
      damage: winner.damage,
      prizeAmount: winner.prizeAmount,
      paymentStatus: 'pending'
    }));

    // Update event with winners
    event.winners = winners;
    event.prizeStatus = 'distributed';
    event.distributionDate = new Date();
    event.distributedBy = 'auto-system';

    await event.save();

    console.log(`✅ AUTO Prizes distributed for ${eventType}: ${event.title}`);
    
    return {
      success: true,
      distributedAmount: winners.reduce((sum, w) => sum + w.prizeAmount, 0),
      winnersCount: winners.length
    };
  } catch (error) {
    console.error('❌ Auto distribute prizes error:', error);
    throw error;
  }
};
