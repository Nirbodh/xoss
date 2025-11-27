// routes/resultRoutes.js - COMPLETE AUTO SYSTEM
const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

console.log('📊 Auto Result routes loading...');

// ✅ Result management routes
router.post('/submit/:eventId', resultController.submitResult);
router.get('/calculate-winners/:eventId', resultController.calculateWinners);
router.get('/:eventId', resultController.getEventResults);
router.post('/verify/:eventId/:resultId', resultController.verifyResult);
router.post('/bulk-verify/:eventId', resultController.bulkVerifyResults);

module.exports = router;
