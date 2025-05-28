const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Room management routes
router.post('/create', roomController.createRoom);
router.get('/public', roomController.getPublicRooms);
router.get('/:roomId', roomController.getRoomDetails);
router.put('/:roomId/name', roomController.updateRoomName);
router.put('/:roomId/visibility', roomController.toggleRoomVisibility);
router.delete('/:roomId', roomController.deleteRoom);
router.get('/:roomId/access', roomController.checkRoomAccess);

module.exports = router;