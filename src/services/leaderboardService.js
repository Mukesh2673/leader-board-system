const Player = require('../models/Player');

class LeaderboardService {
  async updatePlayerScore(playerData) {
    const { playerId, playerName, score, region, gameMode } = playerData;
    try {
      let player = await Player.findOne({ playerId });
      
      if (player) {
        if (score > player.score) {
          player.score = score;
          player.lastUpdated = new Date();
          await player.save();
        }
      } else {
        player = new Player({
          playerId,
          playerName,
          score,
          region,
          gameMode,
          dailyResetDate: new Date()
        });
        await player.save();
      }
      
      return player;
    } catch (error) {
      throw new Error(`Failed to update player score: ${error.message}`);
    }
  }

  // Get top N players globally or by filters
  async getLeaderboard(limit = 10, region = null, gameMode = null) {
    try {
      let query = {};
      if (region) query.region = region;
      if (gameMode) query.gameMode = gameMode;

      console.group("queryisfddsfdsf",query)
      
      const players = await Player.find(query)
        .sort({ score: -1 })
        .limit(limit)
        .select('playerId playerName score region gameMode lastUpdated');
      
      return players;
    } catch (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }
  }

  // Get player's current rank
  async getPlayerRank(playerId, region = null, gameMode = null) {
    try {
      const player = await Player.findOne({ playerId });
      if (!player) return null;
      
      let query = { score: { $gt: player.score } };
      if (region) query.region = region;
      if (gameMode) query.gameMode = gameMode;
      
      const playersAbove = await Player.countDocuments(query);
      
      return {
        player,
        rank: playersAbove + 1
      };
    } catch (error) {
      throw new Error(`Failed to get player rank: ${error.message}`);
    }
  }

  // Daily reset logic
  async resetDailyScores() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await Player.deleteMany({
        dailyResetDate: { $lt: oneDayAgo }
      });
      
      console.log(`Reset completed: ${result.deletedCount} players removed`);
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Failed to reset daily scores: ${error.message}`);
    }
  }
}

module.exports = new LeaderboardService();