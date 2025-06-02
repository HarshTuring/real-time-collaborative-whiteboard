import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import IconButton from './IconButton';
import { FaComments, FaTimes } from 'react-icons/fa';
import './ChatPanel.css';

// Mock data for testing
const MOCK_MESSAGES = [
    { id: 1, userId: 'user1', username: 'Alice', text: 'Hello everyone!', timestamp: Date.now() - 1000 * 60 * 15 },
    { id: 2, userId: 'user2', username: 'Bob', text: 'Hi Alice, how are you?', timestamp: Date.now() - 1000 * 60 * 14 },
    { id: 3, userId: 'user3', username: 'Charlie', text: 'Hey folks, check out my latest drawing!', timestamp: Date.now() - 1000 * 60 * 10 },
    { id: 4, userId: 'user1', username: 'Alice', text: 'I\'m doing great Bob, thanks for asking!', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 5, userId: 'system', username: 'System', text: 'David has joined the room', timestamp: Date.now() - 1000 * 60 * 3, type: 'notification' },
    { id: 6, userId: 'user4', username: 'David', text: 'Hello everyone, glad to be here!', timestamp: Date.now() - 1000 * 60 * 2 },
];

const ChatPanel = ({ roomId, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0); // Reset unread count when opening
        }
    };

    const handleSendMessage = (text) => {
        // In the actual implementation, this would send via socket
        const newMessage = {
            id: Date.now(),
            userId: currentUser.id,
            username: currentUser.username,
            text,
            timestamp: Date.now()
        };

        setMessages([...messages, newMessage]);
    };

    // In the actual implementation, this would listen for socket events
    useEffect(() => {
        // Simulate receiving new messages
        const timer = setTimeout(() => {
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        }, 10000);

        return () => clearTimeout(timer);
    }, [isOpen, messages]);

    return (
        <>
            {/* Chat toggle button */}
            <div>
                <IconButton
                    icon={isOpen ? <FaTimes />

                        :

                        <FaComments />
                    }
                    onClick={toggleChat}
                    badge={unreadCount > 0 && !isOpen ? unreadCount : null}
                    label={isOpen ? "Close chat" : "Open chat"}
                />

            </div>
            {/* Chat panel */}
            <div>
                <div className="chat-header">
                    <h3>
                        Room Chat

                    </h3>
                    <button>
                        <FaTimes />
                    </button>
                </div>
                <MessageList messages={messages} currentUserId={currentUser.id} />
                <MessageInput onSendMessage={handleSendMessage} />
            </div>
        </>
    );
};

export default ChatPanel;