'use strict'
const mongoose = require('mongoose')
const uuid = require('uuid/v1')

const attachment = new mongoose.Schema({ 
  ip: String,
  filename: String,
  storename: String,
  size: Number,
  uploadedAt: Date
})

const schema = new mongoose.Schema({
  log_id: {type: String, unique: true},
  ip: String,
  imei: String,
  title: String,
  sn: String,
  lat: Number,
  lng: Number,
  sw_version: String,
  hw_version: String,
  data: {},
  attachments: [attachment]
}, {
  timestamps: true
})

schema.statics.saveAttachment = async function(doc) {
  let log
  if (doc.log_id) {
    log = await this.findOne({log_id: doc.log_id})
  } else {
    doc.log_id = uuid()
  }

  if (log) {
    for (const k in doc) {
      if (k === 'attachments') {
        if (!log.attachments) log.attachments = []
        log.attachments.push(doc.attachments[0])
      } else if (k === 'data') {
        if (!log.data) log.data = {}
        log.data = {...log.data, ...doc.data}
      } else {
        log[k] = doc[k]
      }
    }
  } else {
    log = new Log(doc)
  }
  await log.save()
}

const Log = mongoose.model('Log', schema)


module.exports = [
  Log
]
