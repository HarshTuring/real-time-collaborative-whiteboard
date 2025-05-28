import React, { useRef, useEffect, useState } from 'react';
import { initializeSocket, joinRoom } from '../../services/socket';
import './Canvas.css';

const Canvas = ({ roomId }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentLine, setCurrentLine] = useState([]);

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
        ctx.strokeStyle = '#000000';

        // Initialize socket connection and join room
        const socketInstance = joinRoom(roomId);
        setSocket(socketInstance);

        // Handle incoming drawing data from other clients
        socketInstance.on('draw-line', (line) => {
            drawLine(ctx, line);
        });

        // Handle receiving full canvas state
        socketInstance.on('canvas-state', (canvasState) => {
            if (!canvasState || canvasState.length === 0) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Redraw all lines
            canvasState.forEach(line => {
                drawLine(ctx, line);
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
    }, [roomId]);

    // Function to draw a line from data
    const drawLine = (ctx, line) => {
        if (!line || line.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);

        for (let i = 1; i < line.length; i++) {
            ctx.lineTo(line[i].x, line[i].y);
        }

        ctx.stroke();
        ctx.closePath();
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

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

            // Send the completed line to server
            socket.emit('draw-line', {
                roomId,
                line: currentLine
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

    return (
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
    );
};

export default Canvas;