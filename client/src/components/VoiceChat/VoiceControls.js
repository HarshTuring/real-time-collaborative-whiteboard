import React from 'react';
// import './VoiceControls.css';

const VoiceControls = ({
    isVoiceActive,
    isMuted,
    onStartVoice,
    onEndVoice,
    onToggleMute
}) => {
    return (
        <div className="voice-controls">
            {!isVoiceActive ? (
                <button className="voice-join-btn" onClick={onStartVoice}>
                    Join Voice Chat
                </button>
            ) : (
                <>
                    <button 
                        className={`voice-mute-btn ${isMuted ? 'muted' : ''}`} 
                        onClick={onToggleMute}
                    >
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button className="voice-leave-btn" onClick={onEndVoice}>
                        Leave Voice
                    </button>
                </>
            )}
        </div>
    );
};

export default VoiceControls;