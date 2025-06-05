import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home/Home';
import Room from './Room/Room';
import './App.css';
import { getUserId } from '../services/api';

const App = () => {

    useEffect(() => {
        // Request a user ID when the app loads
        const initializeUserId = async () => {
            try {
                await getUserId();
            } catch (error) {
                console.error('Failed to initialize user ID:', error);
            }
        };
        
        initializeUserId();
    }, []);
    
    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />

                } />

                <Route path="/room/:roomId" element={<Room />

                } />

                <Route path="*" element={<Navigate to="/" replace />

                } />

            </Routes>
        </div>
    );
};

export default App;