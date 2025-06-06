import React from 'react';
import './ParticipantCard.css';

const ParticipantCard = ({ participant, isAdmin, isCurrentUser, isDrawing }) => {
    // Extract username from participant
    const username = typeof participant === 'string' ? participant : participant.username;

    // Determine avatar border style for drawing status
    const avatarStyle = isDrawing ? {
        borderColor: isDrawing.color || '#4285f4',
        boxShadow: `0 0 0 2px ${isDrawing.color || '#4285f4'}`
    } : {};

    return (
        <div>
            <div
                className={`participant-avatar ${isDrawing ? 'drawing' : ''}`}
                style={avatarStyle}
            >
                {username.charAt(0).toUpperCase()}
            </div>
            <div className='participant-data'>
                <div className="participant-name">
                    {username}
                    {isAdmin &&

                        <span>
                            &nbsp;👑

                        </span>
                    }
                </div>
                <div>
                    {isCurrentUser &&
                        <span>
                            (You)

                        </span>
                    }

                </div>
            </div>
        </div>
    );
};

export default ParticipantCard;