import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicRooms, createNewRoom, checkRoomAccess } from '../../services/api';
import './Home.css';

const Home = () => {
    const [publicRooms, setPublicRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoomName, setNewRoomName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    // useEffect(()=>{console.log(publicRooms)}, [publicRooms])

    // Fetch public rooms on component mount
    useEffect(() => {
        const fetchPublicRooms = async () => {
            try {
                setLoading(true);
                const data = await getPublicRooms();
                if (data.success) {
                    setPublicRooms(data.rooms);
                }
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch rooms');
                setLoading(false);
            }
        };

        fetchPublicRooms();
    }, []);

    // Handler for creating a new room
    const handleCreateRoom = async (e) => {
        e.preventDefault();

        if (!newRoomName.trim()) {
            setError('Please enter a room name');
            return;
        }

        try {
            const data = await createNewRoom(newRoomName, isPrivate);
            if (data.success) {
                navigate(`/room/${data.room.id}`);
            } else {
                setError('Failed to create room');
            }
        } catch (err) {
            setError('Failed to create room');
        }
    };

    // Handler for joining a room by ID
    const handleJoinRoom = async (e) => {
        e.preventDefault();

        if (!joinRoomId.trim()) {
            setError('Please enter a room ID');
            return;
        }

        try {
            // Check if room exists and is accessible
            const data = await checkRoomAccess(joinRoomId);
            if (data.success) {
                navigate(`/room/${joinRoomId}`);
            } else {
                setError(data.message || 'Room not found or is private');
            }
        } catch (err) {
            setError('Room not found or is private');
        }
    };

    return (
        <div>
            <h1>
                Collaborative Whiteboard

            </h1>
            {error && <div className="error-message">{error}
            </div>
            }

            <div>
                <div className="home-section">
                    <h2>
                        Create a New Room

                    </h2>
                    <form onSubmit={handleCreateRoom}>
                        <div className="form-group">
                            <label>
                                Room Name

                            </label>
                            <input
                                type="text"
                                id="roomName"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Enter room name"
                            />
                        </div>
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                />
                                Make room private
                            </label>
                        </div>
                        <button>
                            Create Room

                        </button>
                    </form>
                </div>
                <div>
                    <h2>
                        Join a Room by ID

                    </h2>
                    <form onSubmit={handleJoinRoom}>
                        <div className="form-group">
                            <label>
                                Room ID

                            </label>
                            <input
                                type="text"
                                id="roomId"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                placeholder="Enter room ID"
                            />
                        </div>
                        <button>
                            Join Room

                        </button>
                    </form>
                </div>
            </div>
            <div>
                <h2>
                    Available Public Rooms

                </h2>
                {loading ? (
                    <p>
                        Loading rooms...

                    </p>
                ) : publicRooms.length > 0 ? (
                    <div className="room-list">
                        {publicRooms.map((room) => (
                            <div key={room.id} className="room-card" onClick={() => navigate(`/room/${room.id}`)}>
                                <h3>
                                    {room.name}

                                </h3>
                                <p>
                                    Room ID: {room.id}

                                </p>
                                <p>
                                    Participants: {room.participantCount}

                                </p>
                                <button>
                                    Join

                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        No public rooms available. Create one!

                    </p>
                )}
            </div>
        </div>
    );
};

export default Home;