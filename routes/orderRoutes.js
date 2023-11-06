const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT);

router
    .get('/:userId', orderController.getMyOrders)
    // .get('/productids/:userId', orderController.getMyOrdersProductIds)
    .post('/', orderController.placeOrder)
    .post('/pay-subscription', orderController.paySubscription)
    .get('/',orderController.getAllOrders)
    .patch('/mark-as-paid',orderController.markOrderAsPaid)


module.exports = router