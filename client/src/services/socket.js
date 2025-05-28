import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
    if (!socket) {
        socket = io('http://localhost:3001');
        console.log('Socket initialized');
    }
    return socket;
};

export const joinRoom = (roomId, userId = null) => {
    if (!socket) initializeSocket();

    console.log(`Joining room: ${roomId}`);
    socket.emit('join-room', { roomId, userId });

    return socket;
};

export const leaveRoom = (roomId, userId = null) => {
    if (!socket) return;

    console.log(`Leaving room: ${roomId}`);
    socket.emit('leave-room', { roomId, userId });
};

export const updateRoomName = (roomId, name) => {
    if (!socket) return;
    socket.emit('update-room-name', { roomId, name });
};

export const toggleRoomVisibility = (roomId) => {
    if (!socket) return;
    socket.emit('toggle-room-visibility', { roomId });
};

export default { initializeSocket, joinRoom, leaveRoom, updateRoomName, toggleRoomVisibility };