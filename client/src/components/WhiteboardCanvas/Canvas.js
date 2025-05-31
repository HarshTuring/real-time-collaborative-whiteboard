import React, { useRef, useEffect, useState } from 'react';
import { initializeSocket, joinRoom } from '../../services/socket';
import './Canvas.css';

const Canvas = ({ roomId }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentLine, setCurrentLine] = useState([]);
    const [currentColor, setCurrentColor] = useState('#000000');

    const colorPresets = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

    // Initialize canvas and socket
    useEffect(() => {
        if (!roomId) return;

        const canvas = canvasRef.current;
        canvas.width = window.innerWidth - 40;
        canvas.height = window.innerHeight - 100;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 3;
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
            if (!canvasState || canvasState.length === 0) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Redraw all lines with their respective colors
            canvasState.forEach(lineData => {
                drawLine(ctx, lineData);
            });
        });

        // Handle window resize
        const handleResize = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.drawImage(canvas, 0, 0);

            canvas.width = window.innerWidth - 40;
            canvas.height = window.innerHeight - 100;

            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.drawImage(tempCanvas, 0, 0);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup socket connection
        return () => {
            socketInstance.off('draw-line');
            socketInstance.off('canvas-state');
            window.removeEventListener('resize', handleResize);
        };
    }, [roomId, currentColor]);

    // Function to draw a line from data, now handling both legacy and new formats
    const drawLine = (ctx, lineData) => {
        if (!lineData) return;

        let points;
        let color;

        // Handle different formats of line data
        if (Array.isArray(lineData)) {
            // Legacy format - just array of points
            points = lineData;
            color = '#000000'; // Default color
        } else if (lineData.points && Array.isArray(lineData.points)) {
            // New format - object with points array and color
            points = lineData.points;
            color = lineData.color || '#000000';
        } else if (lineData.length >= 2) {
            // Old version might have array-like object with color property
            points = lineData;
            color = lineData.color || '#000000';
        } else {
            return; // Invalid format
        }

        if (points.length < 2) return;

        // Set the line color
        ctx.strokeStyle = color;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
        ctx.closePath();
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set current stroke style from state
        ctx.strokeStyle = currentColor;

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

            // Send the completed line to server with proper structure including color
            socket.emit('draw-line', {
                roomId,
                line: {
                    points: currentLine,
                    color: currentColor
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

        // Also update the current context if canvas exists
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.strokeStyle = color;
        }
    };

    return (
        <div>
            <div className="color-toolbar">
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