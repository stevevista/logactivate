const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  productKey: String,
  deviceName: String,
  deviceSecret: String,
  brokerUrl: String
}, {
  timestamps: true
})

const Device = mongoose.model('Device', schema)

module.exports = [
  Device
]
