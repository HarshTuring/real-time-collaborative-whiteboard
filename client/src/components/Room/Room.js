import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../WhiteboardCanvas/Canvas';
import { getRoomDetails } from '../../services/api';
import { joinRoom, leaveRoom } from '../../services/socket';
import './Room.css';
import UsernameModal from '../UsernameModal/UsernameModal';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [participantCount, setParticipantCount] = useState(0);
    const [shareTooltip, setShareTooltip] = useState('');
    const [showUsernameModal, setShowUsernameModal] = useState(true);
    const [username, setUsername] = useState('');
    const [participants, setParticipants] = useState([]);
    const [socket, setSocket] = useState(null);
    const [showParticipantsList, setShowParticipantsList] = useState(true);

    useEffect(() => {
        // Fetch room details
        const fetchRoom = async () => {
            try {
                setLoading(true);
                const data = await getRoomDetails(roomId);

                if (data.success) {
                    setRoom(data.room);
                    setParticipantCount(data.room.participantCount);

                    if (data.room.participants) {
                        setParticipants(data.room.participants);
                    }

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

        fetchRoom();
    }, [roomId]);

    const handleUsernameSubmit = (submittedUsername) => {
        setUsername(submittedUsername);
        setShowUsernameModal(false);

        // Join the room via socket after username is set
        const socketInstance = joinRoom(roomId, submittedUsername);
        setSocket(socketInstance);

        // Listen for room participants information
        socketInstance.on('room-participants', (data) => {
            console.log('Received room participants:', data);
            if (data.participants) {
                setParticipants(data.participants);
                setParticipantCount(data.count);
            }
        });

        // Listen for participant changes
        socketInstance.on('participant-joined', (data) => {
            console.log('Participant joined:', data);
            setParticipantCount(data.count);
            if (data.participants) {
                setParticipants(data.participants);
            }
        });

        socketInstance.on('participant-left', (data) => {
            console.log('Participant left:', data);
            setParticipantCount(data.count);
            if (data.participants) {
                setParticipants(data.participants);
            }
        });

        // Listen for username updates
        socketInstance.on('username-updated', (data) => {
            console.log('Username updated:', data);
            if (data.participants) {
                setParticipants(data.participants);
            }
        });
    };

    const handleLeaveRoom = () => {
        leaveRoom(roomId);
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

    const toggleParticipantsList = () => {
        setShowParticipantsList(!showParticipantsList);
    };

    if (loading) {
        return (
            <div>
                Loading room...

            </div>)
            ;
    }

    if (error) {
        return (
            <div>
                <h2>
                    {error}

                </h2>
                <button onClick={
                    navigate('/')}>Back to Home

                </button>
            </div>
        );
    }

    return (
        <div>
            <UsernameModal
                isOpen={showUsernameModal}
                onSubmit={handleUsernameSubmit}
            />
            {!showUsernameModal && (
                <>
                    <div className="room-header">
                        <div className="room-info">
                            <h1>
                                {room?.name || "Room: " + roomId}

                            </h1>
                            <div className="room-meta">
                                <span>
                                    Room ID: {roomId}

                                </span>
                                <span>
                                    {room?.isPrivate ? 'Private Room' : 'Public Room'}

                                </span>
                                <div className="participants-counter" onClick={toggleParticipantsList}>
                                    <span>
                                        Participants: {participantCount}

                                    </span>
                                    <span>
                                        {showParticipantsList ? '▼' : '▲'}

                                    </span>
                                </div>
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
                        <div className={`participants-list-container ${showParticipantsList ? 'show' : 'hide'}`}>
                            <h3>
                                Connected Users

                            </h3>
                            {participants.length === 0 ? (
                                <p>
                                    No other participants yet

                                </p>
                            ) : (
                                <ul>
                                    {participants.map(participant => (
                                        <li key={participant.id}>
                                            <span>
                                                {participant.username}
                                                {participant.id === socket?.id && <span className="you-indicator"> (You)
                                                </span>
                                                }
                                            </span>

                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <Canvas roomId={roomId} username={username} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Room;