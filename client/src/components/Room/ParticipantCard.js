import React from 'react';
import './ParticipantCard.css';

const ParticipantCard = ({ participant, isAdmin, isCurrentUser, isDrawing }) => {
    // Extract username from participant
    const username = typeof participant === 'string' ? participant : participant.username;

    return (
        <div>
            <div className="participant-avatar">
                {username.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="participant-name">
                    {username}
                    {isCurrentUser &&
                        <span>
                            (You)

                        </span>
                    }
                    {isAdmin &&

                        <span>
                            &nbsp;👑
                        </span>
                    }

                </div>
                {isDrawing && (
                    <div>
                        <span className="drawing-dot" style={{ backgroundColor: isDrawing.color || '#4285f4' }}></span>

                        Drawing
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantCard;