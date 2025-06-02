import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import './MessageItem.css';

const MessageItem = ({ message, isCurrentUser }) => {
    const { text, username, timestamp, type } = message;

    if (type === 'notification') {
        return (
            <div className="message-item notification">
                <span className="notification-text">{text}</span>
            </div>
        );
    }

    return (
        <div className={`message-item ${isCurrentUser ? 'own-message' : 'other-message'}`}>
            <div className="message-content">
                {!isCurrentUser && (
                    <div className="message-sender">{username}</div>
                )}
                <div className="message-bubble">
                    {text}
                </div>
                <div className="message-time">
                    {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;