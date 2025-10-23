// utils/gamesConfig.js - CENTRAL GAME DATABASE
export const gamesConfig = {
  // Battle Royale Games
  'free fire': {
    icon: '🔥',
    color: '#FF6B00',
    type: 'battle-royale',
    maxPlayers: 50,
    modes: ['Solo', 'Duo', 'Squad'],
    uidLength: 10
  },
  'pubg mobile': {
    icon: '🎯', 
    color: '#4CAF50',
    type: 'battle-royale',
    maxPlayers: 100,
    modes: ['Solo', 'Duo', 'Squad'],
    uidLength: 14
  },
  'bgmi': {
    icon: '📱',
    color: '#FF9800',
    type: 'battle-royale',
    maxPlayers: 100,
    modes: ['Solo', 'Duo', 'Squad'],
    uidLength: 14
  },
  'cod mobile': {
    icon: '🔫',
    color: '#2196F3',
    type: 'fps',
    maxPlayers: 10,
    modes: ['Team Deathmatch', 'Battle Royale', 'S&D'],
    uidLength: 12
  },
  
  // Strategy Games
  'ludo king': {
    icon: '🎲',
    color: '#9C27B0', 
    type: 'board',
    maxPlayers: 4,
    modes: ['Classic', 'Quick'],
    uidLength: 8
  },
  'clash royale': {
    icon: '👑',
    color: '#FFD700',
    type: 'strategy', 
    maxPlayers: 2,
    modes: ['1v1', '2v2'],
    uidLength: 9
  },
  
  // Sports Games
  '8 ball pool': {
    icon: '🎱',
    color: '#795548',
    type: 'sports',
    maxPlayers: 2,
    modes: ['1v1', 'Tournament'],
    uidLength: 10
  },
  
  // Coming Soon
  'chess': {
    icon: '♟️',
    color: '#607D8B',
    type: 'strategy',
    maxPlayers: 2,
    modes: ['Blitz', 'Rapid'],
    uidLength: 8,
    comingSoon: true
  }
};
