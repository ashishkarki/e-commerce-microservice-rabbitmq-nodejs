const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const amqp = require('amqplib')

const Order = require('./models/Order')
const isAuthenticated = require('../isAuthenticated')
// configure env file
dotenv.config()

let channel, connection

// connect to mongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to mongoDB from Order-Service')
  })
  .catch((err) => {
    console.log(`Error connecting to mongoDB from Order-Service: ${err}`)
  })

// rabbit mq
async function connectToRabbitMQ() {
  // amqp.connect('amqp://example.username:example.password@localhost', (err, conn) => {});
  connection = await amqp.connect(process.env.AMQP_URL)
  channel = await connection.createChannel()

  await channel.assertQueue('ORDER')
}

function createOrder(products, userEmail) {
  let total = 0

  products.forEach((product) => {
    total += product.price
  })

  const order = new Order({
    products,
    user: userEmail,
    total_price: total,
  })

  order.save()

  return order
}

connectToRabbitMQ().then(() => {
  channel.consume('ORDER', (data) => {
    const { products, userEmail } = JSON.parse(data.content)

    console.log(
      `Received order: ${JSON.stringify(products)}, userEmail: ${userEmail}`,
    )
    channel.ack(data) // inform the queue that we have seen the data

    const order = createOrder(products, userEmail)

    console.log(
      `Order-service => index.js => Order created: ${JSON.stringify(order)}`,
    )

    // send order to the product service
    channel.sendToQueue('PRODUCT', Buffer.from(JSON.stringify(order)))
  })
})

// the express app
const app = express()

// middlewares
app.use(express.json())

// api endpoints
// create a new Order
app.post('/api/v1/Orders', isAuthenticated, (req, res) => {
  const { name, price, description } = req.body
  const Order = new Order({
    name,
    price,
    description,
  })

  return res.status(201).json({
    message: 'Order created successfully',
    Order,
  })
})

// buy a Order
app.post('/api/v1/Orders/buy', async (req, res) => {
  const { ids } = req.body

  const OrdersToBuy = await Order.find({ _id: { $in: ids } })
})

// listening setup
const PORT = process.env.PORT || 5003

app.listen(PORT, () => {
  console.log(`Order service is running on port ${PORT}`)
})
