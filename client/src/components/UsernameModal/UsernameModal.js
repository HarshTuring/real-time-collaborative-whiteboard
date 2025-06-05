import React, { useState, useEffect } from 'react';
import './UsernameModal.css';

const UsernameModal = ({ isOpen, onSubmit, initialUsername = '' }) => {
    const [username, setUsername] = useState(initialUsername);
    const [error, setError] = useState('');
    const [isChangingName, setIsChangingName] = useState(false);

    useEffect(() => {
        // Reset state when modal opens
        if (isOpen) {
            setUsername(initialUsername || '');
            setError('');
            // Determine if this is a name change or initial setting
            setIsChangingName(!!initialUsername);
        }
    }, [isOpen, initialUsername]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate username
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setError('Username cannot be empty.');
            return;
        }

        if (trimmedUsername.length < 2) {
            setError('Username must be at least 2 characters long.');
            return;
        }

        if (trimmedUsername.length > 20) {
            setError('Username must be less than 20 characters long.');
            return;
        }

        // Submit the valid username
        onSubmit(trimmedUsername);
        setError('');
    };

    // If modal is not open, don't render
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="username-modal">
                <div className="username-modal-content">
                    <h2>
                        {isChangingName ? 'Change Your Display Name' : 'Enter Your Display Name'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <p>
                            Choose a display name that will be visible to other users in this whiteboard room.
                        </p>
                        <div className="input-group">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name"
                                autoFocus
                            />
                            {error && <div className="error-message">{error}</div>}
                        </div>
                        <button type="submit" className="continue-button">
                            {isChangingName ? 'Update' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UsernameModal;