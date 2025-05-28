import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Room management API calls
export const createNewRoom = async (name, isPrivate = false) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/create`, {
            name,
            isPrivate
        });
        return response.data;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
};

export const getPublicRooms = async () => {
    try {
        const response = await axios.get(`${API_URL}/rooms/public`);
        return response.data;
    } catch (error) {
        console.error('Error fetching public rooms:', error);
        throw error;
    }
};

export const getRoomDetails = async (roomId) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching room details:', error);
        throw error;
    }
};

export const checkRoomAccess = async (roomId) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/access`);
        return response.data;
    } catch (error) {
        console.error('Error checking room access:', error);
        return { success: false, message: error.response?.data?.message || 'Room not found' };
    }
};

export const updateRoomName = async (roomId, name) => {
    try {
        const response = await axios.put(`${API_URL}/rooms/${roomId}/name`, { name });
        return response.data;
    } catch (error) {
        console.error('Error updating room name:', error);
        throw error;
    }
};

export const toggleRoomVisibility = async (roomId) => {
    try {
        const response = await axios.put(`${API_URL}/rooms/${roomId}/visibility`);
        return response.data;
    } catch (error) {
        console.error('Error toggling room visibility:', error);
        throw error;
    }
};

export default {
    createNewRoom,
    getPublicRooms,
    getRoomDetails,
    checkRoomAccess,
    updateRoomName,
    toggleRoomVisibility
};