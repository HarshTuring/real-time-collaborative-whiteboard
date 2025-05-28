class Room {
    constructor(id, name = null, isPrivate = false, createdBy = null) {
        this.id = id;
        this.name = name || `Room ${id.substring(0, 6)}`;
        this.isPrivate = isPrivate;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.participants = new Set(); // Store active participants
        this.canvasState = []; // Store the current canvas state
    }

    // Add a participant to the room
    addParticipant(participantId) {
        this.participants.add(participantId);
        return this.getParticipantCount();
    }

    // Remove a participant from the room
    removeParticipant(participantId) {
        this.participants.delete(participantId);
        return this.getParticipantCount();
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
    updateCanvasState(canvasData) {
        this.canvasState = canvasData;
    }

    // Add a drawing to the canvas state
    addDrawing(drawingData) {
        this.canvasState.push(drawingData);
    }

    // Get room details (for API responses)
    getDetails(includeParticipants = false) {
        const details = {
            id: this.id,
            name: this.name,
            isPrivate: this.isPrivate,
            participantCount: this.participants.size,
            createdAt: this.createdAt
        };

        if (includeParticipants) {
            details.participants = Array.from(this.participants);
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