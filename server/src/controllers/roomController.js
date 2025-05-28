const roomStore = require('../models/Room');
const { generateRoomId, generateRoomName } = require('../utils/idGenerator');

// Create a new room
const createRoom = (req, res) => {
    try {
        const { name, isPrivate } = req.body;
        const createdBy = req.body.userId || 'anonymous';

        // Generate a unique room ID
        const roomId = generateRoomId();

        // Use provided name or generate one
        const roomName = name || generateRoomName();

        // Create the room
        const room = roomStore.createRoom(roomId, roomName, !!isPrivate, createdBy);

        return res.status(201).json({
            success: true,
            room: room.getDetails()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: error.message
        });
    }
};

// Get all public rooms
const getPublicRooms = (req, res) => {
    try {
        const rooms = roomStore.getPublicRooms();

        return res.status(200).json({
            success: true,
            count: rooms.length,
            rooms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch rooms',
            error: error.message
        });
    }
};

// Get room details
const getRoomDetails = (req, res) => {
    try {
        const { roomId } = req.params;
        const room = roomStore.getRoom(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        return res.status(200).json({
            success: true,
            room: room.getDetails(true)  // Include participants
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get room details',
            error: error.message
        });
    }
};

// Update room name
const updateRoomName = (req, res) => {
    try {
        const { roomId } = req.params;
        const { name } = req.body;

        const room = roomStore.getRoom(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const updated = room.updateName(name);

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room name'
            });
        }

        return res.status(200).json({
            success: true,
            room: room.getDetails()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update room name',
            error: error.message
        });
    }
};

// Toggle room visibility (public/private)
const toggleRoomVisibility = (req, res) => {
    try {
        const { roomId } = req.params;

        const room = roomStore.getRoom(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const isPrivate = room.toggleVisibility();

        return res.status(200).json({
            success: true,
            room: room.getDetails(),
            message: `Room is now ${isPrivate ? 'private' : 'public'}`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle room visibility',
            error: error.message
        });
    }
};

// Delete a room (optional)
const deleteRoom = (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomStore.roomExists(roomId)) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        roomStore.deleteRoom(roomId);

        return res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: error.message
        });
    }
};

// Check if room exists and if it's joinable
const checkRoomAccess = (req, res) => {
    try {
        const { roomId } = req.params;
        const room = roomStore.getRoom(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        return res.status(200).json({
            success: true,
            room: {
                id: room.id,
                name: room.name,
                isPrivate: room.isPrivate,
                participantCount: room.participants.size
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to check room access',
            error: error.message
        });
    }
};

module.exports = {
    createRoom,
    getPublicRooms,
    getRoomDetails,
    updateRoomName,
    toggleRoomVisibility,
    deleteRoom,
    checkRoomAccess
};