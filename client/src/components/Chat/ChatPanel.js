import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { FaComments, FaTimes, FaWindowMinimize } from 'react-icons/fa';
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
    const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const chatPanelRef = useRef(null);

    // Handle dragging functionality
    const handleMouseDown = (e) => {
        if (e.target.closest('.chat-header')) {
            e.preventDefault();
            setIsDragging(true);
            const rect = chatPanelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && chatPanelRef.current) {
            e.preventDefault();
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Add and remove global event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'grabbing';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isDragging]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
        }
    };

    const handleSendMessage = (text) => {
        const newMessage = {
            id: Date.now(),
            userId: currentUser.id,
            username: currentUser.username,
            text,
            timestamp: Date.now()
        };
        setMessages([...messages, newMessage]);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        }, 10000);

        return () => clearTimeout(timer);
    }, [isOpen, messages]);

    return (
        <>
            <button className="chat-toggle-btn" onClick={toggleChat}>
                <FaComments />
                {unreadCount > 0 && !isOpen && (
                    <span className="badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    ref={chatPanelRef}
                    className="chat-panel draggable"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        cursor: isDragging ? 'grabbing' : 'default'
                    }}
                >
                    <div 
                        className="chat-header"
                        onMouseDown={handleMouseDown}
                    >
                        <h3>Room Chat</h3>
                        <div className="chat-controls">
                            <button className="chat-close-btn" onClick={toggleChat}>
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                    <div className="message-list-container">
                        <MessageList messages={messages} currentUserId={currentUser.id} />
                    </div>
                    <div className="message-input-container">
                        <MessageInput onSendMessage={handleSendMessage} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatPanel;