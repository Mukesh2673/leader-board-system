const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  region: {
    type: String,
    required: true,
    enum: ['NA', 'EU', 'ASIA', 'SA'], // North America, Europe, Asia, South America
    index: true
  },
  gameMode: {
    type: String,
    required: true,
    enum: ['classic', 'blitz', 'tournament'],
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dailyResetDate: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL: 24 hours in seconds
  }
}, {
  timestamps: true
});

// Compound index for efficient leaderboard queries
playerSchema.index({ region: 1, gameMode: 1, score: -1 });
playerSchema.index({ score: -1 }); // Global leaderboard index

module.exports = mongoose.model('Player', playerSchema);