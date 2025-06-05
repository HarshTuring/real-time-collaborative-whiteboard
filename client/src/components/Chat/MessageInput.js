import React, { useState } from 'react';
import './MessageInput.css';

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form className="message-input-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
            />
            <button 
                type="submit" 
                className="send-button"
                disabled={!message.trim()}
            >
                Send
            </button>
        </form>
    );
};

export default MessageInput;