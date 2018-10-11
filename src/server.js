'use strict'
const log4js = require('log4js')
const http = require('http')
const express = require('express')
const cluster = require('cluster')
const bodyParser = require('body-parser')
const {createTerminus} = require('@godaddy/terminus')
const config = require('./config')
const {start, stop} = require('./service')

log4js.configure(config.log)
const logger = log4js.getLogger()

const logging = require('./logging/log4js')
logging.configure({
  "filename": "logactivate2.log",
  "maxLogSize ": 31457280
})

logging.log('error', 'xxxx')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(require('./routes'))

const server = http.createServer(app)

createTerminus(server, {
  signal: 'SIGINT',
  onSignal () {
    if (cluster.isMaster) {
      console.log(process.id)
      stop()
    }
  }
})

const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  logger.info(`http server on ${config.port}, on ${numCPUs} cores`)

  start()

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork()

    worker.on('exit', (code, signal) => {
      console.log('--------', signal)
    })
  }

  cluster.on('listening', (worker, address) => {
    logger.debug(`start core: ${worker.id}`)
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(signal)
    logger.warn(`reboot core: ${worker.id}`)
    setTimeout(() => cluster.fork(), 2000)
  })
} else {
  server.listen(config.port)
}
