// utils/resultCalculator.js - COMPLETE AUTO CALCULATION
class ResultCalculator {
  
  // ✅ Calculate player score (kills + damage + rank points)
  static calculatePlayerScore(playerResult, eventType) {
    const killPoints = playerResult.kills * 10; // 10 points per kill
    const damagePoints = playerResult.damage * 0.1; // 0.1 points per damage
    const rankPoints = this.getRankPoints(playerResult.rank, eventType);
    
    return killPoints + damagePoints + rankPoints;
  }
  
  // ✅ Rank based points (higher rank = more points)
  static getRankPoints(rank, eventType) {
    const maxRank = eventType === 'solo' ? 100 : 25;
    return Math.max(0, (maxRank - rank) * 5);
  }
  
  // ✅ Auto calculate winners from results
  static calculateWinners(results, prizePool, eventType) {
    if (!results || results.length === 0) return [];
    
    // Calculate scores for all players
    const playersWithScores = results.map(result => ({
      ...result,
      totalScore: this.calculatePlayerScore(result, eventType)
    }));
    
    // Sort by total score (descending)
    const sortedPlayers = playersWithScores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign ranks
    const rankedPlayers = sortedPlayers.map((player, index) => ({
      ...player,
      calculatedRank: index + 1
    }));
    
    // Calculate prize distribution
    return this.distributePrizes(rankedPlayers, prizePool, eventType);
  }
  
  // ✅ Distribute prizes based on rank and event type
  static distributePrizes(rankedPlayers, prizePool, eventType) {
    const distributionRules = {
      solo: { 1: 0.50, 2: 0.30, 3: 0.20 },
      duo: { 1: 0.60, 2: 0.40 },
      squad: { 1: 0.40, 2: 0.30, 3: 0.20, 4: 0.10 },
      default: { 1: 0.50, 2: 0.30, 3: 0.20 }
    };
    
    const rules = distributionRules[eventType] || distributionRules.default;
    const winners = [];
    
    Object.keys(rules).forEach(rank => {
      const player = rankedPlayers[rank - 1];
      if (player) {
        winners.push({
          rank: parseInt(rank),
          playerId: player.playerId,
          playerName: player.playerName,
          teamName: player.teamName,
          kills: player.kills,
          damage: player.damage,
          totalScore: player.totalScore,
          prizeAmount: Math.round(prizePool * rules[rank])
        });
      }
    });
    
    return winners;
  }
}

module.exports = ResultCalculator;
