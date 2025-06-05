import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageList from '../MessageList';

describe('MessageList', () => {
    const mockCurrentUserId = 'user-123';

    it('displays empty state when no messages', () => {
        render(<MessageList messages={[]} currentUserId={mockCurrentUserId} />);
        expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
    });

    it('displays regular messages correctly', () => {
        const mockMessages = [
            {
                id: 'msg-1',
                text: 'Hello from other user',
                userId: 'other-user',
                username: 'OtherUser',
                timestamp: new Date().toISOString(),
                type: 'message'
            },
            {
                id: 'msg-2',
                text: 'Hello from current user',
                userId: mockCurrentUserId,
                username: 'CurrentUser',
                timestamp: new Date().toISOString(),
                type: 'message'
            }
        ];

        render(<MessageList messages={mockMessages} currentUserId={mockCurrentUserId} />);

        // Check if messages are displayed
        expect(screen.getByText('Hello from other user')).toBeInTheDocument();
        expect(screen.getByText('Hello from current user')).toBeInTheDocument();
        
        // Check if usernames are displayed for other user's messages
        expect(screen.getByText('OtherUser')).toBeInTheDocument();
    });

    it('displays notification messages correctly', () => {
        const mockMessages = [
            {
                id: 'notif-1',
                text: 'User joined the room',
                type: 'notification',
                timestamp: new Date().toISOString()
            }
        ];

        render(<MessageList messages={mockMessages} currentUserId={mockCurrentUserId} />);
        expect(screen.getByText('User joined the room')).toBeInTheDocument();
    });

    it('displays mixed message types correctly', () => {
        const mockMessages = [
            {
                id: 'msg-1',
                text: 'Hello from other user',
                userId: 'other-user',
                username: 'OtherUser',
                timestamp: new Date().toISOString(),
                type: 'message'
            },
            {
                id: 'notif-1',
                text: 'User joined the room',
                type: 'notification',
                timestamp: new Date().toISOString()
            },
            {
                id: 'msg-2',
                text: 'Hello from current user',
                userId: mockCurrentUserId,
                username: 'CurrentUser',
                timestamp: new Date().toISOString(),
                type: 'message'
            }
        ];

        render(<MessageList messages={mockMessages} currentUserId={mockCurrentUserId} />);

        // Check if all messages are displayed
        expect(screen.getByText('Hello from other user')).toBeInTheDocument();
        expect(screen.getByText('User joined the room')).toBeInTheDocument();
        expect(screen.getByText('Hello from current user')).toBeInTheDocument();
        
        // Check if username is displayed for other user's message
        expect(screen.getByText('OtherUser')).toBeInTheDocument();
    });

    it('displays messages in correct order', () => {
        const mockMessages = [
            {
                id: 'msg-1',
                text: 'First message',
                userId: 'other-user',
                username: 'OtherUser',
                timestamp: new Date(Date.now() - 1000).toISOString(),
                type: 'message'
            },
            {
                id: 'msg-2',
                text: 'Second message',
                userId: mockCurrentUserId,
                username: 'CurrentUser',
                timestamp: new Date().toISOString(),
                type: 'message'
            }
        ];

        render(<MessageList messages={mockMessages} currentUserId={mockCurrentUserId} />);

        const messages = screen.getAllByText(/message/);
        expect(messages[0]).toHaveTextContent('First message');
        expect(messages[1]).toHaveTextContent('Second message');
    });
}); 