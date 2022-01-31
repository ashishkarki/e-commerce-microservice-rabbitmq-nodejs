const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  products: [
    {
      product_id: String,
    },
  ],
  user: String,
  total_price: Number,
  created_at: {
    type: Date,
    default: Date.now,
  },
})

const Order = mongoose.model('order', orderSchema)

module.exports = Order
