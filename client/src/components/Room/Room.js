import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../WhiteboardCanvas/Canvas';
import ChatPanel from '../Chat/ChatPanel';
import { getRoomDetails } from '../../services/api';
import { joinRoom, leaveRoom } from '../../services/socket';
import './Room.css';
import UsernameModal from '../UsernameModal/UsernameModal';
import Cookies from 'js-cookie';
import VoiceChat from '../VoiceChat/VoiceChat';

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
    const [drawingUsers, setDrawingUsers] = useState(new Map());
    const [userId, setUserId] = useState("")

    const [isAdmin, setIsAdmin] = useState(false);
    const [isCanvasLocked, setIsCanvasLocked] = useState(false);

    useEffect(() => {
        setUserId(Cookies.get("userId"));
        const handleUserDrawingUpdate = (event) => {
            const { userId, isDrawing, username, color } = event.detail;

            setDrawingUsers(prev => {
                const newMap = new Map(prev);
                if (isDrawing) {
                    newMap.set(userId, { username, color });
                } else {
                    newMap.delete(userId);
                }
                return newMap;
            });
        };

        // Listen for drawing updates from the Canvas component
        document.addEventListener('user-drawing-update', handleUserDrawingUpdate);

        // Socket event handlers for room updates
        const handleParticipantJoined = (data) => {
            setParticipantCount(data.count);
            if (data.participants) {
                setParticipants(data.participants);
            }
        };

        // Update room details handler
        const handleRoomUpdated = (roomData) => {
            setRoom(roomData);
            setParticipantCount(roomData.participantCount);

            // Update drawing status from participants data
            if (roomData.participants) {
                const newDrawingUsers = new Map();

                roomData.participants.forEach(participant => {
                    if (participant.isDrawing) {
                        newDrawingUsers.set(participant.id, {
                            username: participant.username,
                            color: participant.drawingColor || '#000000'
                        });
                    }
                });

                setDrawingUsers(newDrawingUsers);
            }
        };

        // Cleanup
        return () => {
            document.removeEventListener('user-drawing-update', handleUserDrawingUpdate);
        };
    }, []);

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

            const currentUser = data.participants.find(p => p.id === userId);
            if (currentUser) {
                setIsAdmin(currentUser.isAdmin);
            }
        });

        socketInstance.on('canvas-lock-status', (data) => {
            setIsCanvasLocked(data.locked);
        });

        socketInstance.on('error', (error) => {
            console.error('Socket error:', error.message);
            // You could add a toast notification here
        });

        socketInstance.on('room-updated', (roomData) => {
            // Update lock status from room data
            setIsCanvasLocked(roomData.isLocked);

            // Update admin status if available
            if (roomData.participants) {
                const currentUser = roomData.participants.find(p => p.id === userId);
                if (currentUser) {
                    setIsAdmin(currentUser.isAdmin);
                }
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

    const toggleCanvasLock = () => {
        if (isAdmin) {
            socket.emit('toggle-canvas-lock', { roomId });
        }
    };

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
                        <div className="room-actions">
                            {isAdmin && (
                                <button onClick={toggleCanvasLock} className="lock-button">
                                    {isCanvasLocked ? '🔓 Unlock Canvas' : '🔒 Lock Canvas'}
                                </button>
                            )}
                            <button onClick={copyRoomLink} className="share-button">
                                Share Room
                                {shareTooltip && <span className="tooltip">{shareTooltip}</span>}
                            </button>
                            <button onClick={handleLeaveRoom} className="leave-button">
                                Leave Room
                            </button>
                        </div>
                    </div>
                    {showParticipantsList && (
                        <div className="participants-list-container">
                            <h3>Participants</h3>
                            <ul className="participants-ul">
                                {participants.map((participant) => (
                                    <li key={participant.id} className="participant-item">
                                        <span className="participant-name" style={{
                                            color: drawingUsers.get(participant.id)?.color || '#000000'
                                        }}>
                                            {participant.username}
                                            {drawingUsers.has(participant.id) && ' (drawing)'}
                                            {participant.id === userId && ' (you)'}
                                            {participant.isAdmin &&
                                                <span>
                                                    👑
                                                </span>
                                            }
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="canvas-container">
                        <Canvas roomId={roomId} isAdmin={isAdmin} isLocked={isCanvasLocked} />
                    </div>
                    <VoiceChat
                        socket={socket}
                        roomId={roomId}
                        userId={userId}
                        username={username}
                        participants={participants}
                    />
                    <ChatPanel
                        roomId={roomId}
                        currentUser={{ id: socket?.id, username: username }}
                    />
                </>
            )}
        </div>
    );
};

export default Room;