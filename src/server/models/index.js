'use strict'
const fs = require('fs')
const path = require('path')
const cluster = require('cluster')
const config = require('../config')
const mongoose = require('mongoose')

mongoose.connect(config.dbUrl, { useNewUrlParser: true })

const defines = []

const files = fs.readdirSync(__dirname)

for (const f of files) {
  if (f === 'index.js' || f === 'migration.js') {
    continue
  }

  const define = require(path.join(__dirname, f))
  defines.push(define)
}


const db = {}

function importModel(def) {
  if (typeof def === 'function' && def.modelName) {
    db[def.modelName] = def
  } else if (def instanceof Array) {
    for (const sub of def) {
      importModel(sub)
    }
  }
}

importModel(defines)

if (cluster.isMaster) {
  require('./migration')(db)
}

module.exports = db
/*
const {User, Log} = db
Log.find(function (err, logs) {
  console.log(logs)
})

Log.saveAttachment({
  log_id: '111',
  filename: 'abc'
})

const log = new Log({
  ip: '124',
  attachments: [
    {
      filename: '/path/log'
    }
  ]
})

log.save(()=> {
  console.log('saved')
})
*/
/*
User.find(function (err, kittens) {
  if (err) return console.error(err);
  console.log(kittens);
  kittens[3].verify('abcd').then((ret)=> {
    console.log('verify : ', ret)
  })
  kittens[3].updateOne({password: 'abcd'}, function() {
    console.log('updated!')
  })
})
*/
//db.Attachment.find(function (err, kittens) {
//  if (err) return console.error(err);
//  console.log(kittens);
//})

// console.log(db.Log)
