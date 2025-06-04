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
        <div>
            {!isVoiceActive ? (
                <button onClick={onStartVoice}>
                    Join Voice Chat
                </button>
            ) : (
                <>
                    <button onClick={onToggleMute}>
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button onClick={onEndVoice}>
                        Leave Voice
                    </button>
                </>
            )}
        </div>
    );
};

export default VoiceControls;