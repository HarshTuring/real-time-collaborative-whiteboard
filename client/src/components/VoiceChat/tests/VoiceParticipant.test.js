import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceParticipant from '../VoiceParticipant';

describe('VoiceParticipant Component', () => {
  beforeEach(() => {
    // Mock audio element functionality
    window.HTMLMediaElement.prototype.play = jest.fn();
  });

  test('renders participant information correctly', () => {
    render(
      <VoiceParticipant
        username="Test User"
        isMuted={false}
        isSelf={false}
      />
    );
    
    // Check username is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    // Check avatar is displayed with first letter
    expect(screen.getByText('T')).toBeInTheDocument();
    
    // Check no muted indicator is shown
    expect(screen.queryByText('(Muted)')).not.toBeInTheDocument();
  });
  
  test('renders muted state correctly', () => {
    render(
      <VoiceParticipant
        username="Test User"
        isMuted={true}
        isSelf={false}
      />
    );
    
    // Check muted indicator is shown
    expect(screen.getByText('(Muted)')).toBeInTheDocument();
  });
  
  test('renders self user correctly', () => {
    render(
      <VoiceParticipant
        username="Test User (You)"
        isMuted={false}
        isSelf={true}
      />
    );
    
    // Check username with (You) is displayed
    expect(screen.getByText('Test User (You)')).toBeInTheDocument();
    
    // Check no audio element is rendered for self
    expect(document.querySelector('audio')).not.toBeInTheDocument();
  });
  
  test('sets up audio stream for other participants', () => {
    // Create mock audio stream
    const mockStream = {
      id: 'mock-stream',
      active: true,
      getTracks: () => [{ kind: 'audio' }],
      getAudioTracks: () => [{ kind: 'audio', enabled: true }],
    };
    
    render(
      <VoiceParticipant
        username="Other User"
        stream={mockStream}
        isMuted={false}
        isSelf={false}
      />
    );
    
    // Check audio element is rendered
    const audioElement = document.querySelector('audio');
    expect(audioElement).toBeInTheDocument();
  });
});