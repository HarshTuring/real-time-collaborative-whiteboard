import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageInput from '../MessageInput';

describe('MessageInput', () => {
    const mockOnSendMessage = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders input field and send button', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('sends message when form is submitted', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByText('Send');

        // Type message and submit
        fireEvent.change(input, { target: { value: 'Hello, world!' } });
        fireEvent.click(sendButton);

        // Verify onSendMessage was called with correct message
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, world!');
        
        // Verify input is cleared after sending
        expect(input.value).toBe('');
    });

    it('does not send empty messages', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByText('Send');

        // Try to send empty message
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.click(sendButton);

        // Verify onSendMessage was not called
        expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('sends message when Enter key is pressed', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        const input = screen.getByPlaceholderText('Type a message...');
        const form = input.closest('form');

        // Type message and press Enter
        fireEvent.change(input, { target: { value: 'Hello, world!' } });
        fireEvent.submit(form);

        // Verify onSendMessage was called with correct message
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, world!');
        
        // Verify input is cleared after sending
        expect(input.value).toBe('');
    });

    it('does not send message when Shift+Enter is pressed', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        const input = screen.getByPlaceholderText('Type a message...');

        // Type message and press Shift+Enter
        fireEvent.change(input, { target: { value: 'Hello, world!' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

        // Verify onSendMessage was not called
        expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('disables send button when input is empty', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has content', () => {
        render(<MessageInput onSendMessage={mockOnSendMessage} />);
        
        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByText('Send');

        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(sendButton).not.toBeDisabled();
    });
}); 