import React, { useEffect, useState, useRef } from 'react';
import './VoiceChat.css';
import VoiceControls from './VoiceControls';
import VoiceParticipant from './VoiceParticipant';

const VoiceChat = ({ socket, roomId, userId, username, participants }) => {
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [activeVoiceUsers, setActiveVoiceUsers] = useState([]);
    const [audioStream, setAudioStream] = useState(null);

    // Store RTCPeerConnections for each peer
    const peerConnections = useRef({});

    const startVoiceChat = async () => {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setAudioStream(stream);
            setIsVoiceActive(true);

            // Announce to the room that we've joined voice chat
            socket.emit('voice-join-request', roomId, {
                userId,
                username
            });

        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const createPeerConnection = (peerId) => {
        // Create new RTCPeerConnection
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        // Add local audio tracks
        if (audioStream) {
            audioStream.getTracks().forEach(track => {
                pc.addTrack(track, audioStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice-ice-candidate', {
                    target: peerId,
                    sender: userId,
                    candidate: event.candidate,
                    roomId
                });
            }
        };

        // Handle incoming audio streams
        pc.ontrack = (event) => {
            // Create a new audio element for this peer
            setActiveVoiceUsers(prev => {
                const existing = prev.find(u => u.userId === peerId);
                if (existing) {
                    existing.stream = event.streams[0];
                    return [...prev];
                } else {
                    const peerData = participants.find(p => p.id === peerId) || {};
                    return [...prev, {
                        userId: peerId,
                        username: peerData.username || 'User',
                        stream: event.streams[0]
                    }];
                }
            });
        };

        peerConnections.current[peerId] = pc;
        return pc;
    };

    const endVoiceChat = () => {
        // Stop all tracks in the audio stream
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};

        setIsVoiceActive(false);
        setAudioStream(null);

        // Notify the room that we're leaving
        socket.emit('voice-leave', roomId, { userId, username });
    };

    const toggleMute = () => {
        if (audioStream) {
            audioStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted; // Toggle current state
            });
            setIsMuted(!isMuted);
        }
    };

    useEffect(() => {
        if (!socket || !roomId) return;

        // Handle new users joining voice chat
        const handleUserJoined = async (userData) => {
            if (userData.userId === userId) return; // Skip self

            if (isVoiceActive && audioStream) {
                const pc = createPeerConnection(userData.userId);

                try {
                    // Create offer
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    // Send offer to the new participant
                    socket.emit('voice-offer', {
                        target: userData.userId,
                        sender: userId,
                        offer,
                        roomId
                    });
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }
        };

        // Handle incoming WebRTC offers
        const handleOffer = async ({ sender, offer }) => {
            if (!isVoiceActive) return;

            try {
                // Create peer connection if it doesn't exist
                const pc = peerConnections.current[sender] || createPeerConnection(sender);

                // Set remote description from the offer
                await pc.setRemoteDescription(new RTCSessionDescription(offer));

                // Create answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Send answer back to the offerer
                socket.emit('voice-answer', {
                    target: sender,
                    sender: userId,
                    answer,
                    roomId
                });
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        };

        // Handle incoming WebRTC answers
        const handleAnswer = async ({ sender, answer }) => {
            try {
                const pc = peerConnections.current[sender];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        };

        // Handle incoming ICE candidates
        const handleIceCandidate = async ({ sender, candidate }) => {
            try {
                const pc = peerConnections.current[sender];
                if (pc) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        };

        // Handle users leaving voice chat
        const handleUserLeft = (userData) => {
            // Close the peer connection
            if (peerConnections.current[userData.userId]) {
                peerConnections.current[userData.userId].close();
                delete peerConnections.current[userData.userId];
            }

            // Remove from active users
            setActiveVoiceUsers(prev =>
                prev.filter(user => user.userId !== userData.userId)
            );
        };

        socket.on('voice-user-joined', handleUserJoined);
        socket.on('voice-offer', handleOffer);
        socket.on('voice-answer', handleAnswer);
        socket.on('voice-ice-candidate', handleIceCandidate);
        socket.on('voice-user-left', handleUserLeft);

        return () => {
            // Cleanup socket listeners on unmount
            socket.off('voice-user-joined', handleUserJoined);
            socket.off('voice-offer', handleOffer);
            socket.off('voice-answer', handleAnswer);
            socket.off('voice-ice-candidate', handleIceCandidate);
            socket.off('voice-user-left', handleUserLeft);

            // End voice chat when component unmounts
            if (isVoiceActive) {
                endVoiceChat();
            }
        };
    }, [socket, roomId, userId, isVoiceActive, audioStream]);

    return (
        <div className="voice-chat-container">
            <div className="voice-header">
                <h3>Voice Chat</h3>
                <VoiceControls
                    isVoiceActive={isVoiceActive}
                    isMuted={isMuted}
                    onStartVoice={startVoiceChat}
                    onEndVoice={endVoiceChat}
                    onToggleMute={toggleMute}
                />
            </div>
            {isVoiceActive && (
                <div className="voice-participants">
                    {/* Current user */}
                    <VoiceParticipant
                        username={`${username} (You)`}
                        isMuted={isMuted}
                        isSelf={true}
                    />

                    {/* Other participants */}
                    {activeVoiceUsers.map(user => (
                        <VoiceParticipant
                            key={user.userId}
                            username={user.username}
                            stream={user.stream}
                            isMuted={false}
                            isSelf={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoiceChat;