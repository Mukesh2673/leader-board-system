const validatePlayerUpdate = (req, res, next) => {
  const { playerId, playerName, score, region, gameMode } = req.body;
  
  // Check required fields
  if (!playerId || !playerName || score === undefined || !region || !gameMode) {
    return res.status(400).json({
      error: 'Missing required fields: playerId, playerName, score, region, gameMode'
    });
  }
  
  // Validate score
  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({
      error: 'Score must be a non-negative number'
    });
  }
  
  // Validate region
  const validRegions = ['NA', 'EU', 'ASIA', 'SA'];
  if (!validRegions.includes(region)) {
    return res.status(400).json({
      error: `Region must be one of: ${validRegions.join(', ')}`
    });
  }
  
  // Validate game mode
  const validGameModes = ['classic', 'blitz', 'tournament'];
  if (!validGameModes.includes(gameMode)) {
    return res.status(400).json({
      error: `Game mode must be one of: ${validGameModes.join(', ')}`
    });
  }
  
  next();
};

module.exports = { validatePlayerUpdate };