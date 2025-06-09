require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require("./routes/userRoutes")
const { initializeSocketIO } = require('./services/socketService');
const cookieParser = require("cookie-parser")
const persistenceService = require('./services/persistenceService');

// Create Express app
const app = express();

// Initialize persistence service with periodic sync and cleanup
persistenceService.initialize({
    syncIntervalMs: process.env.SYNC_INTERVAL_MS || 3000, // 3 seconds default
    cleanupIntervalMs: process.env.CLEANUP_INTERVAL_MS || 60 * 60 * 1000, // 1 hour default
    roomLifetimeHours: process.env.ROOM_LIFETIME_HOURS || 24, // 24 hours default
    mongoUri: process.env.MONGODB_URI
});

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/rooms', roomRoutes);

app.use('/api/user', userRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {  
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  cookie: true
});

// Setup Socket.IO handlers
initializeSocketIO(io);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});