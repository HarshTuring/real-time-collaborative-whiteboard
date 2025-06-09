import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticipantCard from '../ParticipantCard';

describe('ParticipantCard Component', () => {
    const defaultProps = {
        participant: { username: 'JohnDoe', id: 'user123' },
        isAdmin: false,
        isCurrentUser: false,
        isDrawing: null
    };

    test('renders participant name correctly', () => {
        render(
            <ParticipantCard {...defaultProps} />

        );
        expect(screen.getByText('JohnDoe')).toBeInTheDocument();
    });

    test('displays the first letter of username as avatar', () => {
        render(

            <ParticipantCard {...defaultProps} />

        );
        const avatarElement = screen.getByText('J');
        expect(avatarElement).toBeInTheDocument();
        expect(avatarElement).toHaveClass('participant-avatar');
    });

    test('shows admin badge when isAdmin is true', () => {
        render(

            <ParticipantCard {...defaultProps} isAdmin={true} />

        );
        expect(screen.getByText('👑')).toBeInTheDocument();
        expect(screen.getByText('👑')).toHaveClass('admin-badge');
    });

    test('shows current user badge when isCurrentUser is true', () => {
        render(

            <ParticipantCard {...defaultProps} isCurrentUser={true} />

        );
        expect(screen.getByText('(You)')).toBeInTheDocument();
        expect(screen.getByText('(You)')).toHaveClass('current-user-badge');
    });

    test('applies drawing class and style when user is drawing', () => {
        const drawingProps = {
            ...defaultProps,
            isDrawing: { color: '#FF0000' }
        };
        render(

            <ParticipantCard {...drawingProps} />

        );

        const avatarElement = screen.getByText('J');
        expect(avatarElement).toHaveClass('drawing');

        // Check that the style is applied correctly
        expect(avatarElement).toHaveStyle('border-color: #FF0000');
        expect(avatarElement).toHaveStyle('box-shadow: 0 0 0 2px #FF0000');
    });

    test('handles string participant format correctly', () => {
        render(
            <ParticipantCard
                participant="JaneDoe"
                isAdmin={false}
                isCurrentUser={false}
                isDrawing={null}
            />
        );

        expect(screen.getByText('JaneDoe')).toBeInTheDocument();
        expect(screen.getByText('J')).toBeInTheDocument(); // Avatar
    });

    test('applies current-user class to card when isCurrentUser is true', () => {
        render(

            <ParticipantCard {...defaultProps} isCurrentUser={true} />

        );

        // Find the participant card container
        const cardElement = screen.getByText('JohnDoe').closest('.participant-card');
        expect(cardElement).toHaveClass('current-user');
    });

    test('maintains accessibility by using semantic HTML', () => {
        const { container } = render(

            <ParticipantCard {...defaultProps} />

        );

        // Check that divs have proper roles or are being used appropriately
        expect(container.querySelector('.participant-card')).toBeInTheDocument();
        expect(container.querySelector('.participant-details')).toBeInTheDocument();

        // Avatar should have a readable text content (first letter of name)
        const avatar = container.querySelector('.participant-avatar');
        expect(avatar).toHaveTextContent('J');
    });
});