// routes/matchRoutes.js - UPDATED VERSION
const express = require('express');
const mongoose = require('mongoose');
const {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  updateMatchStatus,
  debugCollections,
  getMatchesByFilter
} = require('../controllers/matchController');
const { auth, adminAuth } = require('../middleware/auth');

// Import Match model
const Match = require('../models/Match');

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

// ==============================================
// ✅ ADMIN ENDPOINTS - TEMPORARILY USING auth (NOT adminAuth)
// ==============================================

// ✅ TEMPORARY: Use auth instead of adminAuth to test
router.get('/admin/pending', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 ADMIN: Fetching pending matches...');
    console.log('👤 User Role:', req.user?.role); // Log user role

    const matches = await Match.find({
      approval_status: 'pending'
    })
      .populate('created_by', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Match.countDocuments({
      approval_status: 'pending'
    });

    console.log(`✅ ADMIN: Found ${matches.length} pending matches`);

    res.json({
      success: true,
      data: matches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ ADMIN pending matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending matches',
      error: error.message
    });
  }
});

// ✅ TEMPORARY: Use auth instead of adminAuth
router.post('/admin/approve/:id', auth, async (req, res) => {
  try {
    console.log('✅ ADMIN: Approving match:', req.params.id);
    console.log('👤 Approving User:', req.user);
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'approved',
        status: 'upcoming',
        approved_by: req.user.userId,
        approved_at: new Date(),
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    ).populate('created_by', 'username email');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log('✅ Match approved successfully:', match._id);

    res.json({
      success: true,
      message: 'Match approved successfully',
      data: match
    });
  } catch (error) {
    console.error('❌ ADMIN approve match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve match',
      error: error.message
    });
  }
});

// ✅ TEMPORARY: Use auth instead of adminAuth
router.post('/admin/reject/:id', auth, async (req, res) => {
  try {
    console.log('❌ ADMIN: Rejecting match:', req.params.id);
    console.log('👤 Rejecting User:', req.user);
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        approval_status: 'rejected',
        status: 'cancelled',
        rejection_reason: req.body.rejectionReason || 'No reason provided',
        admin_notes: req.body.adminNotes || ''
      },
      { new: true }
    ).populate('created_by', 'username email');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log('✅ Match rejected successfully:', match._id);

    res.json({
      success: true,
      message: 'Match rejected successfully',
      data: match
    });
  } catch (error) {
    console.error('❌ ADMIN reject match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject match',
      error: error.message
    });
  }
});

// ✅ ADMIN: Get all matches without filter (for admin app)
router.get('/admin/all', auth, async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching ALL matches WITHOUT ANY FILTER...');
    
    const allMatches = await Match.find({})
      .populate('created_by', 'username')
      .sort({ createdAt: -1 });

    console.log(`✅ ADMIN: Found ${allMatches.length} matches in database`);

    res.json({
      success: true,
      total: allMatches.length,
      data: allMatches,
      message: 'All matches fetched for admin'
    });
  } catch (error) {
    console.error('❌ ADMIN all matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all matches',
      error: error.message
    });
  }
});

// ✅ ADMIN: Debug matches
router.get('/admin/debug', auth, async (req, res) => {
  try {
    const allMatches = await Match.find({}).sort({ createdAt: -1 });
    const approvedMatches = await Match.find({ approval_status: 'approved' });
    const pendingMatches = await Match.find({ approval_status: 'pending' });
    const upcomingMatches = await Match.find({ status: 'upcoming' });
    const completedMatches = await Match.find({ status: 'completed' });

    res.json({
      success: true,
      counts: {
        total: allMatches.length,
        approved: approvedMatches.length,
        pending: pendingMatches.length,
        upcoming: upcomingMatches.length,
        completed: completedMatches.length
      },
      allMatches: allMatches.map(m => ({
        id: m._id,
        title: m.title,
        status: m.status,
        approval_status: m.approval_status,
        game: m.game,
        match_type: m.match_type,
        created_at: m.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ ADMIN debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

module.exports = router;
