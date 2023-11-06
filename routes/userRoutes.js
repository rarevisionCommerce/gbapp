const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')


router
    .get('/', userController.getAllUsers)
    .get('/account/:userId', userController.getUserById)
    .post('/', userController.createNewUser)
    .patch('/update/:userId/:status', userController.updateUserStatus)
    .delete('/delete/:userId', userController.deleteUser)
    .post('/subscribe', userController.addToSubscribedUsers)

module.exports = router;