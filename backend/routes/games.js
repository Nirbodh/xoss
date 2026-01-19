const express = require('express');
const router = express.Router();

// Supported games list
const SUPPORTED_GAMES = [
  {
    id: 'freefire',
    name: 'Free Fire',
    icon: '🔥',
    description: 'Battle Royale mobile game',
    max_players: 50,
    modes: ['Solo', 'Duo', 'Squad'],
    popularity: 95
  },
  {
    id: 'pubgm',
    name: 'PUBG Mobile',
    icon: '🎮',
    description: 'PlayerUnknown\'s Battlegrounds Mobile',
    max_players: 100,
    modes: ['Solo', 'Duo', 'Squad'],
    popularity: 90
  },
  {
    id: 'codm',
    name: 'COD Mobile',
    icon: '⚔️',
    description: 'Call of Duty Mobile',
    max_players: 10,
    modes: ['Multiplayer', 'Battle Royale', 'Zombies'],
    popularity: 85
  },
  {
    id: 'bgmi',
    name: 'BGMI',
    icon: '🇮🇳',
    description: 'Battlegrounds Mobile India',
    max_players: 100,
    modes: ['Solo', 'Duo', 'Squad'],
    popularity: 88
  },
  {
    id: 'valorant',
    name: 'Valorant',
    icon: '🎯',
    description: 'Tactical shooter game',
    max_players: 10,
    modes: ['Unrated', 'Competitive', 'Spike Rush'],
    popularity: 92
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    icon: '🏰',
    description: 'Battle Royale with building mechanics',
    max_players: 100,
    modes: ['Solo', 'Duo', 'Squad', 'Creative'],
    popularity: 87
  }
];

// Get all games
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      code: 'GAMES_FETCHED',
      message: 'Games list fetched successfully',
      data: SUPPORTED_GAMES,
      count: SUPPORTED_GAMES.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch games list',
      timestamp: new Date().toISOString()
    });
  }
});

// Get game by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const game = SUPPORTED_GAMES.find(g => g.id === id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      code: 'GAME_FETCHED',
      message: 'Game details fetched successfully',
      data: game,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch game details',
      timestamp: new Date().toISOString()
    });
  }
});

// Get popular games
router.get('/popular/top', (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const popularGames = [...SUPPORTED_GAMES]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      code: 'POPULAR_GAMES_FETCHED',
      message: 'Popular games fetched successfully',
      data: popularGames,
      count: popularGames.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch popular games',
      timestamp: new Date().toISOString()
    });
  }
});

// Search games
router.get('/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = query.toLowerCase();
    
    const results = SUPPORTED_GAMES.filter(game => 
      game.name.toLowerCase().includes(searchTerm) ||
      game.description.toLowerCase().includes(searchTerm)
    );
    
    res.json({
      success: true,
      code: 'SEARCH_COMPLETED',
      message: 'Games search completed',
      data: results,
      count: results.length,
      search_query: query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SEARCH_ERROR',
      message: 'Failed to search games',
      timestamp: new Date().toISOString()
    });
  }
});

// Get game statistics
router.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const game = SUPPORTED_GAMES.find(g => g.id === id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Mock statistics
    const stats = {
      total_matches: Math.floor(Math.random() * 1000) + 500,
      active_players: Math.floor(Math.random() * 10000) + 5000,
      total_prize_pool: Math.floor(Math.random() * 50000) + 10000,
      upcoming_matches: Math.floor(Math.random() * 50) + 10,
      completed_matches: Math.floor(Math.random() * 800) + 200,
      average_players_per_match: Math.floor(Math.random() * 20) + 10
    };
    
    res.json({
      success: true,
      code: 'STATS_FETCHED',
      message: 'Game statistics fetched successfully',
      data: {
        game_info: game,
        statistics: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'STATS_ERROR',
      message: 'Failed to fetch game statistics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
