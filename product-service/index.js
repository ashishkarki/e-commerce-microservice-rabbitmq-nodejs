const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const amqp = require('amqplib')

const Product = require('./models/Product')
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
    console.log('Connected to mongoDB from Product-Service')
  })
  .catch((err) => {
    console.log(`Error connecting to mongoDB from Product-Service: ${err}`)
  })

// rabbit mq
async function connectToRabbitMQ() {
  // amqp.connect('amqp://example.username:example.password@localhost', (err, conn) => {});
  connection = await amqp.connect(process.env.AMQP_URL)
  channel = await connection.createChannel()
  // return { connection, channel }
  await channel.assertQueue('PRODUCT')
}

connectToRabbitMQ()

// the express app
const app = express()

// middlewares
app.use(express.json())

// api endpoints
// create a new product
app.post('/api/v1/products', isAuthenticated, (req, res) => {
  const { name, price, description } = req.body
  const newProduct = new Product({
    name,
    price,
    description,
  })

  newProduct.save()

  return res.status(201).json({
    message: 'Product created successfully',
    product: newProduct,
  })
})

// buy a product
app.post('/api/v1/products/buy', async (req, res) => {
  const { ids, email } = req.body

  const products = await Product.find({ _id: { $in: ids } })

  channel.sendToQueue(
    'ORDER',
    Buffer.from(
      JSON.stringify({
        products,
        userEmail: email,
      }),
    ),
  )

  // consume newly created order from order-service
  channel.consume('PRODUCT', (data) => {
    const order = JSON.parse(data.content)

    console.log(
      `Product-service => index.js => Placed order: ${JSON.stringify(order)}`,
    )

    channel.ack(data) // inform the queue that we have seen the data

    return res.status(201).json({
      message: 'Order created successfully',
      order,
    })
  })
})

// listening setup
const PORT = process.env.PORT || 5002

app.listen(PORT, () => {
  console.log(`Product service is running on port ${PORT}`)
})
