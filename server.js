require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3501
const allowedOrigins = require('./config/allowedOrigins')
const bodyParser = require('body-parser');
const {logger} = require('./middleware/logger')
const updateAvailableBalanceTask = require('./helpers/UpdateSubscriptionsIfExpired');


app.use(logger)

mongoose.set('strictQuery', true);

connectDB()

updateAvailableBalanceTask.innitScheduleJob();


app.use(cors(corsOptions));

app.use(
  cors({
    origin: { allowedOrigins },
    credentials: true,
    methods: ['POST', 'PUT', 'GET', 'PATCH', 'OPTIONS', 'HEAD', 'DELETE'],
  }),
)

app.use(express.json())
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/product', require('./routes/productRoutes'))
app.use('/users', require('./routes/userRoutes'));
app.use('/cart', require('./routes/cartRoutes'));
app.use('/orders', require('./routes/orderRoutes'));
app.use('/stripe/webhook', require('./routes/stripeRoutes'));
app.use('/payments', require('./routes/paymentRoutes'));
app.use('/categories', require('./routes/productCategoryRoutes'));
app.use('/aboutus', require('./routes/aboutUsRoutes'));
app.use('/message', require('./routes/messageRoutes'));






app.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ message: '404 Not Found' })
  } else {
    res.type('txt').send('404 Not Found')
  }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
  console.log(process.env.NODE_ENV)
  console.log('connected to mongo db')
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', (err) => {
  console.log(err)
})
