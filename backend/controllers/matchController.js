// controllers/matchController.js - PRODUCTION PRO VERSION (EXTENDED)
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

// Rate limiting constants
const MATCH_RATE_LIMITS = {
  CREATE: 10, // 10 matches per day
  JOIN: 20,   // 20 joins per day
  RESULT_SUBMIT: 5 // 5 result submissions per match
};

// ==================== EXISTING FUNCTIONS ====================
// ... আপনার existing ফাংশনগুলি এখানে ...

// ==================== NEW MATCH FUNCTIONS ====================

// 🔥 Submit match result
exports.submitMatchResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const userId = req.user.userId;
    const resultData = req.body;
    
    console.log('🎯 SUBMIT MATCH RESULT:', {
      matchId,
      userId: req.user.username,
      resultData
    });

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

    // Check if match is completed
    if (match.status !== 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MATCH_NOT_COMPLETED',
        message: 'Match is not completed yet',
        current_status: match.status,
        timestamp: new Date().toISOString()
      });
    }

    // Check if result submission is open
    if (!match.result_submission_open && !req.user.role === 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'SUBMISSION_CLOSED',
        message: 'Result submission is closed',
        submission_deadline: match.result_submission_deadline,
        timestamp: new Date().toISOString()
      });
    }

    // Check if user participated in the match
    const participant = match.participants.find(p => 
      p.user && p.user.toString() === userId.toString()
    );
    
    if (!participant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: 'You did not participate in this match',
        timestamp: new Date().toISOString()
      });
    }

    // Validate result data
    const validation = validateResultData(resultData, match);
    if (!validation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(validation.response);
    }

    // Submit result using match model method
    const submissionResult = match.submitResult(userId, resultData);
    if (!submissionResult.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'SUBMISSION_FAILED',
        message: submissionResult.message,
        timestamp: new Date().toISOString()
      });
    }

    await match.save({ session });

    // Create notification for match creator
    await Notification.create([{
      user_id: match.created_by,
      type: 'result_submitted',
      title: 'Match Result Submitted',
      message: `${req.user.username} submitted result for match "${match.title}"`,
      data: {
        match_id: match._id,
        match_title: match.title,
        participant_id: userId,
        participant_name: req.user.username,
        rank: resultData.rank,
        kills: resultData.kills,
        submitted_at: new Date()
      },
      priority: 'medium'
    }], { session });

    // Clear match cache
    await clearMatchRelatedCaches(matchId, userId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ RESULT SUBMITTED | Match: ${match.title} | User: ${req.user.username} | Rank: ${resultData.rank}`);

    res.json({
      success: true,
      code: 'RESULT_SUBMITTED',
      message: 'Match result submitted successfully',
      data: {
        match_id: match._id,
        match_title: match.title,
        result: submissionResult.result,
        participant: {
          user_id: userId,
          username: req.user.username,
          position: match.current_participants
        },
        verification: {
          status: 'pending',
          estimated_time: '24-48 hours',
          notes: 'Your result will be verified by admin soon'
        },
        next_steps: [
          'Wait for admin verification',
          'Check match page for updates',
          'Contact admin if any issue'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ SUBMIT RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'SUBMISSION_ERROR',
      message: 'Failed to submit match result',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 Get match results
exports.getMatchResults = async (req, res) => {
  try {
    const matchId = req.params.id;
    const cacheKey = `match:${matchId}:results`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('📦 Serving match results from cache');
      return res.json(JSON.parse(cachedData));
    }

    const match = await Match.findById(matchId)
      .populate('results.player_id', 'username avatar rating')
      .populate('results.verified_by', 'username')
      .select('results result_status total_prize prize_distribution per_kill scoring_settings')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate leaderboard
    const leaderboard = calculateLeaderboard(match.results, match.scoring_settings);
    
    // Calculate prizes
    const prizes = calculatePrizesDistribution(leaderboard, match);

    const response = {
      success: true,
      code: 'RESULTS_FETCHED',
      message: 'Match results fetched successfully',
      data: {
        match_info: {
          id: matchId,
          total_prize: match.total_prize,
          prize_distribution: match.prize_distribution,
          per_kill: match.per_kill,
          result_status: match.result_status
        },
        results: match.results.map(r => ({
          player: {
            id: r.player_id._id,
            username: r.player_id.username,
            avatar: r.player_id.avatar,
            rating: r.player_id.rating
          },
          performance: {
            rank: r.rank,
            kills: r.kills,
            damage: r.damage,
            survival_time: r.survival_time,
            headshots: r.headshots,
            assists: r.assists,
            revives: r.revives,
            total_score: r.total_score
          },
          verification: {
            status: r.status,
            submitted_at: r.submitted_at,
            verified_at: r.verified_at,
            verified_by: r.verified_by,
            admin_notes: r.admin_notes
          },
          screenshot: r.screenshot,
          team_name: r.team_name
        })),
        leaderboard: leaderboard.map((entry, index) => ({
          position: index + 1,
          ...entry,
          estimated_prize: prizes[index]?.prize_amount || 0
        })),
        statistics: {
          total_results: match.results.length,
          verified_results: match.results.filter(r => r.status === 'verified').length,
          pending_results: match.results.filter(r => r.status === 'pending').length,
          average_kills: match.results.reduce((sum, r) => sum + (r.kills || 0), 0) / Math.max(1, match.results.length),
          average_damage: match.results.reduce((sum, r) => sum + (r.damage || 0), 0) / Math.max(1, match.results.length),
          top_killer: getTopPerformer(match.results, 'kills'),
          top_damage: getTopPerformer(match.results, 'damage')
        }
      },
      timestamp: new Date().toISOString(),
      cache_info: {
        cached: false,
        ttl: 30 // 30 seconds cache for results
      }
    };

    // Cache response
    await redis.setex(cacheKey, 30, JSON.stringify(response));
    
    res.json(response);

  } catch (error) {
    console.error('❌ GET MATCH RESULTS ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'RESULTS_FETCH_ERROR',
      message: 'Failed to fetch match results',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 Update submitted result
exports.updateMatchResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const userId = req.user.userId;
    const updateData = req.body;
    
    console.log('🔄 UPDATE MATCH RESULT:', {
      matchId,
      userId: req.user.username,
      updateData
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

    // Check if user can update result
    const resultIndex = match.results.findIndex(r => 
      r.player_id && r.player_id.toString() === userId.toString()
    );
    
    if (resultIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'You have not submitted any result for this match',
        timestamp: new Date().toISOString()
      });
    }

    const result = match.results[resultIndex];
    
    // Check if result can be updated
    if (result.status === 'verified' && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'RESULT_VERIFIED',
        message: 'Result is already verified and cannot be updated',
        timestamp: new Date().toISOString()
      });
    }

    if (!match.allow_result_edit && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'EDIT_DISABLED',
        message: 'Result editing is disabled for this match',
        timestamp: new Date().toISOString()
      });
    }

    // Update result
    Object.assign(result, {
      kills: updateData.kills || result.kills,
      damage: updateData.damage || result.damage,
      rank: updateData.rank || result.rank,
      survival_time: updateData.survival_time || result.survival_time,
      headshots: updateData.headshots || result.headshots,
      assists: updateData.assists || result.assists,
      revives: updateData.revives || result.revives,
      screenshot: updateData.screenshot || result.screenshot,
      team_name: updateData.team_name || result.team_name,
      submitted_at: new Date(),
      status: 'pending' // Reset to pending after update
    });

    // Recalculate score
    const scoring = match.scoring_settings;
    const killPoints = (result.kills || 0) * (scoring.kill_points || 10);
    const rankPoints = scoring.rank_points?.get(result.rank.toString()) || 0;
    const damagePoints = (result.damage || 0) * (scoring.damage_multiplier || 0.01);
    const headshotBonus = (result.headshots || 0) * (scoring.headshot_bonus || 2);
    const survivalBonus = result.survival_time ? (scoring.survival_bonus || 5) : 0;
    
    result.total_score = killPoints + rankPoints + damagePoints + headshotBonus + survivalBonus;

    await match.save({ session });

    // Clear cache
    await clearMatchRelatedCaches(matchId, userId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ RESULT UPDATED | Match: ${match.title} | User: ${req.user.username}`);

    res.json({
      success: true,
      code: 'RESULT_UPDATED',
      message: 'Match result updated successfully',
      data: {
        match_id: matchId,
        result: {
          rank: result.rank,
          kills: result.kills,
          damage: result.damage,
          total_score: result.total_score,
          status: result.status,
          updated_at: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ UPDATE RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update match result',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 Get user's match result
exports.getMyMatchResult = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user.userId;
    
    const match = await Match.findById(matchId)
      .populate('results.player_id', 'username avatar')
      .populate('results.verified_by', 'username')
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
      r.player_id && r.player_id._id.toString() === userId.toString()
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        code: 'NO_RESULT_FOUND',
        message: 'You have not submitted any result for this match',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate estimated prize
    const leaderboard = calculateLeaderboard(match.results, match.scoring_settings);
    const prizes = calculatePrizesDistribution(leaderboard, match);
    const userPosition = leaderboard.findIndex(l => 
      l.player_id.toString() === userId.toString()
    );
    const estimatedPrize = userPosition !== -1 ? prizes[userPosition]?.prize_amount || 0 : 0;

    res.json({
      success: true,
      code: 'MY_RESULT_FETCHED',
      message: 'Your match result fetched successfully',
      data: {
        match_info: {
          id: matchId,
          title: match.title,
          total_prize: match.total_prize,
          result_status: match.result_status
        },
        result: {
          performance: {
            rank: userResult.rank,
            kills: userResult.kills,
            damage: userResult.damage,
            survival_time: userResult.survival_time,
            headshots: userResult.headshots,
            assists: userResult.assists,
            revives: userResult.revives,
            total_score: userResult.total_score
          },
          verification: {
            status: userResult.status,
            submitted_at: userResult.submitted_at,
            verified_at: userResult.verified_at,
            verified_by: userResult.verified_by?.username,
            admin_notes: userResult.admin_notes
          },
          screenshot: userResult.screenshot,
          team_name: userResult.team_name
        },
        position: {
          current_rank: userResult.rank,
          leaderboard_position: userPosition + 1,
          total_participants: match.results.length
        },
        prize: {
          estimated_amount: estimatedPrize,
          kill_prize: (userResult.kills || 0) * (match.per_kill || 0),
          rank_prize: estimatedPrize - ((userResult.kills || 0) * (match.per_kill || 0)),
          status: match.prize_status
        },
        actions: {
          can_edit: userResult.status !== 'verified' && match.allow_result_edit,
          can_dispute: userResult.status === 'verified' && userResult.status !== 'disputed',
          dispute_deadline: new Date(userResult.verified_at?.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ GET MY RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'MY_RESULT_ERROR',
      message: 'Failed to fetch your match result',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 Verify match result (Admin)
exports.verifyMatchResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { matchId, resultId } = req.params;
    const adminId = req.user.userId;
    const { status, notes } = req.body;
    
    console.log('👑 VERIFY MATCH RESULT:', {
      matchId,
      resultId,
      adminId: req.user.username,
      status,
      notes
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

    const result = match.results.id(resultId);
    
    if (!result) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify result using model method
    const verificationResult = match.verifyResult(result.player_id, adminId, status, notes);
    if (!verificationResult.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'VERIFICATION_FAILED',
        message: verificationResult.message,
        timestamp: new Date().toISOString()
      });
    }

    await match.save({ session });

    // Create notification for player
    await Notification.create([{
      user_id: result.player_id,
      type: 'result_verified',
      title: 'Result Verification Update',
      message: `Your result for match "${match.title}" has been ${status}`,
      data: {
        match_id: match._id,
        match_title: match.title,
        result_status: status,
        verified_by: req.user.username,
        verified_at: new Date(),
        notes: notes,
        admin_contact: 'support@gamingplatform.com'
      },
      priority: 'high'
    }], { session });

    // Clear cache
    await clearMatchRelatedCaches(matchId, result.player_id);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ RESULT VERIFIED | Match: ${match.title} | Result ID: ${resultId} | Status: ${status}`);

    res.json({
      success: true,
      code: 'RESULT_VERIFIED',
      message: `Result ${status} successfully`,
      data: {
        match_id: matchId,
        result_id: resultId,
        verification: {
          old_status: verificationResult.oldStatus,
          new_status: status,
          verified_by: req.user.username,
          verified_at: new Date().toISOString(),
          notes: notes
        },
        player: {
          id: result.player_id,
          username: result.player_name
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ VERIFY RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'VERIFICATION_ERROR',
      message: 'Failed to verify match result',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 Reject match result (Admin)
exports.rejectMatchResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { matchId, resultId } = req.params;
    const adminId = req.user.userId;
    const { reason, notes } = req.body;
    
    console.log('👑 REJECT MATCH RESULT:', {
      matchId,
      resultId,
      adminId: req.user.username,
      reason,
      notes
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

    const result = match.results.id(resultId);
    
    if (!result) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!reason || reason.trim().length < 10) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'INVALID_REASON',
        message: 'Rejection reason must be at least 10 characters',
        timestamp: new Date().toISOString()
      });
    }

    // Reject result using model method
    const rejectionResult = match.verifyResult(result.player_id, adminId, 'rejected', notes || reason);
    if (!rejectionResult.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'REJECTION_FAILED',
        message: rejectionResult.message,
        timestamp: new Date().toISOString()
      });
    }

    await match.save({ session });

    // Create notification for player
    await Notification.create([{
      user_id: result.player_id,
      type: 'result_rejected',
      title: 'Result Rejected',
      message: `Your result for match "${match.title}" has been rejected`,
      data: {
        match_id: match._id,
        match_title: match.title,
        reason: reason,
        rejected_by: req.user.username,
        rejected_at: new Date(),
        notes: notes,
        can_resubmit: true,
        resubmit_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      priority: 'high'
    }], { session });

    // Clear cache
    await clearMatchRelatedCaches(matchId, result.player_id);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ RESULT REJECTED | Match: ${match.title} | Result ID: ${resultId} | Reason: ${reason}`);

    res.json({
      success: true,
      code: 'RESULT_REJECTED',
      message: 'Result rejected successfully',
      data: {
        match_id: matchId,
        result_id: resultId,
        rejection: {
          reason: reason,
          rejected_by: req.user.username,
          rejected_at: new Date().toISOString(),
          notes: notes,
          resubmission_allowed: true,
          resubmission_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        player: {
          id: result.player_id,
          username: result.player_name
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ REJECT RESULT ERROR:', error);
    res.status(500).json({
      success: false,
      code: 'REJECTION_ERROR',
      message: 'Failed to reject match result',
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 Calculate winners (Admin)
exports.calculateWinners = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const adminId = req.user.userId;
    
    console.log('🏆 CALCULATE WINNERS:', {
      matchId,
      adminId: req.user.username
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

    // Check if match is completed
    if (match.status !== 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'MATCH_NOT_COMPLETED',
        message: 'Match is not completed yet',
        current_status: match.status,
        timestamp: new Date().toISOString()
      });
    }

    // Check if results are available
    if (match.results.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_RESULTS',
        message: 'No results available for calculation',
        timestamp: new Date().toISOString()
      });
    }

    // Filter verified results only
    const verifiedResults = match.results.filter(r => r.status === 'verified');
    
    if (verifiedResults.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_VERIFIED_RESULTS',
        message: 'No verified results available',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate leaderboard
    const leaderboard = calculateLeaderboard(verifiedResults, match.scoring_settings);
    
    // Calculate prizes
    const winners = calculateWinnersWithPrizes(leaderboard, match);
    
    // Update match with winners
    match.winners = winners;
    match.result_status = 'calculated';
    match.result_calculated_at = new Date();
    match.prize_status = 'ready';
    
    await match.save({ session });

    // Create notifications for winners
    for (const winner of winners) {
      await Notification.create([{
        user_id: winner.user,
        type: 'match_winner',
        title: 'Congratulations! 🏆',
        message: `You placed ${getOrdinal(winner.rank)} in "${match.title}"`,
        data: {
          match_id: match._id,
          match_title: match.title,
          rank: winner.rank,
          prize_amount: winner.total_prize,
          kills_prize: winner.kill_prize,
          rank_prize: winner.prize_amount,
          payment_status: 'pending',
          estimated_payment: 'Within 7 days'
        },
        priority: 'high'
      }], { session });
    }

    // Clear cache
    await clearMatchRelatedCaches(matchId, adminId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ WINNERS CALCULATED | Match: ${match.title} | Winners: ${winners.length}`);

    res.json({
      success: true,
      code: 'WINNERS_CALCULATED',
      message: 'Winners calculated successfully',
      data: {
        match_info: {
          id: matchId,
          title: match.title,
          total_prize: match.total_prize,
          total_participants: match.results.length,
          verified_results: verifiedResults.length
        },
        winners: winners.map(w => ({
          rank: w.rank,
          player: {
            id: w.user,
            username: w.username
          },
          performance: {
            kills: w.kills,
            damage: w.damage,
            total_score: w.total_score
          },
          prizes: {
            rank_prize: w.prize_amount,
            kill_prize: w.kill_prize,
            total_prize: w.total_prize,
            formatted_total: formatCurrency(w.total_prize)
          },
          payment: {
            status: w.payment_status,
            method: w.payment_method,
            estimated_payment: 'Within 7 days'
          }
        })),
        prize_summary: {
          total_distributed: winners.reduce((sum, w) => sum + w.total_prize, 0),
          remaining_prize: match.total_prize - winners.reduce((sum, w) => sum + w.total_prize, 0),
          platform_fee: calculatePlatformFee(match.entry_fee, match.current_participants),
          distribution_date: new Date().toISOString()
        },
        next_steps: [
          'Review winners list',
          'Initiate prize distribution',
          'Notify all participants'
        ]
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

// 🔥 Distribute prizes (Admin)
exports.distributePrizes = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const matchId = req.params.id;
    const adminId = req.user.userId;
    const { method, batch_size = 10 } = req.body;
    
    console.log('💰 DISTRIBUTE PRIZES:', {
      matchId,
      adminId: req.user.username,
      method,
      batch_size
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

    // Check if winners are calculated
    if (match.winners.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_WINNERS',
        message: 'Winners are not calculated yet',
        timestamp: new Date().toISOString()
      });
    }

    // Check if prizes are already distributed
    if (match.prize_status === 'distributed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'PRIZES_ALREADY_DISTRIBUTED',
        message: 'Prizes are already distributed',
        distribution_date: match.distribution_date,
        timestamp: new Date().toISOString()
      });
    }

    // Get pending winners
    const pendingWinners = match.winners.filter(w => w.payment_status === 'pending');
    
    if (pendingWinners.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: 'NO_PENDING_WINNERS',
        message: 'No pending winners to distribute prizes',
        timestamp: new Date().toISOString()
      });
    }

    // Update prize status
    match.prize_status = 'distributing';
    match.distributed_by = adminId;
    
    const batch = pendingWinners.slice(0, Math.min(batch_size, pendingWinners.length));
    const distributionResults = [];

    for (const winner of batch) {
      try {
        // Process payment
        const paymentResult = await processWinnerPayment(winner, match, method, session);
        
        if (paymentResult.success) {
          winner.payment_status = 'paid';
          winner.payment_method = method;
          winner.transaction_id = paymentResult.transaction_id;
          winner.paid_at = new Date();
          winner.payment_details = {
            phone_number: paymentResult.phone_number,
            transaction_ref: paymentResult.transaction_ref,
            distributed_by: req.user.username,
            distributed_at: new Date().toISOString()
          };
          
          distributionResults.push({
            winner_id: winner.user.toString(),
            username: winner.username,
            amount: winner.total_prize,
            status: 'success',
            transaction_id: paymentResult.transaction_id
          });

          // Create notification for winner
          await Notification.create([{
            user_id: winner.user,
            type: 'prize_distributed',
            title: 'Prize Distributed 🎉',
            message: `Your prize of ৳${winner.total_prize} for "${match.title}" has been distributed`,
            data: {
              match_id: match._id,
              match_title: match.title,
              amount: winner.total_prize,
              transaction_id: paymentResult.transaction_id,
              payment_method: method,
              distributed_at: new Date().toISOString()
            },
            priority: 'high'
          }], { session });

        } else {
          distributionResults.push({
            winner_id: winner.user.toString(),
            username: winner.username,
            amount: winner.total_prize,
            status: 'failed',
            error: paymentResult.error
          });
        }
      } catch (paymentError) {
        distributionResults.push({
          winner_id: winner.user.toString(),
          username: winner.username,
          amount: winner.total_prize,
          status: 'error',
          error: paymentError.message
        });
      }
    }

    // Check if all winners are processed
    const remainingWinners = match.winners.filter(w => w.payment_status === 'pending');
    match.prize_status = remainingWinners.length === 0 ? 'distributed' : 'distributing';
    
    if (remainingWinners.length === 0) {
      match.distribution_date = new Date();
    }

    await match.save({ session });

    // Clear cache
    await clearMatchRelatedCaches(matchId, adminId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ PRIZES DISTRIBUTED | Match: ${match.title} | Distributed: ${batch.length} | Remaining: ${remainingWinners.length}`);

    res.json({
      success: true,
      code: remainingWinners.length === 0 ? 'PRIZES_DISTRIBUTED' : 'PRIZES_DISTRIBUTING',
      message: remainingWinners.length === 0 
        ? 'All prizes distributed successfully' 
        : `Distributed ${batch.length} prizes. ${remainingWinners.length} remaining.`,
      data: {
        match_info: {
          id: matchId,
          title: match.title,
          total_prize: match.total_prize,
          prize_status: match.prize_status
        },
        distribution: {
          batch_size: batch.length,
          successful: distributionResults.filter(r => r.status === 'success').length,
          failed: distributionResults.filter(r => r.status === 'failed' || r.status === 'error').length,
          total_distributed: distributionResults.filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.amount, 0),
          results: distributionResults
        },
        summary: {
          distributed_winners: batch.length,
          remaining_winners: remainingWinners.length,
          total_winners: match.winners.length,
          next_batch_available: remainingWinners.length > 0,
          next_batch_size: Math.min(batch_size, remainingWinners.length)
        },
        next_steps: remainingWinners.length > 0 ? [
          `Process remaining ${remainingWinners.length} winners`,
          'Verify all transactions',
          'Update match status'
        ] : [
          'Update match status to completed',
          'Archive match data',
          'Generate match report'
        ]
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

// ==================== HELPER FUNCTIONS ====================

const validateResultData = (resultData, match) => {
  const errors = [];
  
  if (!resultData.rank || resultData.rank < 1) {
    errors.push('Rank is required and must be at least 1');
  }
  
  if (resultData.kills < 0) {
    errors.push('Kills cannot be negative');
  }
  
  if (resultData.damage < 0) {
    errors.push('Damage cannot be negative');
  }
  
  if (resultData.rank > match.max_participants) {
    errors.push(`Rank cannot be greater than ${match.max_participants}`);
  }
  
  if (errors.length > 0) {
    return {
      valid: false,
      response: {
        success: false,
        code: 'INVALID_RESULT_DATA',
        message: 'Result data validation failed',
        errors: errors,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { valid: true };
};

const calculateLeaderboard = (results, scoringSettings) => {
  // Sort by total score (descending), then by kills (descending), then by damage (descending)
  return [...results].sort((a, b) => {
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    if (b.kills !== a.kills) {
      return b.kills - a.kills;
    }
    return b.damage - a.damage;
  });
};

const calculatePrizesDistribution = (leaderboard, match) => {
  const totalPrize = match.total_prize;
  const distribution = match.prize_distribution || [50, 30, 20];
  const perKillPrize = match.per_kill || 0;
  
  return leaderboard.map((player, index) => {
    const rankPrizePercentage = distribution[index] || 0;
    const rankPrize = (totalPrize * rankPrizePercentage) / 100;
    const killPrize = (player.kills || 0) * perKillPrize;
    const totalPrizeAmount = rankPrize + killPrize;
    
    return {
      player_id: player.player_id,
      username: player.player_name,
      rank: index + 1,
      kills: player.kills || 0,
      damage: player.damage || 0,
      total_score: player.total_score || 0,
      rank_prize: rankPrize,
      kill_prize: killPrize,
      total_prize: totalPrizeAmount,
      prize_percentage: rankPrizePercentage
    };
  });
};

const calculateWinnersWithPrizes = (leaderboard, match) => {
  const distribution = calculatePrizesDistribution(leaderboard, match);
  
  return distribution.map(winner => ({
    rank: winner.rank,
    user: winner.player_id,
    username: winner.username,
    kills: winner.kills,
    damage: winner.damage,
    prize_amount: winner.rank_prize,
    kill_prize: winner.kill_prize,
    total_prize: winner.total_prize,
    payment_status: 'pending',
    payment_method: '',
    transaction_id: '',
    paid_at: null,
    payment_details: {
      phone_number: '',
      bank_name: '',
      account_number: '',
      transaction_ref: ''
    }
  }));
};

const processWinnerPayment = async (winner, match, method, session) => {
  // Find user wallet
  const wallet = await Wallet.findOne({ user_id: winner.user }).session(session);
  
  if (!wallet) {
    // Create wallet if doesn't exist
    const newWallet = await Wallet.create([{
      user_id: winner.user,
      balance: 0,
      total_earned: 0,
      total_spent: 0
    }], { session });
    
    wallet = newWallet[0];
  }
  
  // Add prize to wallet
  wallet.balance += winner.total_prize;
  wallet.total_earned += winner.total_prize;
  wallet.last_activity = new Date();
  await wallet.save({ session });
  
  // Create transaction record
  const transaction = await Transaction.create([{
    user_id: winner.user,
    type: 'credit',
    amount: winner.total_prize,
    description: `Prize for ${getOrdinal(winner.rank)} place in match: ${match.title}`,
    status: 'completed',
    method: method || 'wallet',
    reference_id: match._id.toString(),
    metadata: {
      match_id: match._id,
      match_title: match.title,
      rank: winner.rank,
      kills: winner.kills,
      rank_prize: winner.prize_amount,
      kill_prize: winner.kill_prize,
      distributed_by: match.distributed_by
    }
  }], { session });
  
  // Get user phone number for payment details
  const user = await User.findById(winner.user).session(session).select('phone');
  
  return {
    success: true,
    transaction_id: transaction[0]._id.toString(),
    phone_number: user?.phone || '',
    transaction_ref: `PRIZE_${match._id}_${winner.rank}_${Date.now()}`
  };
};

const getTopPerformer = (results, field) => {
  if (results.length === 0) return null;
  
  const top = results.reduce((max, current) => 
    (current[field] || 0) > (max[field] || 0) ? current : max
  );
  
  return {
    player_id: top.player_id,
    player_name: top.player_name,
    value: top[field] || 0,
    rank: top.rank
  };
};

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(amount);
};

module.exports = exports;
