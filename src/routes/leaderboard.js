const express = require('express');
const router = express.Router();
const leaderboardService = require('../services/leaderboardService');
const { validatePlayerUpdate } = require('../middleware/validation');
const seedService = require('../services/seedService');

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { limit = 10, region, gameMode } = req.query;
    
    const leaderboard = await leaderboardService.getLeaderboard(
      parseInt(limit), 
      region, 
      gameMode
    );
    
    res.json({
      success: true,
      data: leaderboard,
      count: leaderboard.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update player score
router.post('/update', validatePlayerUpdate, async (req, res) => {
  try {
    const player = await leaderboardService.updatePlayerScore(req.body);
    
    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get player rank
router.get('/rank/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { region, gameMode } = req.query;
    
    const result = await leaderboardService.getPlayerRank(playerId, region, gameMode);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Seed database endpoint
router.post('/seed', async (req, res) => {
  try {
    const result = await seedService.seedDatabase();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Force reseed endpoint
router.post('/seed/force', async (req, res) => {
  try {
    const result = await seedService.forceReseed();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Get seed summary
router.get('/seed/summary', async (req, res) => {
  try {
    const summary = await seedService.getSeedSummary();
    const totalPlayers = await Player.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalPlayers,
        breakdown: summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;