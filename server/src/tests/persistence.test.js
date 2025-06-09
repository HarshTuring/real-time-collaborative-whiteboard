const mongoose = require('mongoose');
const persistenceService = require('../services/persistenceService');
const roomStore = require('../models/Room');
const MongoRoom = require('../models/mongodb/Room');

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/whiteboard_test';

describe('PersistenceService', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await MongoRoom.deleteMany({});
    // Clear in-memory room store
    const rooms = roomStore.getAllRooms();
    for (const [roomId] of rooms) {
      roomStore.deleteRoom(roomId);
    }
  });

  describe('initialize', () => {
    it('should connect to MongoDB and start sync intervals', async () => {
      const syncSpy = jest.spyOn(persistenceService, 'syncToDatabase');
      const cleanupSpy = jest.spyOn(persistenceService, 'cleanupOldRooms');

      await persistenceService.initialize({
        syncIntervalMs: 100,
        cleanupIntervalMs: 100
      });

      // Wait for intervals to trigger
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(syncSpy).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();

      // Clean up intervals
      clearInterval(persistenceService.syncInterval);
      clearInterval(persistenceService.cleanupInterval);
    });
  });

  describe('syncToDatabase', () => {
    it('should sync in-memory rooms to MongoDB', async () => {
      // Create a test room in memory
      const room = roomStore.createRoom('test-room', 'Test Room', false, 'test-user');
      room.messages = [{
        id: 'msg1',
        roomId: 'test-room',
        userId: 'user1',
        username: 'Test User',
        text: 'Hello',
        timestamp: Date.now(),
        type: 'user-message'
      }];

      // Sync to database
      await persistenceService.syncToDatabase();

      // Verify room was saved to MongoDB
      const savedRoom = await MongoRoom.findOne({ id: 'test-room' });
      expect(savedRoom).toBeTruthy();
      expect(savedRoom.name).toBe('Test Room');
      expect(savedRoom.messages).toHaveLength(1);
      expect(savedRoom.messages[0].text).toBe('Hello');
    });
  });

  describe('loadRoomsFromDatabase', () => {
    it('should load rooms from MongoDB into memory', async () => {
      // Create a test room in MongoDB
      await MongoRoom.create({
        id: 'db-room',
        name: 'DB Room',
        isPrivate: false,
        createdBy: 'test-user',
        messages: [{
          id: 'msg1',
          roomId: 'db-room',
          userId: 'user1',
          username: 'Test User',
          text: 'Hello from DB',
          timestamp: Date.now(),
          type: 'user-message'
        }]
      });

      // Load rooms from database
      await persistenceService.loadRoomsFromDatabase();

      // Verify room was loaded into memory
      const loadedRoom = roomStore.getRoom('db-room');
      expect(loadedRoom).toBeTruthy();
      expect(loadedRoom.name).toBe('DB Room');
      expect(loadedRoom.messages).toHaveLength(1);
      expect(loadedRoom.messages[0].text).toBe('Hello from DB');
    });
  });

  describe('cleanupOldRooms', () => {
    it('should delete rooms older than specified lifetime', async () => {
      // Create an old room in MongoDB
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours old
      
      await MongoRoom.create({
        id: 'old-room',
        name: 'Old Room',
        createdAt: oldDate
      });

      // Create a new room
      await MongoRoom.create({
        id: 'new-room',
        name: 'New Room',
        createdAt: new Date()
      });

      // Set room lifetime to 24 hours
      persistenceService.roomLifetimeHours = 24;

      // Run cleanup
      await persistenceService.cleanupOldRooms();

      // Verify old room was deleted but new room remains
      const oldRoom = await MongoRoom.findOne({ id: 'old-room' });
      const newRoom = await MongoRoom.findOne({ id: 'new-room' });
      
      expect(oldRoom).toBeNull();
      expect(newRoom).toBeTruthy();
    });
  });
}); 