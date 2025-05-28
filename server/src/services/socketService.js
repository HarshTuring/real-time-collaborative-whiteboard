const roomStore = require('../models/Room');

// Initialize Socket.IO with the HTTP server
function initializeSocketIO(io) {
    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // When a user creates or joins a room
        socket.on('join-room', ({ roomId, userId }) => {
            try {
                // Check if room exists
                let room = roomStore.getRoom(roomId);

                // If room doesn't exist, create it (this is a fallback, normally rooms are created via API)
                if (!room) {
                    room = roomStore.createRoom(roomId, null, false, userId);
                    console.log(`Room ${roomId} created automatically by user ${userId || socket.id}`);
                }

                // Add user to the room
                socket.join(roomId);
                room.addParticipant(userId || socket.id);

                console.log(`User ${userId || socket.id} joined room ${roomId}`);

                // Send existing canvas state to the new user
                socket.emit('canvas-state', room.canvasState);

                // Notify all users in the room about the new participant
                io.to(roomId).emit('participant-joined', {
                    userId: userId || socket.id,
                    count: room.getParticipantCount()
                });

                // Notify about room update
                io.to(roomId).emit('room-updated', room.getDetails());
            } catch (error) {
                console.error(`Error joining room: ${error.message}`);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // When a user draws on the canvas
        socket.on('draw-line', ({ roomId, line }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Store the drawing data
                    room.addDrawing(line);

                    // Broadcast to all other users in the room
                    socket.to(roomId).emit('draw-line', line);
                }
            } catch (error) {
                console.error(`Error in draw-line: ${error.message}`);
            }
        });

        // When a user sends a complete canvas state update
        socket.on('update-canvas-state', ({ roomId, canvasState }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    room.updateCanvasState(canvasState);
                    socket.to(roomId).emit('canvas-state', canvasState);
                }
            } catch (error) {
                console.error(`Error updating canvas state: ${error.message}`);
            }
        });

        // When a user leaves a room explicitly
        socket.on('leave-room', ({ roomId, userId }) => {
            handleUserLeavingRoom(socket, roomId, userId || socket.id);
        });

        // Handle room name updates
        socket.on('update-room-name', ({ roomId, name }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room && name) {
                    room.updateName(name);
                    io.to(roomId).emit('room-updated', room.getDetails());
                }
            } catch (error) {
                console.error(`Error updating room name: ${error.message}`);
            }
        });

        // Handle room visibility toggle
        socket.on('toggle-room-visibility', ({ roomId }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    room.toggleVisibility();
                    io.to(roomId).emit('room-updated', room.getDetails());
                }
            } catch (error) {
                console.error(`Error toggling room visibility: ${error.message}`);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);

            // Check all rooms to see if this user is a participant
            // In a real application with authentication, you'd use a userId instead
            roomStore.rooms.forEach((room, roomId) => {
                if (room.participants.has(socket.id)) {
                    handleUserLeavingRoom(socket, roomId, socket.id);
                }
            });
        });

        // Helper function for handling a user leaving a room
        function handleUserLeavingRoom(socket, roomId, userId) {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    const count = room.removeParticipant(userId);
                    socket.leave(roomId);

                    console.log(`User ${userId} left room ${roomId}`);

                    // Notify remaining users
                    io.to(roomId).emit('participant-left', {
                        userId,
                        count
                    });

                    // If room is empty, consider removing it (optional, based on your requirements)
                    if (count === 0) {
                        // You could delete empty rooms after some time
                        // For now, we'll keep them
                        console.log(`Room ${roomId} is now empty`);
                    }
                }
            } catch (error) {
                console.error(`Error handling user leaving room: ${error.message}`);
            }
        }
    });

    return io;
}

module.exports = { initializeSocketIO };