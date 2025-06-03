import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPanel from '../ChatPanel';
import { sendChatMessage, subscribeToMessages, subscribeToMessageHistory } from '../../../services/socket';

// Mock the socket service
jest.mock('../../../services/socket', () => ({
    sendChatMessage: jest.fn(),
    subscribeToMessages: jest.fn(() => jest.fn()),
    subscribeToMessageHistory: jest.fn(() => jest.fn()),
    getRecentChatMessages: jest.fn()
}));

// Mock the audio file
jest.mock('../../../../public/assets/message-notification.mp3', () => 'mock-audio-file');

// Mock the Audio API
window.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    currentTime: 0
}));

describe('ChatPanel', () => {
    const mockRoomId = 'test-room-123';
    const mockCurrentUser = {
        id: 'user-123',
        username: 'TestUser'
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('renders chat toggle button initially', () => {
        render(<ChatPanel roomId={mockRoomId} currentUser={mockCurrentUser} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('opens chat panel when toggle button is clicked', () => {
        render(<ChatPanel roomId={mockRoomId} currentUser={mockCurrentUser} />);
        const toggleButton = screen.getByRole('button');
        fireEvent.click(toggleButton);
        expect(screen.getByText('Room Chat')).toBeInTheDocument();
    });

    it('sends message when form is submitted', () => {
        render(<ChatPanel roomId={mockRoomId} currentUser={mockCurrentUser} />);
        
        // Open chat panel
        const toggleButton = screen.getByRole('button');
        fireEvent.click(toggleButton);

        // Find input and send button
        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByText('Send');

        // Type message and submit
        fireEvent.change(input, { target: { value: 'Hello, world!' } });
        fireEvent.click(sendButton);

        // Verify sendChatMessage was called with correct parameters
        expect(sendChatMessage).toHaveBeenCalledWith(mockRoomId, 'Hello, world!');
    });

    it('displays received messages', () => {
        const mockMessage = {
            id: 'msg-123',
            text: 'Test message',
            userId: 'other-user',
            username: 'OtherUser',
            timestamp: new Date().toISOString(),
            type: 'message'
        };

        // Mock the subscribeToMessages callback
        let messageCallback;
        subscribeToMessages.mockImplementation((callback) => {
            messageCallback = callback;
            return jest.fn();
        });

        render(<ChatPanel roomId={mockRoomId} currentUser={mockCurrentUser} />);
        
        // Open chat panel
        const toggleButton = screen.getByRole('button');
        fireEvent.click(toggleButton);

        // Simulate receiving a message
        act(() => {
            messageCallback(mockMessage);
        });

        // Verify message is displayed
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('OtherUser')).toBeInTheDocument();
    });

    it('displays notification messages', () => {
        const mockNotification = {
            id: 'notif-123',
            text: 'User joined the room',
            type: 'notification',
            timestamp: new Date().toISOString()
        };

        // Mock the subscribeToMessages callback
        let messageCallback;
        subscribeToMessages.mockImplementation((callback) => {
            messageCallback = callback;
            return jest.fn();
        });

        render(<ChatPanel roomId={mockRoomId} currentUser={mockCurrentUser} />);
        
        // Open chat panel
        const toggleButton = screen.getByRole('button');
        fireEvent.click(toggleButton);

        // Simulate receiving a notification
        act(() => {
            messageCallback(mockNotification);
        });

        // Verify notification is displayed
        expect(screen.getByText('User joined the room')).toBeInTheDocument();
    });
}); 