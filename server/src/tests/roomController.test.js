const roomController = require('../controllers/roomController');
const roomStore = require('../models/Room');

// Mock the roomStore
jest.mock('../models/Room', () => {
    const mockRoom = {
        id: 'test123',
        name: 'Test Room',
        isPrivate: false,
        createdBy: 'user1',
        participants: new Set(),
        getDetails: jest.fn().mockReturnValue({
            id: 'test123',
            name: 'Test Room',
            isPrivate: false,
            participantCount: 0,
            createdAt: new Date()
        }),
        updateName: jest.fn().mockReturnValue(true),
        toggleVisibility: jest.fn().mockReturnValue(true)
    };

    return {
        createRoom: jest.fn().mockReturnValue(mockRoom),
        getRoom: jest.fn().mockReturnValue(mockRoom),
        getPublicRooms: jest.fn().mockReturnValue([mockRoom.getDetails()]),
        deleteRoom: jest.fn().mockReturnValue(true),
        roomExists: jest.fn().mockReturnValue(true)
    };
});

describe('Room Controller Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock request and response objects
        mockReq = {
            body: {},
            params: {},
            query: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('createRoom', () => {
        test('should create a room successfully', () => {
            mockReq.body = {
                name: 'Test Room',
                isPrivate: false,
                userId: 'user1'
            };

            roomController.createRoom(mockReq, mockRes);

            expect(roomStore.createRoom).toHaveBeenCalledWith(
                expect.any(String),
                'Test Room',
                false,
                'user1'
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                room: expect.any(Object)
            });
        });

        test('should handle creation error', () => {
            roomStore.createRoom.mockImplementationOnce(() => {
                throw new Error('Creation failed');
            });

            roomController.createRoom(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to create room',
                error: 'Creation failed'
            });
        });
    });

    describe('getPublicRooms', () => {
        test('should get all public rooms', () => {
            roomController.getPublicRooms(mockReq, mockRes);

            expect(roomStore.getPublicRooms).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                rooms: expect.any(Array)
            });
        });

        test('should handle error when getting public rooms', () => {
            roomStore.getPublicRooms.mockImplementationOnce(() => {
                throw new Error('Failed to fetch rooms');
            });

            roomController.getPublicRooms(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch rooms',
                error: 'Failed to fetch rooms'
            });
        });
    });

    describe('getRoomDetails', () => {
        test('should get room details successfully', () => {
            mockReq.params.roomId = 'test123';

            roomController.getRoomDetails(mockReq, mockRes);

            expect(roomStore.getRoom).toHaveBeenCalledWith('test123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                room: expect.any(Object)
            });
        });

        test('should handle non-existent room', () => {
            mockReq.params.roomId = 'nonexistent';
            roomStore.getRoom.mockReturnValueOnce(null);

            roomController.getRoomDetails(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Room not found'
            });
        });
    });

    describe('updateRoomName', () => {
        test('should update room name successfully', () => {
            mockReq.params.roomId = 'test123';
            mockReq.body.name = 'New Room Name';

            roomController.updateRoomName(mockReq, mockRes);

            expect(roomStore.getRoom).toHaveBeenCalledWith('test123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                room: expect.any(Object)
            });
        });

        test('should handle invalid room name', () => {
            mockReq.params.roomId = 'test123';
            mockReq.body.name = '';
            roomStore.getRoom.mockReturnValueOnce({
                updateName: jest.fn().mockReturnValue(false)
            });

            roomController.updateRoomName(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid room name'
            });
        });
    });

    describe('toggleRoomVisibility', () => {
        test('should toggle room visibility successfully', () => {
            mockReq.params.roomId = 'test123';

            roomController.toggleRoomVisibility(mockReq, mockRes);

            expect(roomStore.getRoom).toHaveBeenCalledWith('test123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                room: expect.any(Object),
                message: expect.any(String)
            });
        });

        test('should handle non-existent room', () => {
            mockReq.params.roomId = 'nonexistent';
            roomStore.getRoom.mockReturnValueOnce(null);

            roomController.toggleRoomVisibility(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Room not found'
            });
        });
    });

    describe('deleteRoom', () => {
        test('should delete room successfully', () => {
            mockReq.params.roomId = 'test123';

            roomController.deleteRoom(mockReq, mockRes);

            expect(roomStore.roomExists).toHaveBeenCalledWith('test123');
            expect(roomStore.deleteRoom).toHaveBeenCalledWith('test123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Room deleted successfully'
            });
        });

        test('should handle non-existent room', () => {
            mockReq.params.roomId = 'nonexistent';
            roomStore.roomExists.mockReturnValueOnce(false);

            roomController.deleteRoom(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Room not found'
            });
        });
    });

    describe('checkRoomAccess', () => {
        test('should check room access successfully', () => {
            mockReq.params.roomId = 'test123';

            roomController.checkRoomAccess(mockReq, mockRes);

            expect(roomStore.getRoom).toHaveBeenCalledWith('test123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                room: expect.any(Object)
            });
        });

        test('should handle non-existent room', () => {
            mockReq.params.roomId = 'nonexistent';
            roomStore.getRoom.mockReturnValueOnce(null);

            roomController.checkRoomAccess(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Room not found'
            });
        });
    });
}); 