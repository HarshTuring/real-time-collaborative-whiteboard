const mongoose = require('mongoose');

// Message schema for chat history
// Based on the actual message format from addSystemMessage and similar methods
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  roomId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, required: true },
  type: { type: String, enum: ['user-message', 'system-notification'], required: true }
}, { _id: false });

// Canvas element schema - simplified as per your clarification
const canvasElementSchema = new mongoose.Schema({
  points: { type: Array, required: true },
  color: { type: String, required: true, default: '#000000' },
  width: { type: Number, required: true, default: 3 }
}, { _id: false });

// Main Room schema
const roomSchema = new mongoose.Schema({
  // Basic room information
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  createdBy: { type: String }, // Creator's user ID
  createdAt: { type: Date, default: Date.now },
  
  // Room state
  _isLocked: { type: Boolean, default: false },
  
  // Persistent data
  messages: [messageSchema],
  canvasState: [canvasElementSchema],
  
  // Metadata
  lastSyncedAt: { type: Date, default: Date.now },
  messageLimit: { type: Number, default: 100 }
}, { 
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create indexes for common queries
roomSchema.index({ isPrivate: 1, createdAt: -1 }); // For listing public rooms

module.exports = mongoose.model('Room', roomSchema);