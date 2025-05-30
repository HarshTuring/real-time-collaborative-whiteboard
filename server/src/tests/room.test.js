const roomStore = require('../models/Room');
const { generateRoomId } = require('../utils/idGenerator');

// Mock the idGenerator to return predictable IDs for testing
jest.mock('../utils/idGenerator', () => ({
    generateRoomId: jest.fn(() => 'test123'),
    generateRoomName: jest.fn(() => 'Test Room')
}));

describe('Room Management Tests', () => {
    beforeEach(() => {
        roomStore.rooms.clear();
    });

    describe('Room Creation', () => {
        test('should create a public room successfully', () => {
            const room = roomStore.createRoom('test123', 'Test Room', false, 'user1');
            
            expect(room).toBeDefined();
            expect(room.id).toBe('test123');
            expect(room.name).toBe('Test Room');
            expect(room.isPrivate).toBe(false);
            expect(room.createdBy).toBe('user1');
            expect(room.participants.size).toBe(0);
        });

        test('should create a private room successfully', () => {
            const room = roomStore.createRoom('test123', 'Private Room', true, 'user1');
            
            expect(room.isPrivate).toBe(true);
        });

        test('should generate default name if none provided', () => {
            const room = roomStore.createRoom('test123', null, false, 'user1');
            
            expect(room.name).toBe('Room test12');
        });
    });

    describe('Room Store Operations', () => {
        beforeEach(() => {
            // Create some test rooms
            roomStore.createRoom('public1', 'Public Room 1', false, 'user1');
            roomStore.createRoom('private1', 'Private Room 1', true, 'user1');
            roomStore.createRoom('public2', 'Public Room 2', false, 'user2');
        });

        test('should get public rooms only', () => {
            const publicRooms = roomStore.getPublicRooms();
            
            expect(publicRooms).toHaveLength(2);
            expect(publicRooms.every(room => !room.isPrivate)).toBe(true);
        });

        test('should get room by ID', () => {
            const room = roomStore.getRoom('public1');
            
            expect(room).toBeDefined();
            expect(room.id).toBe('public1');
            expect(room.name).toBe('Public Room 1');
        });

        test('should return null for non-existent room', () => {
            const room = roomStore.getRoom('nonexistent');
            
            expect(room).toBeNull();
        });

        test('should delete room successfully', () => {
            const deleted = roomStore.deleteRoom('public1');
            
            expect(deleted).toBe(true);
            expect(roomStore.getRoom('public1')).toBeNull();
        });

        test('should check if room exists', () => {
            expect(roomStore.roomExists('public1')).toBe(true);
            expect(roomStore.roomExists('nonexistent')).toBe(false);
        });
    });

    describe('Room Participant Management', () => {
        let room;

        beforeEach(() => {
            room = roomStore.createRoom('test123', 'Test Room', false, 'user1');
        });

        test('should add participant to room', () => {
            const count = room.addParticipant('user2');
            
            expect(count).toBe(1);
            expect(room.participants.has('user2')).toBe(true);
        });

        test('should remove participant from room', () => {
            room.addParticipant('user2');
            const count = room.removeParticipant('user2');
            
            expect(count).toBe(0);
            expect(room.participants.has('user2')).toBe(false);
        });

        test('should get correct participant count', () => {
            room.addParticipant('user2');
            room.addParticipant('user3');
            
            expect(room.getParticipantCount()).toBe(2);
        });
    });

    describe('Room Properties Management', () => {
        let room;

        beforeEach(() => {
            room = roomStore.createRoom('test123', 'Test Room', false, 'user1');
        });

        test('should update room name', () => {
            const updated = room.updateName('New Room Name');
            
            expect(updated).toBe(true);
            expect(room.name).toBe('New Room Name');
        });

        test('should not update room name with empty string', () => {
            const updated = room.updateName('');
            
            expect(updated).toBe(false);
            expect(room.name).toBe('Test Room');
        });

        test('should toggle room visibility', () => {
            expect(room.isPrivate).toBe(false);
            
            const isPrivate = room.toggleVisibility();
            expect(isPrivate).toBe(true);
            expect(room.isPrivate).toBe(true);
            
            const isPublic = room.toggleVisibility();
            expect(isPublic).toBe(false);
            expect(room.isPrivate).toBe(false);
        });

        test('should get room details', () => {
            room.addParticipant('user2');
            const details = room.getDetails();
            
            expect(details).toEqual({
                id: 'test123',
                name: 'Test Room',
                isPrivate: false,
                participantCount: 1,
                createdAt: expect.any(Date)
            });
        });

        test('should get room details with participants', () => {
            room.addParticipant('user2');
            const details = room.getDetails(true);
            
            expect(details.participants).toEqual(['user2']);
        });
    });
}); 