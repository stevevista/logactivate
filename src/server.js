'use strict'
const log4js = require('log4js')
const express = require('express')
const cluster = require('cluster')
const bodyParser = require('body-parser')
const config = require('./config')

log4js.configure(config.log)

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(require('./routes'))

const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('listening', (worker, address) => {
    console.log(`start pid: ${worker.process.pid}`)
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(`reboot pid: ${worker.process.pid}`)
    setTimeout(() => cluster.fork(), 2000)
  })
} else {
  app.listen(3000, () => console.log('Example app listening on port 3000!'))
}
