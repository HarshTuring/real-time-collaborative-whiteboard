const mongoose = require('mongoose');
const MongoRoom = require('../models/mongodb/Room');
const roomStore = require('../models/Room'); // Your existing room store

class PersistenceService {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
  }

  /**
   * Initialize the persistence service
   * @param {Object} options Configuration options
   */
  initialize(options = {}) {
    const {
      syncIntervalMs = 5 * 60 * 1000, // Default: sync every 5 minutes
      mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard'
    } = options;

    // Connect to MongoDB
    mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log('Connected to MongoDB for persistence');
      
      // Start periodic sync
      this.startPeriodicSync(syncIntervalMs);
      
      // Load existing rooms from MongoDB on startup
      this.loadRoomsFromDatabase();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
    });
  }

  /**
   * Start periodic synchronization
   * @param {number} intervalMs Interval in milliseconds
   */
  startPeriodicSync(intervalMs) {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Set up new sync interval
    this.syncInterval = setInterval(() => {
      this.syncToDatabase();
    }, intervalMs);

    console.log(`Persistence sync scheduled every ${intervalMs / 1000} seconds`);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync in-memory rooms to database
   */
  async syncToDatabase() {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    console.log('Starting sync to database...');

    try {
      const rooms = roomStore.getAllRooms();
      let syncCount = 0;
      
      // Iterate through Map entries
      for (const [roomId, room] of rooms.entries()) {
        // Prepare room data for MongoDB
        // Exclude real-time data like participants and drawingUsers
        const roomData = {
          id: room.id,
          name: room.name,
          isPrivate: room.isPrivate,
          createdBy: room.createdBy,
          createdAt: room.createdAt,
          _isLocked: room._isLocked,
          messages: room.messages, // Already an array
          canvasState: room.canvasState, // Already an array
          lastSyncedAt: new Date(),
          messageLimit: room.messageLimit
        };

        // Update or create the room in MongoDB
        await MongoRoom.findOneAndUpdate(
          { id: room.id },
          roomData,
          { upsert: true, new: true }
        );
        
        syncCount++;
      }

      console.log(`Synced ${syncCount} rooms to database`);
    } catch (error) {
      console.error('Error syncing to database:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Load rooms from MongoDB into in-memory storage on server start
   */
  async loadRoomsFromDatabase() {
    try {
      console.log('Loading rooms from database...');
      
      // Get all rooms from MongoDB
      const mongoRooms = await MongoRoom.find({});
      
      let restoredCount = 0;
      
      for (const mongoRoom of mongoRooms) {
        try {
          // Check if room already exists in memory
          if (roomStore.roomExists(mongoRoom.id)) {
            console.log(`Room ${mongoRoom.id} already exists in memory, skipping`);
            continue;
          }
          
          // Create the room in memory
          const room = roomStore.createRoom(
            mongoRoom.id,
            mongoRoom.name,
            mongoRoom.isPrivate,
            mongoRoom.createdBy
          );
          
          // Restore persistent data
          room._isLocked = mongoRoom._isLocked;
          room.messages = mongoRoom.messages || [];
          room.canvasState = mongoRoom.canvasState || [];
          room.messageLimit = mongoRoom.messageLimit || 100;
          room.createdAt = mongoRoom.createdAt;
          
          restoredCount++;
        } catch (err) {
          console.error(`Error restoring room ${mongoRoom.id}:`, err);
        }
      }
      
      console.log(`Restored ${restoredCount} rooms from database`);
    } catch (error) {
      console.error('Error loading rooms from database:', error);
    }
  }
}

// Create singleton instance
const persistenceService = new PersistenceService();

module.exports = persistenceService;