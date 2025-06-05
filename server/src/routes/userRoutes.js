const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/id', userController.generateUserId);

module.exports = router;