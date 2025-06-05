import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceChat from '../VoiceChat';

// Mock socket.io-client
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockEmit = jest.fn();

jest.mock('socket.io-client', () => {
  return {
    io: jest.fn(() => ({
      on: mockOn,
      off: mockOff,
      emit: mockEmit,
    })),
  };
});

// Mock MediaDevices API
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(),
};

// Mock WebRTC APIs
global.RTCPeerConnection = class MockRTCPeerConnection {
  constructor() {
    this.onicecandidate = null;
    this.ontrack = null;
    this.onconnectionstatechange = null;
    this.oniceconnectionstatechange = null;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.remoteDescription = null;
    this.localDescription = null;
    this.currentRemoteDescription = null;
  }
  
  addTrack = jest.fn();
  close = jest.fn();
  createOffer = jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp' }));
  createAnswer = jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp' }));
  setLocalDescription = jest.fn(() => Promise.resolve());
  setRemoteDescription = jest.fn(() => Promise.resolve());
  addIceCandidate = jest.fn(() => Promise.resolve());
  
  // Simulate connection state changes
  simulateConnectionStateChange(state) {
    this.connectionState = state;
    if (this.onconnectionstatechange) {
      this.onconnectionstatechange();
    }
  }
  
  // Simulate ICE candidate
  simulateICECandidate(candidate) {
    if (this.onicecandidate) {
      this.onicecandidate({ candidate });
    }
  }
  
  // Simulate incoming track
  simulateTrack(track, stream) {
    if (this.ontrack) {
      this.ontrack({ track, streams: [stream] });
    }
  }
};

global.RTCSessionDescription = class MockRTCSessionDescription {
  constructor(init) {
    Object.assign(this, init);
  }
};

global.RTCIceCandidate = class MockRTCIceCandidate {
  constructor(init) {
    Object.assign(this, init);
  }
};

// Mock audio element
window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());

// Helper function to create a mock audio stream
const createMockStream = () => {
  const mockTrack = {
    kind: 'audio',
    enabled: true,
    stop: jest.fn(),
  };
  
  return {
    id: 'mock-stream-id',
    active: true,
    getTracks: jest.fn(() => [mockTrack]),
    getAudioTracks: jest.fn(() => [mockTrack]),
  };
};

describe('VoiceChat Component', () => {
  let mockProps;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset socket mocks
    mockOn.mockReset();
    mockOff.mockReset();
    mockEmit.mockReset();
    
    // Standard props for the component
    mockProps = {
      socket: {
        on: mockOn,
        off: mockOff,
        emit: mockEmit,
      },
      roomId: 'test-room-123',
      userId: 'test-user-456',
      username: 'Test User',
      participants: [
        { id: 'test-user-456', username: 'Test User', socketId: 'socket-1' },
        { id: 'other-user-789', username: 'Other User', socketId: 'socket-2' },
      ],
    };
    
    // Mock successful microphone access
    navigator.mediaDevices.getUserMedia.mockResolvedValue(createMockStream());
    
    // Spy on console.log for debugging logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  test('renders initial voice chat UI', () => {
    render(
<VoiceChat {...mockProps} />

);

// Check for main elements
expect(screen.getByText('Voice Chat')).toBeInTheDocument();
expect(screen.getByText('Join Voice Chat')).toBeInTheDocument();
});

test('starts voice chat when join button is clicked', async () => {
render(

<VoiceChat {...mockProps} />

);

// Click the join button
fireEvent.click(screen.getByText('Join Voice Chat'));

// Wait for async operations
await act(async () => {
  await Promise.resolve();
});

// Check that getUserMedia was called with audio
expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });

// Check that socket emitted join request
expect(mockEmit).toHaveBeenCalledWith('voice-join-request', 'test-room-123', {
  userId: 'test-user-456',
  username: 'Test User',
});

// Check UI has updated to show active state
expect(screen.getByText('Mute')).toBeInTheDocument();
expect(screen.getByText('Leave Voice')).toBeInTheDocument();
expect(screen.getByText('Test User (You)')).toBeInTheDocument();
expect(screen.getByText('Waiting for others to join...')).toBeInTheDocument();
});

test('handles errors when accessing microphone fails', async () => {
// Setup microphone access to fail
navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));

render(
<VoiceChat {...mockProps} />

);

// Click the join button
fireEvent.click(screen.getByText('Join Voice Chat'));

// Wait for async operations to fail
await act(async () => {
  await Promise.resolve().catch(() => {});
});

// Check error was logged
expect(console.error).toHaveBeenCalled();

// Join button should still be there (not switched to active state)
expect(screen.getByText('Join Voice Chat')).toBeInTheDocument();
});

test('toggles mute state correctly', async () => {
render(

<VoiceChat {...mockProps} />

);

// Start voice chat
fireEvent.click(screen.getByText('Join Voice Chat'));

// Wait for async operations
await act(async () => {
  await Promise.resolve();
});

// Initial state should be unmuted
expect(screen.getByText('Mute')).toBeInTheDocument();

// Click mute button
fireEvent.click(screen.getByText('Mute'));

// Should now show Unmute
expect(screen.getByText('Unmute')).toBeInTheDocument();

// Click again
fireEvent.click(screen.getByText('Unmute'));

// Should toggle back
expect(screen.getByText('Mute')).toBeInTheDocument();
});

test('creates peer connection when another user joins', async () => {
// Render and start voice chat
render(

<VoiceChat {...mockProps} />

);

fireEvent.click(screen.getByText('Join Voice Chat'));
await act(async () => {
  await Promise.resolve();
});

// Find the handler registered for voice-user-joined event
let userJoinedHandler;
mockOn.mock.calls.forEach(call => {
  if (call[0] === 'voice-user-joined') {
    userJoinedHandler = call[1];
  }
});

expect(userJoinedHandler).toBeDefined();

// Manually trigger the handler with test data
await act(async () => {
  await userJoinedHandler({
    userId: 'other-user-789',
    username: 'Other User',
  });
});

// Check that an offer was created and sent
expect(mockEmit).toHaveBeenCalledWith('voice-offer', {
  target: 'other-user-789',
  sender: 'test-user-456',
  offer: expect.anything(),
  roomId: 'test-room-123',
});
});

test('handles incoming WebRTC offer correctly', async () => {
// Render and start voice chat
render(

<VoiceChat {...mockProps} />

);

fireEvent.click(screen.getByText('Join Voice Chat'));
await act(async () => {
  await Promise.resolve();
});

// Find the handler registered for voice-offer event
let offerHandler;
mockOn.mock.calls.forEach(call => {
  if (call[0] === 'voice-offer') {
    offerHandler = call[1];
  }
});

expect(offerHandler).toBeDefined();

// Manually trigger the handler with test data
await act(async () => {
  await offerHandler({
    sender: 'other-user-789',
    offer: { type: 'offer', sdp: 'mock-offer-sdp' },
  });
});

// Check that an answer was created and sent
expect(mockEmit).toHaveBeenCalledWith('voice-answer', {
  target: 'other-user-789',
  sender: 'test-user-456',
  answer: expect.anything(),
  roomId: 'test-room-123',
});
});

test('ends voice chat properly', async () => {
// Render and start voice chat
render(

<VoiceChat {...mockProps} />

);

fireEvent.click(screen.getByText('Join Voice Chat'));
await act(async () => {
  await Promise.resolve();
});

// Click the leave button
fireEvent.click(screen.getByText('Leave Voice'));

// Check that socket emitted leave message
expect(mockEmit).toHaveBeenCalledWith('voice-leave', 'test-room-123', {
  userId: 'test-user-456',
  username: 'Test User',
});

// Check UI has updated to show inactive state
expect(screen.getByText('Join Voice Chat')).toBeInTheDocument();
});

test('cleans up resources when unmounted', async () => {
const { unmount } = render(

<VoiceChat {...mockProps} />

);

// Start voice chat
fireEvent.click(screen.getByText('Join Voice Chat'));
await act(async () => {
  await Promise.resolve();
});

// Unmount the component
unmount();

// Check that socket listeners were removed
expect(mockOff).toHaveBeenCalledWith('voice-user-joined', expect.any(Function));
expect(mockOff).toHaveBeenCalledWith('voice-offer', expect.any(Function));
expect(mockOff).toHaveBeenCalledWith('voice-answer', expect.any(Function));
expect(mockOff).toHaveBeenCalledWith('voice-ice-candidate', expect.any(Function));
expect(mockOff).toHaveBeenCalledWith('voice-user-left', expect.any(Function));

// Check that voice chat was ended
expect(mockEmit).toHaveBeenCalledWith('voice-leave', 'test-room-123', {
  userId: 'test-user-456',
  username: 'Test User',
});
});
});