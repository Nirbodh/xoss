const express = require('express');
const Tournament = require('../models/Tournament');
const router = express.Router();

// GET all tournaments - WITH DEEP DEBUG
router.get('/', async (req, res) => {
  try {
    console.log('=== DEBUG START ===');
    
    // 1. Check connection
    console.log('1. DB State:', Tournament.db.readyState);
    
    // 2. Check collection name
    const collections = await Tournament.db.db.listCollections().toArray();
    console.log('2. All Collections:', collections.map(c => c.name));
    
    // 3. Count in tournaments collection
    const count = await Tournament.countDocuments();
    console.log('3. Count in Tournament model:', count);
    
    // 4. Try different collection names
    const db = Tournament.db.db;
    let allData = [];
    
    // Check if data is in different collection
    for (let coll of collections) {
      const data = await db.collection(coll.name).find({}).toArray();
      if (data.length > 0) {
        console.log(`4. Found ${data.length} docs in ${coll.name}:`, data.map(d => d.title || 'No title'));
        allData = allData.concat(data);
      }
    }
    
    console.log('5. Total data found:', allData.length);
    
    // 5. Return whatever we found
    res.json({
      success: true,
      tournaments: allData,
      count: allData.length,
      debug: {
        dbState: Tournament.db.readyState,
        collections: collections.map(c => c.name),
        tournamentCount: count,
        totalFound: allData.length
      }
    });
    
    console.log('=== DEBUG END ===');
    
  } catch (error) {
    console.error('DEBUG Error:', error);
    res.json({
      success: false,
      message: error.message,
      tournaments: []
    });
  }
});

// CREATE tournament - WITH VERIFICATION
router.post('/create', async (req, res) => {
  try {
    console.log('=== CREATE DEBUG ===');
    console.log('Request body:', req.body);
    
    const tournament = new Tournament({
      title: req.body.title || 'Test Match ' + Date.now(),
      game: req.body.game || 'freefire',
      matchType: 'match',
      status: 'upcoming',
      entryFee: 20,
      prizePool: 500,
      maxPlayers: 50,
      currentPlayers: 0,
      roomId: 'ROOM123',
      password: 'PASS123'
    });

    console.log('Before save...');
    const savedTournament = await tournament.save();
    console.log('After save. ID:', savedTournament._id);
    
    // Verify immediately
    console.log('Verifying...');
    const verified = await Tournament.findById(savedTournament._id);
    console.log('Verified:', verified ? 'YES' : 'NO');
    
    res.json({
      success: true,
      message: 'Tournament created!',
      tournament: savedTournament,
      debug: {
        savedId: savedTournament._id,
        verified: !!verified
      }
    });
    
  } catch (error) {
    console.error('CREATE Error:', error);
    res.json({
      success: false,
      message: 'Create failed: ' + error.message
    });
  }
});

module.exports = router;
