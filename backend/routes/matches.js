// routes/matches.js - COMPLETE PRODUCTION VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth, moderatorAuth } = require('../middleware/auth');
const matchController = require('../controllers/matchController');

// ==============================================
// 🔥 PUBLIC ROUTES (No authentication required)
// ==============================================

// ✅ GET all matches with filters
router.get('/', matchController.getMatches);

// ✅ GET match by ID
router.get('/:id', matchController.getMatchById);

// ✅ SEARCH matches
router.get('/search/advanced', matchController.searchMatches);

// ✅ GET featured matches
router.get('/featured/list', matchController.getFeaturedMatches);

// ✅ GET upcoming matches
router.get('/upcoming/list', matchController.getUpcomingMatches);

// ✅ GET match statistics
router.get('/statistics/overview', matchController.getMatchStatistics);

// ✅ DEBUG: Get collection info
router.get('/debug/collections', matchController.debugCollections);

// ✅ Get matches by filter type
router.get('/filter/:filterType', matchController.getMatchesByFilter);

// ==============================================
// 🔥 USER PROTECTED ROUTES (auth middleware)
// ==============================================

// ✅ CREATE a new match
router.post('/create', auth, matchController.createMatch);

// ✅ UPDATE match
router.put('/:id/update', auth, matchController.updateMatch);

// ✅ DELETE match
router.delete('/:id/delete', auth, matchController.deleteMatch);

// ✅ UPDATE match status
router.patch('/:id/status/update', auth, matchController.updateMatchStatus);

// ✅ JOIN match (without payment)
router.post('/:id/join/free', auth, matchController.joinMatch);

// ✅ JOIN match WITH PAYMENT
router.post('/:id/join/paid', auth, matchController.joinMatchWithPayment);

// ✅ LEAVE match
router.post('/:id/leave', auth, matchController.leaveMatch);

// ✅ GET user matches
router.get('/user/my-matches', auth, matchController.getUserMatches);

// ✅ GET match participants
router.get('/:id/participants/list', auth, matchController.getMatchParticipants);

// ==============================================
// 🔥 MATCH RESULTS & SCORING ROUTES
// ==============================================

// ✅ SUBMIT match result
router.post('/:id/results/submit', auth, matchController.submitMatchResult);

// ✅ GET match results
router.get('/:id/results/list', auth, matchController.getMatchResults);

// ✅ UPDATE submitted result
router.put('/:id/results/update', auth, matchController.updateMatchResult);

// ✅ GET user's match result
router.get('/:id/results/my', auth, matchController.getMyMatchResult);

// ==============================================
// 🔥 DASHBOARD & ANALYTICS ROUTES
// ==============================================

// ✅ GET dashboard overview
router.get('/dashboard/overview', auth, matchController.getDashboardOverview);

// ✅ GET match analytics
router.get('/:id/analytics/detailed', auth, matchController.getMatchAnalytics);

// ==============================================
// 🔥 ADMIN PROTECTED ROUTES (adminAuth middleware)
// ==============================================

// ✅ ADMIN: Get all matches
router.get('/admin/all/list', adminAuth, matchController.getAllMatchesForAdmin);

// ✅ ADMIN: Get pending matches
router.get('/admin/pending/list', adminAuth, matchController.getPendingMatchesForAdmin);

// ✅ ADMIN: Approve match
router.post('/admin/:id/approve', adminAuth, matchController.approveMatchForAdmin);

// ✅ ADMIN: Reject match
router.post('/admin/:id/reject', adminAuth, matchController.rejectMatchForAdmin);

// ✅ ADMIN: Update match status
router.put('/admin/:id/status/update', adminAuth, matchController.updateMatchStatus);

// ✅ ADMIN: Remove participant
router.delete('/admin/:matchId/participant/:participantId/remove', adminAuth, matchController.removeParticipant);

// ✅ ADMIN: Update participant status
router.put('/admin/:matchId/participant/:participantId/status', adminAuth, matchController.updateParticipantStatus);

// ==============================================
// 🔥 RESULT VERIFICATION ROUTES
// ==============================================

// ✅ ADMIN: Verify match result
router.post('/admin/:matchId/results/:resultId/verify', adminAuth, matchController.verifyMatchResult);

// ✅ ADMIN: Reject match result
router.post('/admin/:matchId/results/:resultId/reject', adminAuth, matchController.rejectMatchResult);

// ✅ ADMIN: Calculate winners
router.post('/admin/:id/winners/calculate', adminAuth, matchController.calculateWinners);

// ✅ ADMIN: Distribute prizes
router.post('/admin/:id/prizes/distribute', adminAuth, matchController.distributePrizes);

// ==============================================
// 🔥 MODERATOR ROUTES (moderatorAuth middleware)
// ==============================================

// ✅ MODERATOR: Get matches for moderation
router.get('/moderator/pending/review', moderatorAuth, matchController.getPendingMatchesForAdmin);

// ✅ MODERATOR: Approve match
router.post('/moderator/:id/approve', moderatorAuth, matchController.approveMatchForAdmin);

// ✅ MODERATOR: Reject match
router.post('/moderator/:id/reject', moderatorAuth, matchController.rejectMatchForAdmin);

// ✅ MODERATOR: Verify results
router.post('/moderator/:matchId/results/verify', moderatorAuth, matchController.verifyMatchResult);

// ==============================================
// 🔥 VALIDATION MIDDLEWARE
// ==============================================

// Validate match ID parameter
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

// Validate result ID parameter
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
