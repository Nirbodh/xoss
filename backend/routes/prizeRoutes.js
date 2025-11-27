// routes/prizeRoutes.js - UPDATED WITH CORRECT ROUTE NAMES
const express = require('express');
const router = express.Router();
const prizeController = require('../controllers/prizeController');
const { auth, adminAuth } = require('../middleware/auth');

console.log('💰 Prize routes loading with REAL controller...');

// ✅ Test route
router.get('/test', (req, res) => {
  console.log('✅ Prize test route called - REAL controller active');
  res.json({
    success: true,
    message: '🎉 Prize Management System with REAL Database is Working!',
    timestamp: new Date().toISOString(),
    features: [
      'Real database integration',
      'Prize distribution tracking',
      'Manual payment marking',
      'Distribution history',
      'Refund management'
    ]
  });
});

// ✅ Real routes with database integration - ROUTE NAMES FIXED
router.get('/pending', prizeController.getPendingEvents); // ✅ Changed from '/pending-events'
router.get('/history', prizeController.getDistributionHistory);
router.post('/distribute/:eventId', prizeController.distributePrizes);
router.post('/mark-paid/:eventId/:winnerId', prizeController.markAsPaid);
router.post('/refund/:eventId', prizeController.refundPrizes);
router.get('/calculate/:eventId', prizeController.calculatePrizeBreakdown);

module.exports = router;
