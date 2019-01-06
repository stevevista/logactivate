const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name: String,
  version: String,
  applyTo: String,
  filename: String,
  storename: String,
  filesize: Number,
  description: String
}, {
  timestamps: true
})

const Package = mongoose.model('Package', schema)

module.exports = [
  Package
]
