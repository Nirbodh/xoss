// controllers/matchController.js - COMPLETELY FIXED VERSION
const Match = require('../models/Match');
const mongoose = require('mongoose');

// ✅ UNIFIED DATA MAPPING FUNCTION
const mapMatchData = (reqBody) => ({
  // Basic info
  title: reqBody.title,
  game: reqBody.game,
  description: reqBody.description || '',
  rules: reqBody.rules || '',
  
  // Financial - Consistent backend fields
  entry_fee: Number(reqBody.entry_fee) || Number(reqBody.entryFee) || 0,
  total_prize: Number(reqBody.total_prize) || Number(reqBody.prizePool) || 0,
  per_kill: Number(reqBody.per_kill) || Number(reqBody.perKill) || 0,
  
  // Participants - Consistent backend fields
  max_participants: Number(reqBody.max_participants) || Number(reqBody.maxPlayers) || 25,
  current_participants: Number(reqBody.current_participants) || Number(reqBody.currentPlayers) || 0,
  
  // Game settings
  type: reqBody.type || 'Solo',
  map: reqBody.map || 'Bermuda',
  match_type: reqBody.match_type || reqBody.matchType || 'match',
  
  // Room info
  room_id: reqBody.room_id || reqBody.roomId || reqBody.room_code || '',
  room_password: reqBody.room_password || reqBody.password || reqBody.room_password || '',
  
  // Timing
  start_time: new Date(reqBody.start_time || reqBody.startTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
  end_time: new Date(reqBody.end_time || reqBody.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000)),
  schedule_time: new Date(reqBody.schedule_time || reqBody.scheduleTime || new Date(Date.now() + 2 * 60 * 60 * 1000)),
  
  // Status
  status: reqBody.status || 'upcoming',
  approval_status: reqBody.approval_status || reqBody.approvalStatus || 'pending',
  created_by: reqBody.created_by
});

// ✅ Create a new match
exports.createMatch = async (req, res) => {
  try {
    console.log('📥 Received match creation request:', req.body);
    
    const matchData = mapMatchData(req.body);
    
    // Add user info if available
    if (req.user && req.user.userId) {
      matchData.created_by = req.user.userId;
    }

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

// ✅ FIXED: GET ALL MATCHES - NO FILTERS FOR ADMIN
exports.getMatches = async (req, res) => {
  try {
    console.log('🔍 matchController: Fetching matches...');
    console.log('👤 User Info:', {
      userId: req.user?.userId,
      role: req.user?.role,
      email: req.user?.email
    });
    
    // Extract query parameters
    const { 
      limit = 100, 
      page = 1, 
      status,
      game,
      search 
    } = req.query;

    // ✅ CRITICAL FIX: NO FILTERS - GET EVERYTHING
    // This matches.js-এর মতোই behavior
    let filter = {};
    
    console.log('🔄 matchController: NO FILTERS APPLIED - Getting ALL matches');
    
    // Only apply additional filters if specifically requested
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (game && game !== 'all') {
      filter.game = game;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    console.log('📊 Final filter:', filter);

    // Get matches with filters and pagination
    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination info
    const totalMatches = await Match.countDocuments(filter);

    console.log(`✅ matchController: Found ${matches.length} matches out of ${totalMatches} total`);

    // Debug: Log all match statuses
    matches.forEach(match => {
      console.log(`📋 ${match.title} - Status: ${match.status}, Approval: ${match.approval_status}`);
    });

    res.status(200).json({
      success: true,
      count: matches.length,
      total: totalMatches,
      page: pageNumber,
      pages: Math.ceil(totalMatches / pageSize),
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
    const match = await Match.findById(req.params.id)
      .populate('created_by', 'username');
      
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
    console.log('🔄 Updating match:', req.params.id, req.body);
    
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    console.log('✅ Match updated successfully:', match._id);
    res.status(200).json({ 
      success: true, 
      message: 'Match updated successfully', 
      data: match 
    });
  } catch (error) {
    console.error('❌ Update match error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to update match', 
      error: error.message 
    });
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

// ✅ DEBUG: Get collection info
exports.debugCollections = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 All collections:', collections.map(c => c.name));
    
    // Count documents in each collection
    const collectionsToCheck = ['matches', 'tournaments', 'match', 'tournament', 'games'];
    const counts = {};
    
    for (const collectionName of collectionsToCheck) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        counts[collectionName] = count;
        console.log(`📊 ${collectionName} count: ${count}`);
      } catch (err) {
        counts[collectionName] = 'Collection does not exist';
      }
    }
    
    // Also count from Match model
    const matchModelCount = await Match.countDocuments();
    counts.matchModel = matchModelCount;
    
    // Get all matches with details
    const allMatches = await Match.find({});
    
    res.status(200).json({
      success: true,
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      counts: counts,
      allMatches: allMatches.map(m => ({
        id: m._id,
        title: m.title,
        status: m.status,
        approval_status: m.approval_status,
        game: m.game,
        match_type: m.match_type
      }))
    });
  } catch (error) {
    console.error('❌ Debug Error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

// ✅ ADDED: Get matches with different filters for testing
exports.getMatchesByFilter = async (req, res) => {
  try {
    const { filterType = 'all' } = req.params;
    
    let filter = {};
    
    switch(filterType) {
      case 'all':
        // No filter - get everything
        break;
      case 'approved':
        filter.approval_status = 'approved';
        break;
      case 'pending':
        filter.approval_status = 'pending';
        break;
      case 'upcoming':
        filter.status = 'upcoming';
        break;
      case 'completed':
        filter.status = 'completed';
        break;
      default:
        filter = {};
    }
    
    const matches = await Match.find(filter)
      .populate('created_by', 'username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      filterType,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('❌ GetMatchesByFilter Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filtered matches',
      error: error.message
    });
  }
};
