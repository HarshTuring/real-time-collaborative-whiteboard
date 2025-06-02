import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Canvas from './Canvas';
import { initializeSocket, joinRoom } from '../../services/socket';

// Mock the socket service
jest.mock('../../services/socket', () => ({
  initializeSocket: jest.fn(),
  joinRoom: jest.fn(() => {
    return {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };
  })
}));

// Canvas setup requires a roomId
const mockRoomId = 'test-room-123';

describe('Canvas Component', () => {
  // Basic rendering tests
  test('renders the canvas and toolbar', () => {
    render(<Canvas roomId={mockRoomId} />);
    
    // Canvas should be visible
    const canvas = screen.getByRole('canvas', { hidden: true });
    expect(canvas).toBeInTheDocument();
    
    // Toolbar should be visible with color and width controls
    const colorLabel = screen.getByText(/Color:/i);
    const widthLabel = screen.getByText(/Width:/i);
    const clearButton = screen.getByText(/Clear Canvas/i);
    
    expect(colorLabel).toBeInTheDocument();
    expect(widthLabel).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();
  });

  // Feature 1: Brush Color Tests
  describe('Brush Color Feature', () => {
    test('default color is black (#000000)', () => {
      render(<Canvas roomId={mockRoomId} />);
      
      // The color input should have the default value
      const colorInput = screen.getByLabelText('Select custom drawing color');
      expect(colorInput.value).toBe('#000000');
      
      // The black color preset should be selected
      const blackPreset = screen.getByLabelText('Select color #000000');
      expect(blackPreset).toHaveClass('selected');
    });
    
    test('can change color with preset buttons', () => {
      const { container } = render(<Canvas roomId={mockRoomId} />);
      
      // Click on the red color preset
      const redPreset = screen.getByLabelText('Select color #FF0000');
      fireEvent.click(redPreset);
      
      // The color input should be updated
      const colorInput = screen.getByLabelText('Select custom drawing color');
      expect(colorInput.value).toBe('#ff0000');
      
      // The red preset should now have the selected class
      expect(redPreset).toHaveClass('selected');
      
      // Previously selected preset (black) should not have the selected class
      const blackPreset = screen.getByLabelText('Select color #000000');
      expect(blackPreset).not.toHaveClass('selected');
    });
    
    test('emits drawing status update with new color when already drawing', async () => {
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      
      joinRoom.mockReturnValue(mockSocket);
      
      const { container } = render(<Canvas roomId={mockRoomId} />);
      
      // Start drawing to set isUserDrawing to true
      const canvas = container.querySelector('canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      // Change color while "drawing"
      const bluePreset = screen.getByLabelText('Select color #0000FF');
      fireEvent.click(bluePreset);
      
      // Wait for the socket emit to be called with the new color
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('update-drawing-status', {
          roomId: mockRoomId, 
          isDrawing: true,
          color: '#0000FF'
        });
      });
    });
  });

  // Feature 2: Brush Width Tests
  describe('Brush Width Feature', () => {
    test('default width is 3px', () => {
      render(<Canvas roomId={mockRoomId} />);
      
      // Look for the width value displayed in the UI
      const widthDisplay = screen.getByText('3px');
      expect(widthDisplay).toBeInTheDocument();
      
      // The 3px preset button should be selected
      const widthPresets = screen.getAllByRole('button', { name: /Set line width to \d+px/i });
      const width3Preset = widthPresets.find(button => button.getAttribute('aria-label') === 'Set line width to 3px');
      expect(width3Preset).toHaveClass('selected');
    });
    
    test('can change width with preset buttons', () => {
      render(<Canvas roomId={mockRoomId} />);
      
      // Find the 8px preset and click it
      const widthPresets = screen.getAllByRole('button', { name: /Set line width to \d+px/i });
      const width8Preset = widthPresets.find(button => button.getAttribute('aria-label') === 'Set line width to 8px');
      fireEvent.click(width8Preset);
      
      // The display should update to show 8px
      const widthDisplay = screen.getByText('8px');
      expect(widthDisplay).toBeInTheDocument();
      
      // The 8px preset should now be selected
      expect(width8Preset).toHaveClass('selected');
      
      // Previously selected preset (3px) should not have the selected class
      const width3Preset = widthPresets.find(button => button.getAttribute('aria-label') === 'Set line width to 3px');
      expect(width3Preset).not.toHaveClass('selected');
    });
    
    test('can change width with the slider', () => {
      render(<Canvas roomId={mockRoomId} />);
      
      // Find the slider and change its value to 15
      const widthSlider = screen.getByLabelText('Adjust line width');
      fireEvent.change(widthSlider, { target: { value: '15' } });
      
      // The display should update to show 15px
      const widthDisplay = screen.getByText('15px');
      expect(widthDisplay).toBeInTheDocument();
      
      // None of the presets should be selected as 15 is not a preset value
      const widthPresets = screen.getAllByRole('button', { name: /Set line width to \d+px/i });
      widthPresets.forEach(preset => {
        expect(preset).not.toHaveClass('selected');
      });
    });
    
    test('sends line with correct width when drawing', async () => {
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      
      joinRoom.mockReturnValue(mockSocket);
      
      const { container } = render(<Canvas roomId={mockRoomId} />);
      
      // Change the width to 12px
      const widthPresets = screen.getAllByRole('button', { name: /Set line width to \d+px/i });
      const width12Preset = widthPresets.find(button => button.getAttribute('aria-label') === 'Set line width to 12px');
      fireEvent.click(width12Preset);
      
      // Draw a line
      const canvas = container.querySelector('canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      // Check that the socket emits with the correct width
      expect(mockSocket.emit).toHaveBeenCalledWith('draw-line', {
        roomId: mockRoomId,
        line: expect.objectContaining({
          width: 12
        })
      });
    });
  });

  // Feature 3: Highlighting Current Drawing User
  describe('Drawing User Highlighting Feature', () => {
    test('emits drawing status when user starts drawing', async () => {
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      
      joinRoom.mockReturnValue(mockSocket);
      
      const { container } = render(<Canvas roomId={mockRoomId} />);
      
      // Start drawing
      const canvas = container.querySelector('canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      // Verify that the socket emit is called with the correct parameters
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('update-drawing-status', {
          roomId: mockRoomId, 
          isDrawing: true,
          color: '#000000'  // Default color
        });
      });
    });
    
    test('emits drawing status when user stops drawing after debounce timeout', async () => {
      jest.useFakeTimers();
      
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      
      joinRoom.mockReturnValue(mockSocket);
      
      const { container } = render(<Canvas roomId={mockRoomId} />);
      
      // Start and then stop drawing
      const canvas = container.querySelector('canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);
      
      // Before debounce timeout, it shouldn't emit "not drawing" status
      expect(mockSocket.emit).not.toHaveBeenCalledWith('update-drawing-status', {
        roomId: mockRoomId, 
        isDrawing: false
      });
      
      // Advance timers by more than the debounce timeout (3 seconds)
      jest.advanceTimersByTime(3100);
      
      // Now it should have emitted the "not drawing" status
      expect(mockSocket.emit).toHaveBeenCalledWith('update-drawing-status', {
        roomId: mockRoomId, 
        isDrawing: false
      });
      
      jest.useRealTimers();
    });
    
    test('forwards user-drawing-update events to document', async () => {
      // Mock document.dispatchEvent
      const originalDispatchEvent = document.dispatchEvent;
      document.dispatchEvent = jest.fn();
      
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      
      // Setup the mock socket to trigger the user-drawing-update event
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'user-drawing-update') {
          // Store the callback to call it later
          mockSocket.userDrawingUpdateCallback = callback;
        }
      });
      
      joinRoom.mockReturnValue(mockSocket);
      
      render(<Canvas roomId={mockRoomId} />);
      
      // Find the callback that was registered for the user-drawing-update event
      const userDrawingUpdateCallback = mockSocket.userDrawingUpdateCallback;
      expect(userDrawingUpdateCallback).toBeDefined();
      
      // Simulate receiving a user-drawing-update event
      const drawingUpdateData = { 
        userId: 'user123', 
        isDrawing: true, 
        username: 'TestUser',
        color: '#FF0000'
      };
      
      if (userDrawingUpdateCallback) {
        userDrawingUpdateCallback(drawingUpdateData);
      }
      
      // Check if document.dispatchEvent was called with a CustomEvent with the right data
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'user-drawing-update',
          detail: drawingUpdateData
        })
      );
      
      // Restore the original method
      document.dispatchEvent = originalDispatchEvent;
    });
    
    test('clears drawing timeout on unmount', () => {
      // Mock clearTimeout
      jest.spyOn(global, 'clearTimeout');
      
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      
      joinRoom.mockReturnValue(mockSocket);
      
      const { unmount } = render(<Canvas roomId={mockRoomId} />);
      
      // Unmount component
      unmount();
      
      // Check if clearTimeout was called
      expect(clearTimeout).toHaveBeenCalled();
    });
  });
});