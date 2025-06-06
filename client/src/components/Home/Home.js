import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { createNewRoom, getPublicRooms, checkRoomAccess } from '../../services/api';
import RoomCard from './RoomCard';

const Home = () => {
    const [publicRooms, setPublicRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchPublicRooms();
    }, []);

    const fetchPublicRooms = async () => {
        try {
            setLoading(true);
            const response = await getPublicRooms();
            if (response.success) {
                setPublicRooms(response.rooms);
            } else {
                setError('Failed to load public rooms');
            }
        } catch (err) {
            setError('Failed to load public rooms');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            // createNewRoom expects roomName and isPrivate as separate parameters
            const response = await createNewRoom(newRoomName || undefined, isPrivate);
            if (response.success) {
                navigate(`/room/${response.room.id}`);
            } else {
                setError(response.error || 'Failed to create room');
            }
        } catch (err) {
            setError('Failed to create room');
            console.error(err);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinRoomId.trim()) return;

        try {
            const response = await checkRoomAccess(joinRoomId);

            if (response.success && response.exists && response.isAccessible) {
                navigate(`/room/${joinRoomId}`);
            } else if (response.success && !response.exists) {
                setError('Room does not exist');
            } else {
                setError('Room is not accessible');
            }
        } catch (err) {
            setError('Failed to join room');
            console.error(err);
        }
    };

    return (
        <div className="home-page">
            <header className="home-header">
                <h1>
                    Collaborative Whiteboard
                </h1>
                <p>
                    Create or join a whiteboard room to start collaborating in real-time
                </p>
            </header>
            <div className="action-containers">
                {/* Create Room Container */}
                <div className="action-container">
                    <h2>
                        Create a New Room
                    </h2>
                    <form onSubmit={handleCreateRoom}>
                        <div className="input-group">
                            <label>
                                Room Name (Optional)
                            </label>
                            <input
                                type="text"
                                id="room-name"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Enter room name"
                            />
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                />
                                <span className="checkbox-text">
                                    Make room private
                                </span>
                            </label>
                        </div>
                        <button className="btn-primary">
                            Create Room
                        </button>
                    </form>
                </div>

                {/* Join Room Container */}
                <div className="action-container">
                    <h2>
                        Join Existing Room
                    </h2>
                    <form onSubmit={handleJoinRoom}>
                        <div className="input-group">
                            <label>
                                Room ID
                            </label>
                            <input
                                type="text"
                                id="room-id"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                placeholder="Enter room ID"
                                required
                            />
                        </div>
                        <button className="btn-primary">
                            Join Room
                        </button>
                    </form>
                </div>
            </div>

            {error &&
                <div className="error-message">
                    {error}
                </div>
            }

            <section className="public-rooms-section">
                <h2>
                    Public Rooms
                </h2>
                {loading ? (
                    <div className="loading">
                        Loading rooms...
                    </div>
                ) : publicRooms.length > 0 ? (
                    <div className="room-cards">
                        {publicRooms.map(room => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onClick={() => navigate(`/room/${room.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="no-rooms">
                        No public rooms available. Create one to get started!
                    </p>
                )}
            </section>
        </div>
    );
};

export default Home;