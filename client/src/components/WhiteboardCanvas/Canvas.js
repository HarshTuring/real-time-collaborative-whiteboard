import React, { useRef, useEffect, useState } from 'react';
import { initializeSocket, joinRoom } from '../../services/socket';
import './Canvas.css';

const Canvas = ({ roomId }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentLine, setCurrentLine] = useState([]);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentWidth, setCurrentWidth] = useState(3); // Add state for line width
    const [canvasReady, setCanvasReady] = useState(false);

    const colorPresets = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const widthPresets = [1, 3, 5, 8, 12]; // Common line width options

    // Initialize canvas and socket
    useEffect(() => {
        if (!roomId) return;

        const canvas = canvasRef.current;
        canvas.width = window.innerWidth - 40;
        canvas.height = window.innerHeight - 100;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = currentWidth; // Use current width
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;

        // Initialize socket connection and join room
        const socketInstance = joinRoom(roomId);
        setSocket(socketInstance);

        // Handle incoming drawing data from other clients
        socketInstance.on('draw-line', (lineData) => {
            if (lineData) {
                drawLine(ctx, lineData);
            }
        });

        // Handle receiving full canvas state
        socketInstance.on('canvas-state', (canvasState) => {
            if (!canvasState || canvasState.length === 0) {
                // Clear the canvas if we got an empty state
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Redraw all lines with their respective colors and widths
            canvasState.forEach(lineData => {
                drawLine(ctx, lineData);
            });
        });

        // Handle clear canvas event
        socketInstance.on('clear-canvas', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Handle window resize
        const handleResize = () => {
            // Save current canvas content
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Resize canvas
            canvas.width = window.innerWidth - 40;
            canvas.height = window.innerHeight - 100;

            // Restore canvas properties
            ctx.lineWidth = currentWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = currentColor;

            // Restore the canvas content
            ctx.putImageData(imageData, 0, 0);
        };

        window.addEventListener('resize', handleResize);
        setCanvasReady(true);

        // Cleanup socket connection
        return () => {
            socketInstance.off('draw-line');
            socketInstance.off('canvas-state');
            socketInstance.off('clear-canvas');
            window.removeEventListener('resize', handleResize);
        };
    }, [roomId]);

    // Update drawing properties when color or line width changes
    useEffect(() => {
        if (canvasRef.current && canvasReady) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentWidth;
        }
    }, [currentColor, currentWidth, canvasReady]);

    // Function to draw a line from data
    const drawLine = (ctx, lineData) => {
        if (!lineData) return;

        let points;
        let color;
        let width;

        // Handle different formats of line data
        if (Array.isArray(lineData)) {
            // Legacy format - just array of points
            points = lineData;
            color = '#000000'; // Default color
            width = 3; // Default width
        } else if (lineData.points && Array.isArray(lineData.points)) {
            // New format - object with points array, color, and width
            points = lineData.points;
            color = lineData.color || '#000000';
            width = lineData.width || 3;
        } else if (lineData.length >= 2) {
            // Old version might have array-like object with color/width properties
            points = lineData;
            color = lineData.color || '#000000';
            width = lineData.width || 3;
        } else {
            return; // Invalid format
        }

        if (points.length < 2) return;

        // Save current context settings
        const previousStrokeStyle = ctx.strokeStyle;
        const previousLineWidth = ctx.lineWidth;

        // Apply line settings
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
        ctx.closePath();

        // Restore previous context settings
        ctx.strokeStyle = previousStrokeStyle;
        ctx.lineWidth = previousLineWidth;
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Make sure current drawing settings are applied
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentWidth;

        const { offsetX, offsetY } = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);

        // Start a new line with the first point
        setCurrentLine([{ x: offsetX, y: offsetY }]);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { offsetX, offsetY } = getCoordinates(e);

        // Add point to current line
        setCurrentLine(prev => [...prev, { x: offsetX, y: offsetY }]);

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing && socket && currentLine.length > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            ctx.closePath();

            // Send the completed line to server with color and width
            socket.emit('draw-line', {
                roomId,
                line: {
                    points: currentLine,
                    color: currentColor,
                    width: currentWidth
                }
            });

            setIsDrawing(false);
            setCurrentLine([]);
        }
    };

    // Handle both mouse and touch events
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;

        if (e.type.includes('mouse')) {
            return {
                offsetX: e.nativeEvent.offsetX,
                offsetY: e.nativeEvent.offsetY
            };
        } else if (e.type.includes('touch')) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];

            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };
        }
    };

    // Handle color change
    const handleColorChange = (color) => {
        setCurrentColor(color);
    };

    // Handle line width change
    const handleWidthChange = (width) => {
        setCurrentWidth(width);
    };

    // Handle clearing the canvas
    const handleClearCanvas = () => {
        if (socket && roomId) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            socket.emit('clear-canvas', { roomId });
        }
    };

    return (
        <div>
            <div className="toolbar">
                {/* Color selection section */}
                <div className="toolbar-section">
                    <span>
                        Color:

                    </span>
                    <div className="color-presets">
                        {colorPresets.map((color) => (
                            <button
                                key={color}
                                className={`color-preset ${color === currentColor ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange(color)}
                                aria-label={`Select color ${color}`}
                            />
                        ))}
                    </div>
                    <div>
                        <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="color-picker"
                            aria-label="Select custom drawing color"
                        />
                    </div>
                </div>

                {/* Line width selection section */}
                <div>
                    <span>
                        Width:

                    </span>
                    <div className="width-presets">
                        {widthPresets.map((width) => (
                            <button
                                key={width}
                                onClick={() => handleWidthChange(width)}
                                aria-label={`Set line width to ${width}px`}
                                className={currentWidth === width ? 'selected' : ''}
                            >
                                <div className="width-preset-inner" style={{ height: `${width}px` }} />
                            </button>
                        ))}
                    </div>
                    <div>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={currentWidth}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                            className="width-slider"
                            aria-label="Adjust line width"
                        />
                        <span>
                            {currentWidth}px

                        </span>
                    </div>
                </div>

                {/* Clear Canvas Button */}
                <button onClick={handleClearCanvas}>
                    Clear Canvas
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="whiteboard-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
};

export default Canvas;