
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../WhiteboardCanvas/Canvas';
import { getRoomDetails } from '../../services/api';
import { joinRoom, leaveRoom } from '../../services/socket';
import './Room.css';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [participantCount, setParticipantCount] = useState(0);
    const [shareTooltip, setShareTooltip] = useState('');

    useEffect(() => {
        // Fetch room details and join the room
        const fetchRoomAndJoin = async () => {
            try {
                setLoading(true);
                const data = await getRoomDetails(roomId);

                if (data.success) {
                    setRoom(data.room);
                    setParticipantCount(data.room.participantCount);

                    // Join the room via socket
                    const socket = joinRoom(roomId);

                    // Listen for room updates
                    socket.on('room-updated', (updatedRoom) => {
                        setRoom(prevRoom => ({
                            ...prevRoom,
                            ...updatedRoom
                        }));
                    });

                    // Listen for participant changes
                    socket.on('participant-joined', (data) => {
                        setParticipantCount(data.count);
                    });

                    socket.on('participant-left', (data) => {
                        setParticipantCount(data.count);
                    });

                    setLoading(false);
                } else {
                    setError('Room not found');
                    setLoading(false);
                }
            } catch (err) {
                setError('Failed to load room');
                setLoading(false);
            }
        };

        fetchRoomAndJoin();

        // Clean up when component unmounts
        return () => {
            leaveRoom(roomId);
        };
    }, [roomId]);

    const handleLeaveRoom = () => {
        // Properly leave the room
        leaveRoom(roomId);
        // Navigate back to home
        navigate('/');
    };

    const copyRoomLink = () => {
        const roomUrl = window.location.href;
        navigator.clipboard.writeText(roomUrl)
            .then(() => {
                setShareTooltip('Link copied!');
                setTimeout(() => setShareTooltip(''), 2000);
            })
            .catch(err => {
                console.error('Failed to copy room link: ', err);
                setShareTooltip('Failed to copy');
                setTimeout(() => setShareTooltip(''), 2000);
            });
    };

    if (loading) {
        return (
            <div>
                Loading room...
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h2>
                    {error}

                </h2>
                <button onClick={
                    navigate('/')}>
                    Back to Home

                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="room-header">
                <div className="room-info">
                    <h1>
                        {room?.name}

                    </h1>
                    <div className="room-meta">
                        <span>
                            Room ID: {roomId}

                        </span>
                        <span>
                            {room?.isPrivate ? 'Private Room' : 'Public Room'}

                        </span>
                        <span>
                            Participants: {participantCount}

                        </span>
                    </div>
                </div>
                <div>
                    <button onClick={copyRoomLink}>
                        Share Room
                        {shareTooltip &&
                            <span>
                                {shareTooltip}

                            </span>
                        }

                    </button>
                    <button onClick={handleLeaveRoom}>
                        Leave Room
                    </button>
                </div>
            </div>
            <div>
                <Canvas roomId={roomId} />
            </div>
        </div>
    );
};

export default Room;