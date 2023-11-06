const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');


router
    .post('/', cartController.stripeWebhook)
    

module.exports = router;