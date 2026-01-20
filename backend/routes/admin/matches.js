// routes/admin/matches.js - ADMIN ONLY ROUTES
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../middleware/auth');
const matchController = require('../../controllers/matchController');

// ==============================================
// 🔥 ADMIN DASHBOARD OVERVIEW
// ==============================================

// ✅ ADMIN: Get all matches (with advanced filtering)
router.get('/', adminAuth, matchController.getAllMatchesForAdmin);

// ✅ ADMIN: Get matches dashboard stats
router.get('/dashboard/stats', adminAuth, matchController.getDashboardStats);

// ✅ ADMIN: Get recent activities
router.get('/activities/recent', adminAuth, matchController.getRecentActivities);

// ==============================================
// 🔥 ADMIN MATCH MANAGEMENT
// ==============================================

// ✅ ADMIN: Get match by ID
router.get('/:id', adminAuth, matchController.getMatchByIdForAdmin);

// ✅ ADMIN: Update match details
router.put('/:id/update', adminAuth, matchController.adminUpdateMatch);

// ✅ ADMIN: Force delete match
router.delete('/:id/force-delete', adminAuth, matchController.forceDeleteMatch);

// ✅ ADMIN: Update multiple matches status
router.post('/batch/update-status', adminAuth, matchController.batchUpdateMatchStatus);

// ✅ ADMIN: Export matches data
router.get('/export/data', adminAuth, matchController.exportMatchesData);

// ==============================================
// 🔥 ADMIN MATCH APPROVAL/REJECTION
// ==============================================

// ✅ ADMIN: Get pending matches
router.get('/pending/list', adminAuth, matchController.getPendingMatchesForAdmin);

// ✅ ADMIN: Approve match
router.post('/:id/approve', adminAuth, matchController.approveMatchForAdmin);

// ✅ ADMIN: Reject match
router.post('/:id/reject', adminAuth, matchController.rejectMatchForAdmin);

// ✅ ADMIN: Get rejected matches
router.get('/rejected/list', adminAuth, matchController.getRejectedMatchesForAdmin);

// ==============================================
// 🔥 ADMIN PARTICIPANT MANAGEMENT
// ==============================================

// ✅ ADMIN: Get all participants for a match
router.get('/:id/participants/all', adminAuth, matchController.getMatchParticipantsForAdmin);

// ✅ ADMIN: Add participant manually
router.post('/:id/participants/add', adminAuth, matchController.addParticipantManually);

// ✅ ADMIN: Remove participant
router.delete('/:id/participants/:participantId/remove', adminAuth, matchController.adminRemoveParticipant);

// ✅ ADMIN: Update participant status
router.put('/:id/participants/:participantId/status', adminAuth, matchController.adminUpdateParticipantStatus);

// ✅ ADMIN: Export participants list
router.get('/:id/participants/export', adminAuth, matchController.exportParticipants);

// ==============================================
// 🔥 ADMIN RESULT MANAGEMENT
// ==============================================

// ✅ ADMIN: Get all results for a match
router.get('/:id/results/all', adminAuth, matchController.getMatchResultsForAdmin);

// ✅ ADMIN: Submit result on behalf of user
router.post('/:id/results/submit', adminAuth, matchController.adminSubmitMatchResult);

// ✅ ADMIN: Update any result
router.put('/:id/results/:resultId/update', adminAuth, matchController.adminUpdateMatchResult);

// ✅ ADMIN: Delete result
router.delete('/:id/results/:resultId/delete', adminAuth, matchController.adminDeleteMatchResult);

// ✅ ADMIN: Verify match result
router.post('/:id/results/:resultId/verify', adminAuth, matchController.verifyMatchResultForAdmin);

// ✅ ADMIN: Reject match result
router.post('/:id/results/:resultId/reject', adminAuth, matchController.rejectMatchResultForAdmin);

// ==============================================
// 🔥 ADMIN PRIZE & WINNER MANAGEMENT
// ==============================================

// ✅ ADMIN: Calculate winners
router.post('/:id/winners/calculate', adminAuth, matchController.calculateWinners);

// ✅ ADMIN: Update winners manually
router.put('/:id/winners/update', adminAuth, matchController.updateWinnersManually);

// ✅ ADMIN: Distribute prizes
router.post('/:id/prizes/distribute', adminAuth, matchController.distributePrizes);

// ✅ ADMIN: Get prize distribution history
router.get('/:id/prizes/history', adminAuth, matchController.getPrizeDistributionHistory);

// ==============================================
// 🔥 ADMIN ANALYTICS & REPORTS
// ==============================================

// ✅ ADMIN: Get match analytics
router.get('/:id/analytics/detailed', adminAuth, matchController.getMatchAnalyticsForAdmin);

// ✅ ADMIN: Get financial report for match
router.get('/:id/reports/financial', adminAuth, matchController.getMatchFinancialReport);

// ✅ ADMIN: Get participation report
router.get('/:id/reports/participation', adminAuth, matchController.getParticipationReport);

// ✅ ADMIN: Generate match report
router.get('/:id/reports/generate', adminAuth, matchController.generateMatchReport);

// ==============================================
// 🔥 ADMIN SYSTEM OPERATIONS
// ==============================================

// ✅ ADMIN: Clear match cache
router.post('/:id/cache/clear', adminAuth, matchController.clearMatchCache);

// ✅ ADMIN: Recalculate match statistics
router.post('/:id/stats/recalculate', adminAuth, matchController.recalculateMatchStats);

// ✅ ADMIN: Send notifications to participants
router.post('/:id/notifications/send', adminAuth, matchController.sendMatchNotifications);

// ==============================================
// 🔥 VALIDATION MIDDLEWARE
// ==============================================

router.param('id', async (req, res, next, id) => {
  try {
    const Match = require('../models/Match');
    const match = await Match.findById(id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }
    
    req.match = match;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Invalid match ID',
      timestamp: new Date().toISOString()
    });
  }
});

router.param('participantId', async (req, res, next, id) => {
  try {
    if (!req.match) {
      return res.status(400).json({
        success: false,
        code: 'MATCH_REQUIRED',
        message: 'Match context required',
        timestamp: new Date().toISOString()
      });
    }
    
    const participant = req.match.participants.id(id);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found in this match',
        timestamp: new Date().toISOString()
      });
    }
    
    req.participant = participant;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PARTICIPANT_ID',
      message: 'Invalid participant ID',
      timestamp: new Date().toISOString()
    });
  }
});

router.param('resultId', async (req, res, next, id) => {
  try {
    if (!req.match) {
      return res.status(400).json({
        success: false,
        code: 'MATCH_REQUIRED',
        message: 'Match context required',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = req.match.results.id(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        code: 'RESULT_NOT_FOUND',
        message: 'Result not found in this match',
        timestamp: new Date().toISOString()
      });
    }
    
    req.result = result;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_RESULT_ID',
      message: 'Invalid result ID',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
