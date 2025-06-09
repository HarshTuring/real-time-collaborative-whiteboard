import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceControls from '../VoiceControls';

describe('VoiceControls Component', () => {
  test('renders join button when voice is not active', () => {
    const mockStartVoice = jest.fn();
    
    render(
      <VoiceControls
        isVoiceActive={false}
        isMuted={false}
        onStartVoice={mockStartVoice}
        onEndVoice={jest.fn()}
        onToggleMute={jest.fn()}
      />
    );
    
    // Check that join button is rendered
    const joinButton = screen.getByText('Join Voice Chat');
    expect(joinButton).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(joinButton);
    
    // Check that onStartVoice was called
    expect(mockStartVoice).toHaveBeenCalledTimes(1);
  });
  
  test('renders mute and leave buttons when voice is active', () => {
    const mockEndVoice = jest.fn();
    const mockToggleMute = jest.fn();
    
    render(
      <VoiceControls
        isVoiceActive={true}
        isMuted={false}
        onStartVoice={jest.fn()}
        onEndVoice={mockEndVoice}
        onToggleMute={mockToggleMute}
      />
    );
    
    // Check that mute and leave buttons are rendered
    const muteButton = screen.getByText('Mute');
    const leaveButton = screen.getByText('Leave Voice');
    
    expect(muteButton).toBeInTheDocument();
    expect(leaveButton).toBeInTheDocument();
    
    // Click the mute button
    fireEvent.click(muteButton);
    
    // Check that onToggleMute was called
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
    
    // Click the leave button
    fireEvent.click(leaveButton);
    
    // Check that onEndVoice was called
    expect(mockEndVoice).toHaveBeenCalledTimes(1);
  });
  
  test('shows unmute button when muted', () => {
    render(
      <VoiceControls
        isVoiceActive={true}
        isMuted={true}
        onStartVoice={jest.fn()}
        onEndVoice={jest.fn()}
        onToggleMute={jest.fn()}
      />
    );
    
    // Check that unmute button is rendered
    const unmuteButton = screen.getByText('Unmute');
    expect(unmuteButton).toBeInTheDocument();
  });
});