const express = require('express');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const router = express.Router();

// GET all matches and tournaments combined
router.get('/', async (req, res) => {
  try {
    console.log('🔄 Fetching all matches and tournaments...');
    
    const [matches, tournaments] = await Promise.all([
      Match.find({ status: { $in: ['upcoming', 'live'] } }).sort({ scheduleTime: 1 }),
      Tournament.find({ status: { $in: ['upcoming', 'live'] } }).sort({ scheduleTime: 1 })
    ]);

    // Combine both arrays
    const combinedData = [
      ...matches.map(m => ({ ...m.toObject(), source: 'match' })),
      ...tournaments.map(t => ({ ...t.toObject(), source: 'tournament' }))
    ].sort((a, b) => new Date(a.scheduleTime) - new Date(b.scheduleTime));

    console.log(`✅ Found ${matches.length} matches and ${tournaments.length} tournaments`);

    res.json({
      success: true,
      data: combinedData,
      counts: {
        matches: matches.length,
        tournaments: tournaments.length,
        total: combinedData.length
      }
    });
  } catch (err) {
    console.error('❌ Combined API error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
