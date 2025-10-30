// controllers/matchController.js
const Match = require('../models/Match');
const mongoose = require('mongoose');

// ✅ Create a new match
exports.createMatch = async (req, res) => {
  try {
    console.log('📥 Received match creation request:', req.body);
    
    const matchData = {
      title: req.body.title,
      game: req.body.game,
      matchType: req.body.matchType || 'match',
      type: req.body.type || 'Solo',
      map: req.body.map || 'Bermuda',
      total_prize: Number(req.body.total_prize) || Number(req.body.prizePool) || 0,
      perKill: Number(req.body.perKill) || 0,
      entry_fee: Number(req.body.entry_fee) || Number(req.body.entryFee) || 0,
      max_participants: Number(req.body.max_participants) || Number(req.body.maxPlayers) || 25,
      current_participants: 0,
      scheduleTime: req.body.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000),
      start_time: req.body.start_time || req.body.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000),
      end_time: req.body.end_time || new Date(Date.now() + 4 * 60 * 60 * 1000),
      roomId: req.body.roomId,
      room_code: req.body.room_code || req.body.roomId,
      password: req.body.password,
      room_password: req.body.room_password || req.body.password,
      description: req.body.description,
      rules: req.body.rules,
      status: req.body.status || 'upcoming',
      created_by: req.body.created_by || 'admin'
    };

    console.log('🔄 Processed match data:', matchData);

    if (!matchData.title || !matchData.game) {
      return res.status(400).json({
        success: false,
        message: 'Title and game are required fields'
      });
    }

    const match = new Match(matchData);
    await match.save();

    console.log('✅ Match created successfully:', match._id);
    res.status(201).json({ 
      success: true, 
      message: '✅ Match created successfully', 
      data: match 
    });
  } catch (error) {
    console.error('❌ Create Match Error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create match', 
      error: error.message 
    });
  }
};

// ✅ Get all matches with DB connection check
exports.getMatches = async (req, res) => {
  try {
    console.log('🔍 Checking DB connection status:', mongoose.connection.readyState);
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected',
        error: 'MongoDB connection lost'
      });
    }

    console.log('🔄 Fetching matches from database...');
    const matches = await Match.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${matches.length} matches`);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('❌ GetMatches Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
};

// ✅ Get match by ID
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    res.status(200).json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match',
      error: error.message
    });
  }
};

// ✅ Update match
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.status(200).json({ success: true, message: 'Match updated successfully', data: match });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to update match', error: error.message });
  }
};

// ✅ Delete match
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.status(200).json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete match', error: error.message });
  }
};

// ✅ Update match status
exports.updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.status(200).json({ success: true, message: 'Match status updated successfully', data: match });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to update match status', error: error.message });
  }
};
