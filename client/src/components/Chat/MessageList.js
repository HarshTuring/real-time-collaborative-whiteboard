import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import './MessageList.css';

const MessageList = ({ messages, currentUserId }) => {
    const messagesEndRef = useRef(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div>
            <div className="message-list">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map(message => (
                        <MessageItem
                            key={message.id}
                            message={message}
                            isOwnMessage={message.userId === currentUserId}
                        />

                    ))
                )}
                <div>
                </div>
            </div>
            );
        </div>
)};

export default MessageList;