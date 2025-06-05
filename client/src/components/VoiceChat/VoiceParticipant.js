import React, { useEffect, useRef } from 'react';
// import './VoiceParticipant.css';

const VoiceParticipant = ({ username, stream, isMuted, isSelf }) => {
    const audioRef = useRef(null);

    // Connect audio stream to audio element (for other participants)
    useEffect(() => {
        if (audioRef.current && stream && !isSelf) {
            audioRef.current.srcObject = stream;
        }
    }, [stream, isSelf]);

    return (
        <div className={`voice-participant ${isSelf ? 'self' : ''}`}>
            <div className="voice-avatar">
                {username.charAt(0).toUpperCase()}
            </div>
            <div className="voice-username">
                {username}
                {isMuted && (
                    <span className="muted-indicator">
                        (Muted)
                    </span>
                )}
            </div>
            {!isSelf && stream && (
                <audio ref={audioRef} autoPlay playsInline />
            )}
        </div>
    );
};

export default VoiceParticipant;