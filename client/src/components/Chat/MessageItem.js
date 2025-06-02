import React from 'react';
import './MessageItem.css';

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageItem = ({ message, isOwnMessage }) => {
    const { username, text, timestamp, type } = message;

    // Handle system messages differently
    if (type === 'notification') {
        return (
            <div>
                <div className="message-text">
                    {text}
                </div>
                <span>
                    {formatTimestamp(timestamp)}

                </span>
            </div>
        );
    }

    return (

        <div>
            <div className="message-header">
                <span>
                    {username}

                </span>
                <span>
                    {formatTimestamp(timestamp)}

                </span>
            </div>
            <div>
                {text}
            </div>
        </div>
    );
};

export default MessageItem;