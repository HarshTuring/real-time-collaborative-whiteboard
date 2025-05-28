import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home/Home';
import Room from './Room/Room';
import './App.css';

const App = () => {
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