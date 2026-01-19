const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

// Get all events (matches + tournaments)
router.get('/', async (req, res) => {
  try {
    const { type, status, game, page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (game) query.game = game;
    
    // Fetch matches and tournaments in parallel
    const [matches, tournaments, totalMatches, totalTournaments] = await Promise.all([
      Match.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Tournament.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Match.countDocuments(query),
      Tournament.countDocuments(query)
    ]);
    
    const events = [...matches, ...tournaments].sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMatches + totalTournaments,
        totalPages: Math.ceil((totalMatches + totalTournaments) / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get active events
router.get('/active', async (req, res) => {
  try {
    const [activeMatches, activeTournaments] = await Promise.all([
      Match.find({ status: 'active' }).sort({ start_time: 1 }),
      Tournament.find({ status: 'active' }).sort({ start_time: 1 })
    ]);
    
    res.json({
      success: true,
      data: {
        matches: activeMatches,
        tournaments: activeTournaments,
        total: activeMatches.length + activeTournaments.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find in matches first
    let event = await Match.findById(id);
    let eventType = 'match';
    
    // If not found in matches, try tournaments
    if (!event) {
      event = await Tournament.findById(id);
      eventType = 'tournament';
    }
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        ...event.toObject(),
        eventType
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
