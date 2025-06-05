class Room {
    constructor(id, name = null, isPrivate = false, createdBy = null) {
        this.id = id;
        this.name = name || `Room ${id.substring(0, 6)}`;
        this.isPrivate = isPrivate;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.participants = new Map(); // Key: userId, Value: { username, socketId }
        this.canvasState = []; // Store the current canvas state
        this.drawingUsers = new Map(); // Store users who are currently drawing
        this.messages = []; // Array to store recent messages
        this.messageLimit = 100;
        this._isLocked = false;
    }

    isAdmin(userId) {
        // Compare the provided userId with the createdBy property
        return this.createdBy === userId;
    }

    toggleLock() {
        // Toggle the isLocked property
        this._isLocked = !this._isLocked;
        
        // Return the new lock state
        return this._isLocked;
    }

    isLocked() {
        return this._isLocked;
    }

    // Add a participant to the room with username
    addParticipant(userId, username = 'Anonymous', socketId) {
        this.participants.set(userId, {
            username: username || `User ${userId.substring(0, 6)}`,
            socketId: socketId
        });
        return this.getParticipantCount();
    }

    // Remove a participant from the room
    removeParticipant(userId) {
        this.participants.delete(userId);
        return this.getParticipantCount();
    }

    // Update a participant's username
    updateParticipantUsername(userId, username) {
        const participant = this.participants.get(userId);
        if (participant) {
            participant.username = username;
            return true;
        }
        return false;
    }

    updateParticipantSocketId(userId, socketId) {
        const participant = this.participants.get(userId);
        if (participant) {
            participant.socketId = socketId;
            return true;
        }
        return false;
    }
    
    getParticipantSocketId(userId) {
        const participant = this.participants.get(userId);
        return participant ? participant.socketId : null;
    }

    getParticipantsArray() {
        return Array.from(this.participants.entries()).map(([userId, data]) => ({
            id: userId,
            username: data.username,
            socketId: data.socketId
        }));
    }

    // Check if a user is a participant in this room
    hasParticipant(userId) {
        return this.participants.has(userId);
    }

    addMessage(message) {
        this.messages.push(message);
        
        // Keep only the most recent messages
        if (this.messages.length > this.messageLimit) {
            this.messages = this.messages.slice(-this.messageLimit);
        }
        
        return message;
    }
    
    // Get recent messages
    getRecentMessages() {
        return this.messages;
    }
    
    // Create and add a system message
    addSystemMessage(text) {
        const systemMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            roomId: this.id,
            userId: 'system',
            username: 'System',
            text,
            timestamp: Date.now(),
            type: 'system-notification'
        };
        
        return this.addMessage(systemMessage);
    }

    updateUserDrawingStatus(userId, isDrawing, color = null) {
        if (isDrawing) {
            this.drawingUsers.set(userId, { color });
        } else {
            this.drawingUsers.delete(userId);
        }
    }

    isUserDrawing(userId) {
        return this.drawingUsers.has(userId);
    }

    getUserDrawingColor(userId) {
        const drawingInfo = this.drawingUsers.get(userId);
        return drawingInfo ? drawingInfo.color : null;
    }

    // Get number of participants
    getParticipantCount() {
        return this.participants.size;
    }

    // Update room name
    updateName(name) {
        if (!name || name.trim() === '') return false;
        this.name = name.trim();
        return true;
    }

    // Toggle room visibility (public/private)
    toggleVisibility() {
        this.isPrivate = !this.isPrivate;
        return this.isPrivate;
    }

    // Update canvas state
    updateCanvasState(canvasData, userId = null) {
        // If room is locked, prevent all updates
        if (this._isLocked) {
            return false;
        }
        this.canvasState = canvasData;
        return true;
    }

    // Add a drawing to the canvas state
    addDrawing(lineData) {
        // If lineData has points array and color/width properties
        if (lineData && (lineData.points || Array.isArray(lineData))) {
            // Normalize the format to ensure it includes width
            const normalizedLineData = {};

            // Handle points
            if (Array.isArray(lineData)) {
                normalizedLineData.points = lineData;
            } else if (lineData.points && Array.isArray(lineData.points)) {
                normalizedLineData.points = lineData.points;
            }

            // Handle color and width
            normalizedLineData.color = lineData.color || '#000000';
            normalizedLineData.width = lineData.width || 3;

            // Now store the normalized data
            this.canvasState.push(normalizedLineData);
        }
    }

    // Get room details (for API responses)
    getDetails(includeParticipants = false) {
        const details = {
            id: this.id,
            name: this.name,
            isPrivate: this.isPrivate,
            participantCount: this.participants.size,
            createdAt: this.createdAt,
            isLocked: this._isLocked
        };

        if (includeParticipants) {
            // Convert Map to array of objects with id and username
            details.participants = Array.from(this.participants.entries()).map(([id, data]) => ({
                id,
                username: data.username,
                drawingColor: this.getUserDrawingColor(id),
                isAdmin: this.isAdmin(id)
            }));
        }

        return details;
    }
}

// In-memory store for rooms
class RoomStore {
    constructor() {
        this.rooms = new Map();
    }

    // Create a new room
    createRoom(id, name, isPrivate, createdBy) {
        const room = new Room(id, name, isPrivate, createdBy);
        this.rooms.set(id, room);
        return room;
    }

    // Get a room by ID
    getRoom(id) {
        return this.rooms.get(id) || null;
    }

    // Delete a room
    deleteRoom(id) {
        return this.rooms.delete(id);
    }

    // Get all public rooms
    getPublicRooms() {
        return Array.from(this.rooms.values())
            .filter(room => !room.isPrivate)
            .map(room => room.getDetails());
    }

    // Check if a room exists
    roomExists(id) {
        return this.rooms.has(id);
    }
}

// Create and export the room store singleton
const roomStore = new RoomStore();
module.exports = roomStore;