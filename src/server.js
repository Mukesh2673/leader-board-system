require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const leaderboardRoutes = require('./routes/leaderboard');
const leaderboardService = require('./services/leaderboardService');
const seedService = require('./services/seedService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, specify your client URLs
    methods: ["GET", "POST"]
  }
});
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket Connection Handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join room based on region/gameMode for targeted updates
  socket.on('join-room', (data) => {
    const { region, gameMode } = data;
    const room = `${region}-${gameMode}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  socket.on('update-score', async (data) => {
    try {
      if (!data.playerId || !data.playerName || data.score === undefined) {
        socket.emit('error', { message: 'Invalid data provided' });
        return;
      }
const player = await leaderboardService.updatePlayerScore(data);
      
      const room = `${data.region}-${data.gameMode}`;
      io.to(room).emit('score-updated', {
        player,
        timestamp: new Date().toISOString()
      });
      
      // Get updated leaderboard for the room
      const leaderboard = await leaderboardService.getLeaderboard(
        10, 
        data.region, 
        data.gameMode
      );
      
      // Broadcast updated leaderboard to room
      io.to(room).emit('leaderboard-updated', {
        leaderboard,
        region: data.region,
        gameMode: data.gameMode,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Handle requesting current leaderboard
  socket.on('get-leaderboard', async (data) => {
    try {
      const { limit = 10, region, gameMode } = data;
      const leaderboard = await leaderboardService.getLeaderboard(
        limit, 
        region, 
        gameMode
      );

      socket.emit('leaderboard-data', {
        leaderboard,
        region,
        gameMode,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  socket.on('error', (data) => {
    console.error("Server error:", data.message);
    addLog(`Error: ${data.message}`, 'error');
});



  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // AUTO-SEED DATABASE IF EMPTY
  console.log('Checking if database needs seeding...');
  try {
    const seedResult = await seedService.seedDatabase();
    if (seedResult.seeded) {
      console.log('Sample data generated for all regions and game modes');
    } else {
      console.log('Database already contains data - skipping seed');
    }
  } catch (error) {
    console.log('⚠️  Server will continue without seed data');
  }
  
  // Start server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
        console.log(`API endpoints: http://localhost:${PORT}/api/leaderboard`);

  });
  
  // Setup daily reset (runs every 24 hours)
  setInterval(async () => {
    try {
      await leaderboardService.resetDailyScores();
      console.log('Daily reset completed');
    } catch (error) {
      console.error(' Daily reset failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
})
.catch((error) => {
  console.error(' MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});