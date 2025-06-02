import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import './MessageInput.css';

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Trim and validate message
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        // Send message to parent component
        onSendMessage(trimmedMessage);

        // Clear input
        setMessage('');
    };

    return (
        <div>
            <form>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    aria-label="Message"
                    className="message-input"
                />
                <button>
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;