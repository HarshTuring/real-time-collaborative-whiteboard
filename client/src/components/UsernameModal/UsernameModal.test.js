import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsernameModal from './UsernameModal';

describe('UsernameModal Component', () => {
    test('should not render when isOpen is false', () => {
        render(
            <UsernameModal isOpen={false} onSubmit={jest.fn()} />
        );

        // Modal should not be in the document
        const modalTitle = screen.queryByText('Enter Your Display Name');
        expect(modalTitle).not.toBeInTheDocument();
    });

    test('should render when isOpen is true', () => {
        render(

            <UsernameModal isOpen={true} onSubmit={jest.fn()} />
        );

        // Modal should be in the document
        const modalTitle = screen.getByText('Enter Your Display Name');
        expect(modalTitle).toBeInTheDocument();

        // Input and button should be present
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    test('should show error message for empty username', async () => {
        render(

            <UsernameModal isOpen={true} onSubmit={jest.fn()} />
        );

        // Submit form with empty input
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // Error message should appear
        const errorMessage = await screen.findByText('Username cannot be empty.');
        expect(errorMessage).toBeInTheDocument();
    });

    test('should show error for username less than 2 characters', async () => {
        render(

            <UsernameModal isOpen={true} onSubmit={jest.fn()} />
        );

        // Enter single character and submit
        const input = screen.getByPlaceholderText('Enter your name');
        fireEvent.change(input, { target: { value: 'A' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // Error message should appear
        const errorMessage = await screen.findByText('Username must be at least 2 characters long.');
        expect(errorMessage).toBeInTheDocument();
    });

    test('should show error for username more than 20 characters', async () => {
        render(

            <UsernameModal isOpen={true} onSubmit={jest.fn()} />
        );

        // Enter very long username and submit
        const input = screen.getByPlaceholderText('Enter your name');
        fireEvent.change(input, { target: { value: 'ThisIsAReallyLongUsernameWhichExceeds20Characters' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // Error message should appear
        const errorMessage = await screen.findByText('Username must be less than 20 characters long.');
        expect(errorMessage).toBeInTheDocument();
    });

    test('should call onSubmit with valid username', async () => {
        const handleSubmit = jest.fn();
        render(

            <UsernameModal isOpen={true} onSubmit={handleSubmit} />
        );

        // Enter valid username and submit
        const input = screen.getByPlaceholderText('Enter your name');
        fireEvent.change(input, { target: { value: 'TestUser' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // onSubmit should be called with the username
        expect(handleSubmit).toHaveBeenCalledWith('TestUser');
    });

    test('should trim whitespace from username before validation', async () => {
        const handleSubmit = jest.fn();
        render(

            <UsernameModal isOpen={true} onSubmit={handleSubmit} />
        );

        // Enter username with extra spaces
        const input = screen.getByPlaceholderText('Enter your name');
        fireEvent.change(input, { target: { value: '  TestUser  ' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // onSubmit should be called with trimmed username
        expect(handleSubmit).toHaveBeenCalledWith('TestUser');
    });

    test('should reset input when modal reopens', () => {
        const { rerender } = render(

            <UsernameModal isOpen={false} onSubmit={jest.fn()} />
        );

        // Rerender with isOpen=true
        rerender(
            <UsernameModal isOpen={true} onSubmit={jest.fn()} />
        );

        // Input should be empty
        const input = screen.getByPlaceholderText('Enter your name');
        expect(input.value).toBe('');

        // Add some text
        fireEvent.change(input, { target: { value: 'TestUser' } });
        expect(input.value).toBe('TestUser');

        // Close and reopen modal
        rerender(
            <UsernameModal isOpen={false} onSubmit={jest.fn()} />
        );
        rerender(

            <UsernameModal isOpen={true} onSubmit={jest.fn()} />
        );

        // Input should be reset
        const newInput = screen.getByPlaceholderText('Enter your name');
        expect(newInput.value).toBe('');
    });
});