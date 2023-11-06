const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');


router
    .post('/', messageController.sendMessage)
    .get('/', messageController.getAllMessages)
    

module.exports = router;