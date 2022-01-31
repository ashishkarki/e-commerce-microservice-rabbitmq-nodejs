const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  created_at: {
    type: Date,
    default: Date.now,
  },
})

const Product = mongoose.model('product', productSchema)

module.exports = Product
