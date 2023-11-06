const express = require('express');
const router = express.Router();
const aboutUsController = require('../controllers/aboutUsController');


router
    .post('/', aboutUsController.updateAboutUs)
    .get('/', aboutUsController.getAboutUs)
    

module.exports = router;