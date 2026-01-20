// routes/admin/tournaments.js - ADMIN ONLY ROUTES
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const tournamentController = require('../controllers/tournamentController');

// ==============================================
// 🔥 ADMIN DASHBOARD OVERVIEW
// ==============================================

// ✅ ADMIN: Get all tournaments
router.get('/', adminAuth, tournamentController.getAllTournamentsForAdmin);

// ✅ ADMIN: Get tournaments dashboard stats
router.get('/dashboard/stats', adminAuth, tournamentController.getTournamentDashboardStats);

// ✅ ADMIN: Get recent tournament activities
router.get('/activities/recent', adminAuth, tournamentController.getRecentTournamentActivities);

// ==============================================
// 🔥 ADMIN TOURNAMENT MANAGEMENT
// ==============================================

// ✅ ADMIN: Get tournament by ID
router.get('/:id', adminAuth, tournamentController.getTournamentByIdForAdmin);

// ✅ ADMIN: Update tournament details
router.put('/:id/update', adminAuth, tournamentController.adminUpdateTournament);

// ✅ ADMIN: Force delete tournament
router.delete('/:id/force-delete', adminAuth, tournamentController.forceDeleteTournament);

// ✅ ADMIN: Update multiple tournaments status
router.post('/batch/update-status', adminAuth, tournamentController.batchUpdateTournamentStatus);

// ✅ ADMIN: Export tournaments data
router.get('/export/data', adminAuth, tournamentController.exportTournamentsData);

// ==============================================
// 🔥 ADMIN TOURNAMENT APPROVAL/REJECTION
// ==============================================

// ✅ ADMIN: Get pending tournaments
router.get('/pending/list', adminAuth, tournamentController.getPendingTournamentsForAdmin);

// ✅ ADMIN: Approve tournament
router.post('/:id/approve', adminAuth, tournamentController.approveTournamentForAdmin);

// ✅ ADMIN: Reject tournament
router.post('/:id/reject', adminAuth, tournamentController.rejectTournamentForAdmin);

// ✅ ADMIN: Get rejected tournaments
router.get('/rejected/list', adminAuth, tournamentController.getRejectedTournamentsForAdmin);

// ==============================================
// 🔥 ADMIN PARTICIPANT MANAGEMENT
// ==============================================

// ✅ ADMIN: Get all participants for a tournament
router.get('/:id/participants/all', adminAuth, tournamentController.getTournamentParticipantsForAdmin);

// ✅ ADMIN: Add participant manually
router.post('/:id/participants/add', adminAuth, tournamentController.addTournamentParticipantManually);

// ✅ ADMIN: Remove participant
router.delete('/:id/participants/:participantId/remove', adminAuth, tournamentController.adminRemoveTournamentParticipant);

// ✅ ADMIN: Update participant status
router.put('/:id/participants/:participantId/status', adminAuth, tournamentController.adminUpdateTournamentParticipantStatus);

// ✅ ADMIN: Export participants list
router.get('/:id/participants/export', adminAuth, tournamentController.exportTournamentParticipants);

// ==============================================
// 🔥 ADMIN BRACKET & SCHEDULE MANAGEMENT
// ==============================================

// ✅ ADMIN: Generate tournament bracket
router.post('/:id/bracket/generate', adminAuth, tournamentController.generateTournamentBracket);

// ✅ ADMIN: Update bracket manually
router.put('/:id/bracket/update', adminAuth, tournamentController.updateTournamentBracket);

// ✅ ADMIN: Generate match schedule
router.post('/:id/schedule/generate', adminAuth, tournamentController.generateTournamentSchedule);

// ✅ ADMIN: Update match schedule
router.put('/:id/schedule/update', adminAuth, tournamentController.updateTournamentSchedule);

// ==============================================
// 🔥 ADMIN PRIZE & WINNER MANAGEMENT
// ==============================================

// ✅ ADMIN: Set tournament prizes
router.post('/:id/prizes/set', adminAuth, tournamentController.setTournamentPrizes);

// ✅ ADMIN: Calculate tournament winners
router.post('/:id/winners/calculate', adminAuth, tournamentController.calculateTournamentWinners);

// ✅ ADMIN: Update winners manually
router.put('/:id/winners/update', adminAuth, tournamentController.updateTournamentWinnersManually);

// ✅ ADMIN: Distribute tournament prizes
router.post('/:id/prizes/distribute', adminAuth, tournamentController.distributeTournamentPrizes);

// ✅ ADMIN: Get prize distribution history
router.get('/:id/prizes/history', adminAuth, tournamentController.getTournamentPrizeDistributionHistory);

// ==============================================
// 🔥 ADMIN ANALYTICS & REPORTS
// ==============================================

// ✅ ADMIN: Get tournament analytics
router.get('/:id/analytics/detailed', adminAuth, tournamentController.getTournamentAnalyticsForAdmin);

// ✅ ADMIN: Get financial report for tournament
router.get('/:id/reports/financial', adminAuth, tournamentController.getTournamentFinancialReport);

// ✅ ADMIN: Get participation report
router.get('/:id/reports/participation', adminAuth, tournamentController.getTournamentParticipationReport);

// ✅ ADMIN: Generate tournament report
router.get('/:id/reports/generate', adminAuth, tournamentController.generateTournamentReport);

// ==============================================
// 🔥 ADMIN SYSTEM OPERATIONS
// ==============================================

// ✅ ADMIN: Clear tournament cache
router.post('/:id/cache/clear', adminAuth, tournamentController.clearTournamentCache);

// ✅ ADMIN: Recalculate tournament statistics
router.post('/:id/stats/recalculate', adminAuth, tournamentController.recalculateTournamentStats);

// ✅ ADMIN: Send notifications to tournament participants
router.post('/:id/notifications/send', adminAuth, tournamentController.sendTournamentNotifications);

// ==============================================
// 🔥 VALIDATION MIDDLEWARE
// ==============================================

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
