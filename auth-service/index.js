const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

const userRouter = require('./routes/user.route')

// configure env file
dotenv.config()

// connect to mongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to mongoDB from Auth-Service')
  })
  .catch((err) => {
    console.log(`Error connecting to mongoDB from Auth-Service: ${err}`)
  })

// the express app
const app = express()

// middlewares
app.use(express.json())

// endpoints
app.use('/api/v1/auth', userRouter)

// login

// listening setup
const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`)
})
