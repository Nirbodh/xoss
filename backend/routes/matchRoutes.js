// routes/matchRoutes.js - UPDATED VERSION
const express = require('express');
const {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  updateMatchStatus,
  debugCollections,
  getMatchesByFilter  // ✅ NEW FUNCTION ADDED
} = require('../controllers/matchController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ✅ DEBUG: Get collection info
router.get('/debug-collections', debugCollections);

// ✅ CREATE match
router.post('/', auth, createMatch);

// ✅ GET all matches (NO FILTERS - SAME AS matches.js)
router.get('/', getMatches);

// ✅ ADDED: Get matches by filter type
router.get('/filter/:filterType', getMatchesByFilter);

// ✅ GET match by ID
router.get('/:id', getMatchById);

// ✅ UPDATE match
router.put('/:id', auth, updateMatch);

// ✅ DELETE match
router.delete('/:id', auth, deleteMatch);

// ✅ UPDATE match status
router.patch('/:id/status', auth, updateMatchStatus);

module.exports = router;
