// routes/matches.js - COMPLETELY UPDATED TO USE matchController.js
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// ✅ Import all functions from matchController.js
const matchController = require('../controllers/matchController');

// ==============================================
// ✅ PUBLIC ROUTES (No authentication required)
// ==============================================

// ✅ GET all matches (with optional filters)
router.get('/', matchController.getMatches);

// ✅ GET match by ID
router.get('/:id', matchController.getMatchById);

// ✅ DEBUG: Get collection info
router.get('/debug-collections', matchController.debugCollections);

// ✅ Get matches by filter type
router.get('/filter/:filterType', matchController.getMatchesByFilter);

// ==============================================
// ✅ USER PROTECTED ROUTES (auth middleware)
// ==============================================

// ✅ CREATE a new match
router.post('/', auth, matchController.createMatch);

// ✅ UPDATE match
router.put('/:id', auth, matchController.updateMatch);

// ✅ DELETE match
router.delete('/:id', auth, matchController.deleteMatch);

// ✅ UPDATE match status
router.patch('/:id/status', auth, matchController.updateMatchStatus);

// ✅ JOIN match (without payment)
router.post('/:id/join', auth, matchController.joinMatch);

// ✅ JOIN match WITH PAYMENT
router.post('/:id/join-with-payment', auth, matchController.joinMatchWithPayment);

// ==============================================
// ✅ ADMIN PROTECTED ROUTES (adminAuth middleware)
// ==============================================

// ✅ ADMIN: Get all matches (no filters for admin)
router.get('/admin/all', adminAuth, matchController.getAllMatchesForAdmin);

// ✅ ADMIN: Get pending matches for approval
router.get('/admin/pending', adminAuth, matchController.getPendingMatchesForAdmin);

// ✅ ADMIN: Approve match
router.post('/admin/approve/:id', adminAuth, matchController.approveMatchForAdmin);

// ✅ ADMIN: Reject match
router.post('/admin/reject/:id', adminAuth, matchController.rejectMatchForAdmin);

module.exports = router;
