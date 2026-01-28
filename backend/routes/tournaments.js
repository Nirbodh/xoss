// routes/tournaments.js - COMPLETE PRODUCTION VERSION
const express = require('express');
const router = express.Router();
const { auth, adminAuth, moderatorAuth } = require('../middleware/auth');
const tournamentController = require('../controllers/tournamentController');

// ==============================================
// 🔥 PUBLIC ROUTES (No authentication required)
// ==============================================

// ✅ GET all tournaments with filters
router.get('/', tournamentController.getTournaments);

// ✅ GET tournament by ID
router.get('/:id', tournamentController.getTournamentById);

// ✅ SEARCH tournaments
router.get('/search/advanced', tournamentController.searchTournaments);

// ✅ GET featured tournaments
router.get('/featured/list', tournamentController.getFeaturedTournaments);

// ✅ GET upcoming tournaments
router.get('/upcoming/list', tournamentController.getUpcomingTournaments);

// ✅ GET tournament statistics
router.get('/statistics/overview', tournamentController.getTournamentStatistics);

// ==============================================
// 🔥 USER PROTECTED ROUTES (auth middleware)
// ==============================================

// ✅ CREATE a new tournament
router.post('/create', auth, tournamentController.createTournament);

// ✅ UPDATE tournament
router.put('/:id/update', auth, tournamentController.updateTournament);

// ✅ DELETE tournament
router.delete('/:id/delete', auth, tournamentController.deleteTournament);

// ✅ JOIN tournament (without payment)
router.post('/:id/join/free', auth, tournamentController.joinTournament);

// ✅ JOIN tournament WITH PAYMENT
router.post('/:id/join-with-payment', auth, tournamentController.joinTournamentWithPayment);

// ✅ LEAVE tournament
router.post('/:id/leave', auth, tournamentController.leaveTournament);

// ✅ GET user tournaments
router.get('/user/tournaments', auth, tournamentController.getUserTournaments);

// ✅ GET tournament participants
router.get('/:id/participants/list', auth, tournamentController.getTournamentParticipants);

// ==============================================
// 🔥 DASHBOARD & ANALYTICS ROUTES
// ==============================================

// ✅ GET dashboard overview
// router.get('/dashboard/overview', auth, tournamentController.getDashboardOverview);

// ✅ GET tournament analytics
// router.get('/:id/analytics/detailed', auth, tournamentController.getTournamentAnalytics);

// ==============================================
// 🔥 ADMIN PROTECTED ROUTES (adminAuth middleware)
// ==============================================

// ✅ ADMIN: Get all tournaments
router.get('/admin/all/list', adminAuth, tournamentController.getAllTournamentsForAdmin);

// ✅ ADMIN: Get pending tournaments
router.get('/admin/pending/list', adminAuth, tournamentController.getPendingTournamentsForAdmin);

// ✅ ADMIN: Approve tournament
router.post('/admin/:id/approve', adminAuth, tournamentController.approveTournamentForAdmin);

// ✅ ADMIN: Reject tournament
router.post('/admin/:id/reject', adminAuth, tournamentController.rejectTournamentForAdmin);

// ✅ ADMIN: Update tournament status
router.put('/admin/:id/status/update', adminAuth, tournamentController.updateTournamentStatus);

// ✅ ADMIN: Remove participant
router.delete('/admin/:tournamentId/participant/:participantId/remove', adminAuth, tournamentController.removeParticipant);

// ✅ ADMIN: Update participant status
router.put('/admin/:tournamentId/participant/:participantId/status', adminAuth, tournamentController.updateParticipantStatus);

// ==============================================
// 🔥 MODERATOR ROUTES (moderatorAuth middleware)
// ==============================================

// ✅ MODERATOR: Get tournaments for moderation
// router.get('/moderator/pending/review', moderatorAuth, tournamentController.getPendingTournamentsForAdmin);

// ✅ MODERATOR: Approve tournament
// router.post('/moderator/:id/approve', moderatorAuth, tournamentController.approveTournamentForAdmin);

// ✅ MODERATOR: Reject tournament
// router.post('/moderator/:id/reject', moderatorAuth, tournamentController.rejectTournamentForAdmin);

// ==============================================
// 🔥 VALIDATION MIDDLEWARE
// ==============================================

// Validate tournament ID parameter
router.param('id', async (req, res, next, id) => {
  try {
    const Tournament = require('../models/Tournament');
    const tournament = await Tournament.findById(id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        code: 'TOURNAMENT_NOT_FOUND',
        message: 'Tournament not found',
        timestamp: new Date().toISOString()
      });
    }
    
    req.tournament = tournament;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'Invalid tournament ID',
      timestamp: new Date().toISOString()
    });
  }
});

// Validate participant ID parameter
router.param('participantId', async (req, res, next, id) => {
  try {
    if (!req.tournament) {
      return res.status(400).json({
        success: false,
        code: 'TOURNAMENT_REQUIRED',
        message: 'Tournament context required',
        timestamp: new Date().toISOString()
      });
    }
    
    const participant = req.tournament.participants.id(id);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Participant not found in this tournament',
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

module.exports = router;
