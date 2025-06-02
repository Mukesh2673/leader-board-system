const Player = require('../models/Player');

class SeedService {
  getSamplePlayers() {
    const regions = ['NA', 'EU', 'ASIA', 'SA'];
    const gameModes = ['classic', 'blitz', 'tournament'];
    const playerNames = [
      'DragonSlayer', 'NightHawk', 'ThunderBolt', 'ShadowMaster', 'FireStorm',
      'IceQueen', 'StormRider', 'DarkKnight', 'LightBringer', 'WindWalker',
      'EarthShaker', 'WaveBreaker', 'SkyHunter', 'VoidWalker', 'StarGazer',
      'MoonDancer', 'SunWarrior', 'RainMaker', 'SnowFall', 'BlazeFury',
      'CrimsonEdge', 'GoldenArrow', 'SilverBlade', 'BronzeShield', 'IronFist',
      'SteelHeart', 'DiamondEye', 'CrystalSoul', 'RubyRose', 'EmeraldWing'
    ];

    const players = [];
    let playerIdCounter = 1;

    regions.forEach(region => {
      gameModes.forEach(gameMode => {
        const playersCount = Math.floor(Math.random() * 6) + 10; 
        
        for (let i = 0; i < playersCount; i++) {
          const randomName = playerNames[Math.floor(Math.random() * playerNames.length)];
          const randomSuffix = Math.floor(Math.random() * 999) + 1;
          
          players.push({
            playerId: `player_${playerIdCounter++}`,
            playerName: `${randomName}${randomSuffix}`,
            score: Math.floor(Math.random() * 5000) + 100, 
            region: region,
            gameMode: gameMode,
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last 7 days
            dailyResetDate: new Date()
          });
        }
      });
    });

    return players;
  }

  async isDatabaseEmpty() {
    try {
      const count = await Player.countDocuments();
      return count === 0;
    } catch (error) {
      console.error('Error checking database:', error);
      return false;
    }
  }

  async seedDatabase() {
    try {
      const isEmpty = await this.isDatabaseEmpty();
      
      if (!isEmpty) {
        console.log('Database already has data. Skipping seed...');
        return { message: 'Database already contains data', seeded: false };
      }

      console.log('Database is empty. Starting seed process...');
      
      const samplePlayers = this.getSamplePlayers();
      
      const insertedPlayers = await Player.insertMany(samplePlayers);
      
      console.log(`✅ Successfully seeded database with ${insertedPlayers.length} players`);
      
      const summary = await this.getSeedSummary();
      console.log('📊 Seed Summary:');
      console.table(summary);
      
      return { 
        message: 'Database seeded successfully', 
        count: insertedPlayers.length,
        seeded: true,
        summary 
      };
      
    } catch (error) {
      throw new Error(`Seeding failed: ${error.message}`);
    }
  }

  async getSeedSummary() {
    try {
      const pipeline = [
        {
          $group: {
            _id: { region: '$region', gameMode: '$gameMode' },
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
            maxScore: { $max: '$score' },
            minScore: { $min: '$score' }
          }
        },
        {
          $sort: { '_id.region': 1, '_id.gameMode': 1 }
        }
      ];

      const results = await Player.aggregate(pipeline);
      
      return results.map(result => ({
        Region: result._id.region,
        GameMode: result._id.gameMode,
        Players: result.count,
        AvgScore: Math.round(result.avgScore),
        MaxScore: result.maxScore,
        MinScore: result.minScore
      }));
      
    } catch (error) {
      console.error('Error getting seed summary:', error);
      return [];
    }
  }

  async forceReseed() {
    try {
            await Player.deleteMany({});
      
      const result = await this.seedDatabase();
      
      return result;
      
    } catch (error) {
      throw new Error(`Force reseed failed: ${error.message}`);
    }
  }

  // Add more realistic score distribution
  generateRealisticScore() {

    
    const rand = Math.random();
    
    if (rand < 0.7) {
      return Math.floor(Math.random() * 1500) + 500; // 500-2000
    } else if (rand < 0.95) {
      return Math.floor(Math.random() * 2000) + 2000; // 2000-4000
    } else {
      return Math.floor(Math.random() * 1000) + 4000; // 4000-5000
    }
  }
}

module.exports = new SeedService();