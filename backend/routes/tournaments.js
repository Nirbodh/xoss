// routes/tournaments.js - COMPLETELY UPDATED TO USE tournamentController.js
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// ✅ Import all functions from tournamentController.js
const tournamentController = require('../controllers/tournamentController');

// ==============================================
// ✅ PUBLIC ROUTES (No authentication required)
// ==============================================

// ✅ GET all tournaments (with optional filters)
router.get('/', tournamentController.getTournaments);

// ✅ GET tournament by ID
router.get('/:id', tournamentController.getTournamentById);

// ==============================================
// ✅ USER PROTECTED ROUTES (auth middleware)
// ==============================================

// ✅ CREATE a new tournament
router.post('/', auth, tournamentController.createTournament);

// ✅ UPDATE tournament
router.put('/:id', auth, tournamentController.updateTournament);

// ✅ DELETE tournament
router.delete('/:id', auth, tournamentController.deleteTournament);

// ✅ JOIN tournament (without payment)
router.post('/:id/join', auth, tournamentController.joinTournament);

// ✅ JOIN tournament WITH PAYMENT
router.post('/:id/join-with-payment', auth, tournamentController.joinTournamentWithPayment);

// ==============================================
// ✅ ADMIN PROTECTED ROUTES (adminAuth middleware)
// ==============================================

// ✅ ADMIN: Get all tournaments (no filters for admin)
router.get('/admin/all', adminAuth, tournamentController.getAllTournamentsForAdmin);

// ✅ ADMIN: Get pending tournaments for approval
router.get('/admin/pending', adminAuth, tournamentController.getPendingTournamentsForAdmin);

// ✅ ADMIN: Approve tournament
router.post('/admin/approve/:id', adminAuth, tournamentController.approveTournamentForAdmin);

// ✅ ADMIN: Reject tournament
router.post('/admin/reject/:id', adminAuth, tournamentController.rejectTournamentForAdmin);

module.exports = router;
