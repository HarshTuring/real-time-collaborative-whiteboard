const roomStore = require('../models/Room');
const { generateRoomId } = require('../utils/idGenerator');

// Mock the idGenerator to return predictable IDs for testing
jest.mock('../utils/idGenerator', () => ({
    generateRoomId: jest.fn(() => 'test123'),
    generateRoomName: jest.fn(() => 'Test Room')
}));

// Mock socket.io
const mockSocket = {
    id: 'socket123',
    join: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    broadcast: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }
};

describe('Room Locking Tests', () => {
    let room;
    const adminId = 'admin123';
    const participantId = 'user456';

    beforeEach(() => {
        // Clear the room store before each test
        roomStore.rooms.clear();
        
        // Create a new room with admin
        room = roomStore.createRoom('test123', 'Test Room', false, adminId);
        
        // Reset socket mocks
        mockSocket.join.mockClear();
        mockSocket.emit.mockClear();
        mockSocket.broadcast.to.mockClear();
        mockSocket.broadcast.emit.mockClear();
    });

    describe('Room Creation and Initial Setup', () => {
        test('should create room with admin and verify initial state', () => {
            expect(room.id).toBe('test123');
            expect(room.createdBy).toBe(adminId);
            expect(room.isLocked()).toBe(false);
            expect(room.isAdmin(adminId)).toBe(true);
        });
    });

    describe('Drawing in Unlocked Room', () => {
        test('should allow drawing when room is unlocked', () => {
            // Join as admin
            room.addParticipant(adminId, 'Admin User');
            
            // Simulate drawing a line
            const lineData = {
                points: [[0, 0], [100, 100]],
                color: '#000000',
                width: 2
            };
            
            // Add line to canvas state
            room.updateCanvasState([lineData], adminId);
            
            // Verify line was added
            expect(room.canvasState).toHaveLength(1);
            expect(room.canvasState[0]).toEqual(lineData);
        });

        test('should allow multiple participants to draw', () => {
            // Join as admin and participant
            room.addParticipant(adminId, 'Admin User');
            room.addParticipant(participantId, 'Regular User');
            
            // Simulate drawing from both users
            const adminLine = {
                points: [[0, 0], [100, 100]],
                color: '#000000',
                width: 2
            };
            
            const participantLine = {
                points: [[200, 200], [300, 300]],
                color: '#FF0000',
                width: 2
            };
            
            // Add lines to canvas state
            room.updateCanvasState([adminLine, participantLine], adminId);
            
            // Verify both lines were added
            expect(room.canvasState).toHaveLength(2);
            expect(room.canvasState).toContainEqual(adminLine);
            expect(room.canvasState).toContainEqual(participantLine);
        });
    });

    describe('Drawing in Locked Room', () => {
        test('should prevent drawing when room is locked', () => {
            // Join as admin and participant
            room.addParticipant(adminId, 'Admin User');
            room.addParticipant(participantId, 'Regular User');
            
            // Add initial line
            const initialLine = {
                points: [[0, 0], [100, 100]],
                color: '#000000',
                width: 2
            };
            room.updateCanvasState([initialLine], adminId);
            
            // Lock the room
            room.toggleLock();
            expect(room.isLocked()).toBe(true);
            
            // Attempt to draw new line as participant
            const participantLine = {
                points: [[200, 200], [300, 300]],
                color: '#FF0000',
                width: 2
            };
            
            // Try to update canvas state as non-admin
            const originalState = [...room.canvasState];
            const participantUpdateResult = room.updateCanvasState([...originalState, participantLine], participantId);
            
            // Verify participant update was rejected
            expect(participantUpdateResult).toBe(false);
            expect(room.canvasState).toEqual(originalState);
            expect(room.canvasState).toHaveLength(1);

            // Attempt to draw new line as admin
            const adminLine = {
                points: [[400, 400], [500, 500]],
                color: '#000000',
                width: 2
            };
            
            // Try to update canvas state as admin
            const adminUpdateResult = room.updateCanvasState([...originalState, adminLine], adminId);
            
            // Verify admin update was also rejected
            expect(adminUpdateResult).toBe(false);
            expect(room.canvasState).toEqual(originalState);
            expect(room.canvasState).toHaveLength(1);
        });

        test('should allow drawing after room is unlocked', () => {
            // Join as admin
            room.addParticipant(adminId, 'Admin User');
            
            // Add initial line
            const initialLine = {
                points: [[0, 0], [100, 100]],
                color: '#000000',
                width: 2
            };
            room.updateCanvasState([initialLine], adminId);
            
            // Lock the room
            room.toggleLock();
            expect(room.isLocked()).toBe(true);
            
            // Attempt to draw while locked
            const lockedLine = {
                points: [[200, 200], [300, 300]],
                color: '#000000',
                width: 2
            };
            
            // Try to update canvas state while locked
            const lockedState = [...room.canvasState];
            const lockedUpdateResult = room.updateCanvasState([...lockedState, lockedLine], adminId);
            
            // Verify update was rejected
            expect(lockedUpdateResult).toBe(false);
            expect(room.canvasState).toEqual(lockedState);
            
            // Unlock the room
            room.toggleLock();
            expect(room.isLocked()).toBe(false);
            
            // Try to draw after unlocking
            const unlockedLine = {
                points: [[400, 400], [500, 500]],
                color: '#000000',
                width: 2
            };
            
            // Update canvas state after unlocking
            const unlockedUpdateResult = room.updateCanvasState([...room.canvasState, unlockedLine], adminId);
            
            // Verify update was successful
            expect(unlockedUpdateResult).toBe(true);
            expect(room.canvasState).toHaveLength(2);
            expect(room.canvasState).toContainEqual(unlockedLine);
        });
    });

    describe('Room Locking State Management', () => {
        test('should toggle room lock state', () => {
            expect(room.isLocked()).toBe(false);
            
            // Lock the room
            room.toggleLock();
            expect(room.isLocked()).toBe(true);
            
            // Unlock the room
            room.toggleLock();
            expect(room.isLocked()).toBe(false);
        });

        test('should include lock state in room details', () => {
            // Lock the room
            room.toggleLock();
            
            // Get room details
            const details = room.getDetails();
            
            expect(details.isLocked).toBe(true);
        });
    });
}); 