import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { FaComments, FaTimes } from 'react-icons/fa';
import {
    sendChatMessage,
    subscribeToMessages,
    subscribeToMessageHistory,
    getRecentChatMessages
} from '../../services/socket';
import './ChatPanel.css';

const ChatPanel = ({ roomId, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [lastReadMessageId, setLastReadMessageId] = useState(null);

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

    // Get message history when component mounts or room changes
    useEffect(() => {
        if (roomId) {
            getRecentChatMessages(roomId);
        }
    }, [roomId]);

    // Subscribe to socket events for chat
    useEffect(() => {
        // Handle new messages
        const handleNewMessage = (message) => {
            setMessages(prev => {
                // Don't add duplicate messages
                const isDuplicate = prev.some(m => m.id === message.id);
                if (isDuplicate) return prev;

                const updatedMessages = [...prev, message];

                // If chat is closed and the message is not from the current user,
                // increment unread count
                if (!isOpen && message.userId !== currentUser.id) {
                    setUnreadCount(count => count + 1);
                }

                return updatedMessages;
            });
        };

        // Handle message history
        const handleMessageHistory = (data) => {
            if (data && data.messages) {
                setMessages(data.messages);

                // Update unread count if chat is closed
                if (!isOpen) {
                    // Find last read message index
                    const lastReadIndex = lastReadMessageId
                        ? data.messages.findIndex(m => m.id === lastReadMessageId)
                        : -1;

                    // If last read message found, count newer messages not from current user
                    if (lastReadIndex >= 0) {
                        const unreadMessages = data.messages
                            .slice(lastReadIndex + 1)
                            .filter(m => m.userId !== currentUser.id);
                        setUnreadCount(unreadMessages.length);
                    } else {
                        // If no last read message, count all messages not from current user
                        const unreadMessages = data.messages
                            .filter(m => m.userId !== currentUser.id);
                        setUnreadCount(unreadMessages.length);
                    }
                }
            }
        };

        // Subscribe to socket events
        const unsubscribeMessages = subscribeToMessages(handleNewMessage);
        const unsubscribeHistory = subscribeToMessageHistory(handleMessageHistory);

        return () => {
            unsubscribeMessages();
            unsubscribeHistory();
        };
    }, [roomId, isOpen, currentUser, lastReadMessageId]);

    // Toggle chat visibility
    const toggleChat = () => {
        setIsOpen(!isOpen);

        if (!isOpen) {
            setUnreadCount(0);

            // Set the last message as read when opening chat
            if (messages.length > 0) {
                setLastReadMessageId(messages[messages.length - 1].id);
            }
        }
    };

    // Send a new message
    const handleSendMessage = (text) => {
        if (text.trim()) {
            sendChatMessage(roomId, text);
        }
    };

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