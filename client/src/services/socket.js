import { io } from 'socket.io-client';

let socket = null;
let currentRoom = null; // Track current room to prevent duplicate joins

export const initializeSocket = () => {
    if (!socket) {
        socket = io('http://localhost:3001', {
            withCredentials: true
        });
        console.log('Socket initialized');
    }
    return socket;
};

export const joinRoom = (roomId, username) => {
    if (!socket) initializeSocket();

    // Only join if not already in this room
    if (currentRoom !== roomId) {
        console.log(`Joining room: ${roomId} as ${username || 'Anonymous'}`);
        socket.emit('join-room', { roomId, username: username || 'Anonymous' });
        currentRoom = roomId;
    } else {
        console.log(`Already in room ${roomId}, not rejoining`);
    }

    return socket;
};

export const sendChatMessage = (roomId, text) => {
    if (!socket) initializeSocket();

    if (!text || !text.trim()) return;

    socket.emit('send-message', { roomId, text });
};

// Request recent chat messages
export const getRecentChatMessages = (roomId) => {
    if (!socket) initializeSocket();

    socket.emit('get-recent-messages', { roomId });
};

// Subscribe to new messages
export const subscribeToMessages = (callback) => {
    if (!socket) initializeSocket();

    socket.on('receive-message', callback);

    return () => {
        if (socket) socket.off('receive-message', callback);
    };
};
export const subscribeToMessageHistory = (callback) => {
    if (!socket) initializeSocket();

    socket.on('recent-messages', callback);

    return () => {
        if (socket) socket.off('recent-messages', callback);
    };
};

export const leaveRoom = (roomId) => {
    if (!socket) return;

    console.log(`Leaving room: ${roomId}`);
    socket.emit('leave-room', { roomId });
    if (currentRoom === roomId) {
        currentRoom = null; // Reset current room
    }
};

export const updateUsername = (roomId, username) => {
    if (!socket) return;

    console.log(`Updating username to ${username} in room ${roomId}`);
    socket.emit('update-username', { roomId, username });
};

export const sendCursorPosition = (roomId, position) => {
    if (!socket) return;
    socket.emit('cursor-position', { roomId, position });
};

export const updateRoomName = (roomId, name) => {
    if (!socket) return;
    socket.emit('update-room-name', { roomId, name });
};

export const toggleRoomVisibility = (roomId) => {
    if (!socket) return;
    socket.emit('toggle-room-visibility', { roomId });
};

export default {
    initializeSocket,
    joinRoom,
    leaveRoom,
    updateRoomName,
    toggleRoomVisibility,
    updateUsername,
    sendCursorPosition,
    sendChatMessage,
    getRecentChatMessages,
    subscribeToMessages,
    subscribeToMessageHistory
};