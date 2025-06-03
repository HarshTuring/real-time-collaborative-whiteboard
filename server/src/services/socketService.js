const roomStore = require('../models/Room');

// Initialize Socket.IO with the HTTP server
function initializeSocketIO(io) {
    // Add middleware to log cookies and headers
    io.use((socket, next) => {
        if (socket.handshake.headers.cookie) {
            // Parse the cookie string to get userId
            const cookies = socket.handshake.headers.cookie.split(';')
                .map(cookie => cookie.trim().split('='))
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {});

            // Store userId in socket data for later use
            if (cookies.userId) {
                socket.data.persistentUserId = cookies.userId;
                console.log(`User connected with persistent ID: ${cookies.userId}`);
            }
        }
        next();
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('send-message', ({ roomId, text }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room && text && text.trim()) {
                    // Get the username for this user
                    const username = room.participants.get(socket.id) || 'Anonymous';

                    // Get user's current drawing color if they are drawing
                    const drawingInfo = room.drawingUsers.get(socket.id);
                    const color = drawingInfo ? drawingInfo.color : null;

                    // Create message object
                    const message = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        roomId,
                        userId: socket.id,
                        username,
                        text: text.trim(),
                        timestamp: Date.now(),
                        type: 'user-message',
                        color
                    };

                    // Add message to room's history
                    room.addMessage(message);

                    // Broadcast message to all users in the room (including sender)
                    io.to(roomId).emit('receive-message', message);

                    console.log(`Message from ${username} in room ${roomId}: ${text.substring(0, 30)}`);
                }
            } catch (error) {
                console.error(`Error handling chat message: ${error.message}`);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Request for recent messages
        socket.on('get-recent-messages', ({ roomId }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Send recent messages to the requesting user
                    socket.emit('recent-messages', {
                        messages: room.getRecentMessages()
                    });
                }
            } catch (error) {
                console.error(`Error getting recent messages: ${error.message}`);
                socket.emit('error', { message: 'Failed to get messages' });
            }
        });

        // When a user creates or joins a room
        socket.on('join-room', ({ roomId, userId, username }) => {
            try {
                // Check if room exists
                let room = roomStore.getRoom(roomId);

                // If room doesn't exist, create it (this is a fallback, normally rooms are created via API)
                if (!room) {
                    room = roomStore.createRoom(roomId, null, false, userId || socket.id);
                    console.log(`Room ${roomId} created automatically by user ${userId || socket.id}`);
                }

                // Add user to the room with username
                socket.join(roomId);
                const actualUserId = socket.data.persistentUserId || socket.id;
                room.addParticipant(actualUserId, username || 'Anonymous');

                console.log(`User ${actualUserId} (${username || 'Anonymous'}) joined room ${roomId}`);

                // Send existing canvas state to the new user
                socket.emit('canvas-state', room.canvasState);

                // Get participants with usernames
                const participants = Array.from(room.participants).map(([id, name]) => ({
                    id,
                    username: name
                }));

                const systemMessage = room.addSystemMessage(`${username || 'Anonymous'} has joined the room`);
                io.to(roomId).emit('receive-message', systemMessage);

                socket.emit('recent-messages', {
                    messages: room.getRecentMessages()
                });

                // Notify all users in the room about the new participant
                io.to(roomId).emit('participant-joined', {
                    userId: actualUserId,
                    username: username || 'Anonymous',
                    count: room.getParticipantCount(),
                    participants: participants
                });

                // Notify about room update
                io.to(roomId).emit('room-updated', room.getDetails(true));
            } catch (error) {
                console.error(`Error joining room: ${error.message}`);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Handle username updates
        socket.on('update-username', ({ roomId, username }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room && room.participants.has(socket.id)) {
                    // Update the username
                    room.updateParticipantUsername(socket.id, username);

                    // Get updated participants list
                    const participants = Array.from(room.participants).map(([id, name]) => ({
                        id,
                        username: name
                    }));

                    // Notify all users in the room
                    io.to(roomId).emit('username-updated', {
                        userId: socket.id,
                        username,
                        participants
                    });

                    console.log(`User ${socket.id} updated username to ${username} in room ${roomId}`);
                }
            } catch (error) {
                console.error(`Error updating username: ${error.message}`);
                socket.emit('error', { message: 'Failed to update username' });
            }
        });

        // When a user draws on the canvas
        socket.on('draw-line', ({ roomId, line }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Make sure line data is properly structured 
                    // (either an array of points with a color property or a proper line object)
                    let lineData = line;

                    // If line is an array of points, restructure it to include color
                    if (Array.isArray(line)) {
                        lineData = {
                            points: line,
                            color: '#000000' // Default color if not provided
                        };
                    }

                    // Store the drawing data with color
                    room.addDrawing(lineData);

                    // Broadcast to all other users in the room
                    socket.to(roomId).emit('draw-line', lineData);
                }
            } catch (error) {
                console.error(`Error in draw-line: ${error.message}`);
            }
        });

        socket.on('update-drawing-status', ({ roomId, isDrawing, color }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Get the username for this user
                    const username = room.participants.get(socket.id) || 'Anonymous';

                    // Update the drawing status for this user
                    if (isDrawing) {
                        room.updateUserDrawingStatus(socket.id, true, color);
                    } else {
                        room.updateUserDrawingStatus(socket.id, false);
                    }

                    // Broadcast to all users in the room including color information
                    io.to(roomId).emit('user-drawing-update', {
                        userId: socket.data.persistentUserId,
                        isDrawing,
                        username,
                        color: color || '#000000'
                    });
                }
            } catch (error) {
                console.error(`Error updating drawing status: ${error.message}`);
            }
        });

        // When a user sends cursor position, include username
        socket.on('cursor-position', ({ roomId, position }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Get the username
                    const username = room.participants.get(socket.id) || 'Anonymous';

                    // Broadcast cursor position with username
                    socket.to(roomId).emit('cursor-position', {
                        userId: socket.id,
                        position,
                        cursorUsername: username
                    });
                }
            } catch (error) {
                console.error(`Error sending cursor position: ${error.message}`);
            }
        });

        // When a user sends a complete canvas state update
        socket.on('update-canvas-state', ({ roomId, canvasState }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Make sure each line in canvasState has the proper format with color
                    const formattedCanvasState = canvasState.map(line => {
                        if (Array.isArray(line)) {
                            return {
                                points: line,
                                color: '#000000' // Default color if not provided
                            };
                        }
                        return line; // Already in correct format
                    });

                    room.updateCanvasState(formattedCanvasState);
                    socket.to(roomId).emit('canvas-state', formattedCanvasState);
                }
            } catch (error) {
                console.error(`Error updating canvas state: ${error.message}`);
            }
        });

        socket.on('clear-canvas', ({ roomId }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room) {
                    // Clear the canvas state in the room
                    room.updateCanvasState([]);

                    // Broadcast to all other users in the room
                    socket.to(roomId).emit('clear-canvas');
                }
            } catch (error) {
                console.error(`Error clearing canvas: ${error.message}`);
            }
        });

        // When a user leaves a room explicitly
        socket.on('leave-room', ({ roomId }) => {
            handleUserLeavingRoom(socket, roomId, socket.data.persistentUserId || socket.id);
        });

        // Handle room name updates
        socket.on('update-room-name', ({ roomId, name }) => {
            try {
                const room = roomStore.getRoom(roomId);

                if (room && name) {
                    room.updateName(name);
                    io.to(roomId).emit('room-updated', room.getDetails(true));
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
                    io.to(roomId).emit('room-updated', room.getDetails(true));
                }
            } catch (error) {
                console.error(`Error toggling room visibility: ${error.message}`);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);

            // Check all rooms to see if this user is a participant
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
                    if (room.isUserDrawing(userId)) {
                        room.updateUserDrawingStatus(userId, false);
                    }

                    const count = room.removeParticipant(userId);
                    socket.leave(roomId);

                    // const systemMessage = room.addSystemMessage(`${username} has left the room`);
                    // io.to(roomId).emit('receive-message', systemMessage);

                    // Get updated participants list
                    const participants = Array.from(room.participants).map(([id, name]) => ({
                        id,
                        username: name
                    }));

                    console.log(`User ${userId} left room ${roomId}`);

                    // Notify remaining users
                    io.to(roomId).emit('participant-left', {
                        userId,
                        count,
                        participants
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